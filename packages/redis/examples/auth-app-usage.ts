import {
  CacheManager,
  RateLimiter,
  RedisClient,
  SessionManager,
} from "@repo/redis";

/**
 * Example sử dụng Redis package trong Auth App
 * Demonstrates caching token info, rate limiting, and session management
 */

interface TokenData {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  expiresAt: number;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  lastLogin: number;
}

class AuthService {
  private redis: RedisClient;
  private cache: CacheManager;
  private sessions: SessionManager;
  private rateLimiter: RateLimiter;

  constructor() {
    // Initialize Redis client
    this.redis = new RedisClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
      maxConnections: 20,
    });

    // Initialize managers
    this.cache = new CacheManager(this.redis, {
      namespace: "auth:cache:",
      ttl: 900, // 15 minutes default
    });

    this.sessions = new SessionManager(this.redis, {
      prefix: "auth:session:",
      ttl: 86400, // 24 hours
    });

    this.rateLimiter = new RateLimiter(this.redis, {
      prefix: "auth:limit:",
      windowMs: 900000, // 15 minutes
    });
  }

  /**
   * Validate token với caching
   */
  async validateToken(token: string): Promise<TokenData | null> {
    const cacheKey = `token:${token}`;

    // Try cache first
    let tokenData = await this.cache.get<TokenData>(cacheKey);

    if (!tokenData) {
      // Simulate database lookup
      console.log("Token not in cache, fetching from database...");
      tokenData = await this.fetchTokenFromDatabase(token);

      if (tokenData) {
        // Cache token data until expiry
        const ttl = Math.max(
          0,
          Math.floor((tokenData.expiresAt - Date.now()) / 1000)
        );
        await this.cache.set(cacheKey, tokenData, ttl);
      }
    } else {
      console.log("Token found in cache");
    }

    // Check if token is expired
    if (tokenData && tokenData.expiresAt < Date.now()) {
      await this.cache.del(cacheKey);
      return null;
    }

    return tokenData;
  }

  /**
   * Rate limit login attempts
   */
  async checkLoginRateLimit(identifier: string): Promise<boolean> {
    const result = await this.rateLimiter.checkLimit(
      `login:${identifier}`,
      5, // 5 attempts
      900000 // per 15 minutes
    );

    if (result.limited) {
      console.log(
        `Rate limit exceeded for ${identifier}. Remaining: ${result.remaining}`
      );
      return false;
    }

    return true;
  }

  /**
   * Create login session
   */
  async createLoginSession(
    userId: string,
    userAgent: string,
    ip: string
  ): Promise<string> {
    const sessionData = {
      userId,
      userAgent,
      ip,
      loginTime: Date.now(),
      lastActivity: Date.now(),
    };

    return await this.sessions.create(userId, sessionData);
  }

  /**
   * Cache user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const cacheKey = `profile:${userId}`;

    // Check cache first
    let profile = await this.cache.get<UserProfile>(cacheKey);

    if (!profile) {
      console.log(
        `Profile not in cache for user ${userId}, fetching from database...`
      );
      profile = await this.fetchUserProfileFromDatabase(userId);

      if (profile) {
        // Cache for 1 hour
        await this.cache.set(cacheKey, profile, 3600);
      }
    }

    return profile;
  }

  /**
   * Invalidate user cache when profile updates
   */
  async invalidateUserCache(userId: string): Promise<void> {
    await Promise.all([
      this.cache.del(`profile:${userId}`),
      this.cache.del(`permissions:${userId}`),
      // Clear any token caches for this user (would need pattern matching in real app)
    ]);

    console.log(`Cache invalidated for user ${userId}`);
  }

  /**
   * Rate limit password reset attempts
   */
  async checkPasswordResetRateLimit(email: string): Promise<boolean> {
    const result = await this.rateLimiter.checkLimit(
      `password-reset:${email}`,
      3, // 3 attempts
      3600000 // per 1 hour
    );

    return !result.limited;
  }

  /**
   * Check for suspicious activity
   */
  async checkSuspiciousActivity(userId: string): Promise<boolean> {
    const sessions = await this.sessions.getUserSessions(userId);

    // Check for multiple active sessions from different IPs
    const uniqueIPs = new Set(sessions.map((s) => s.data.ip));

    if (uniqueIPs.size > 3) {
      console.log(
        `Suspicious activity detected for user ${userId}: ${uniqueIPs.size} different IPs`
      );
      return true;
    }

    return false;
  }

  /**
   * Cleanup expired tokens and sessions
   */
  async cleanupExpiredData(): Promise<void> {
    console.log("Starting cleanup of expired data...");

    // Cleanup sessions
    const cleanedSessions = await this.sessions.cleanup();
    console.log(`Cleaned up ${cleanedSessions} expired sessions`);

    // Note: Token cleanup would be handled by TTL automatically
    // But we could also manually scan and clean if needed
  }

  // Simulate database operations
  private async fetchTokenFromDatabase(
    token: string
  ): Promise<TokenData | null> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Mock token data
    if (token === "valid-token-123") {
      return {
        userId: "user-123",
        email: "user@example.com",
        role: "admin",
        permissions: ["read", "write", "delete"],
        expiresAt: Date.now() + 3600000, // 1 hour from now
      };
    }

    return null;
  }

  private async fetchUserProfileFromDatabase(
    userId: string
  ): Promise<UserProfile | null> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Mock user data
    return {
      id: userId,
      email: "user@example.com",
      name: "John Doe",
      role: "admin",
      lastLogin: Date.now(),
    };
  }
}

// Example usage
async function authAppExample() {
  const authService = new AuthService();

  console.log("=== Auth App Redis Usage Example ===\n");

  // 1. Check rate limit for login
  const canLogin = await authService.checkLoginRateLimit("user@example.com");
  console.log("Can login:", canLogin);

  if (canLogin) {
    // 2. Validate token
    const tokenData = await authService.validateToken("valid-token-123");
    console.log("Token validation result:", tokenData);

    if (tokenData) {
      // 3. Create session
      const sessionId = await authService.createLoginSession(
        tokenData.userId,
        "Mozilla/5.0 Chrome/91.0",
        "192.168.1.100"
      );
      console.log("Session created:", sessionId);

      // 4. Get user profile (will cache)
      const profile1 = await authService.getUserProfile(tokenData.userId);
      console.log("Profile (first fetch):", profile1);

      // 5. Get user profile again (from cache)
      const profile2 = await authService.getUserProfile(tokenData.userId);
      console.log("Profile (from cache):", profile2);

      // 6. Check suspicious activity
      const suspicious = await authService.checkSuspiciousActivity(
        tokenData.userId
      );
      console.log("Suspicious activity:", suspicious);

      // 7. Invalidate cache
      await authService.invalidateUserCache(tokenData.userId);
    }
  }

  // 8. Check password reset rate limit
  const canResetPassword =
    await authService.checkPasswordResetRateLimit("user@example.com");
  console.log("Can reset password:", canResetPassword);

  // 9. Cleanup expired data
  await authService.cleanupExpiredData();

  console.log("\n✅ Auth app example completed!");
}

if (import.meta.main) {
  authAppExample().catch(console.error);
}
