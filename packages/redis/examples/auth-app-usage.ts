/**
 * Auth service sử dụng Redis để cache token, manage session và rate limiting
 */

import {
  CacheManager,
  RateLimiter,
  RedisClient,
  SessionManager,
} from "@repo/redis";

interface TokenData {
  userId: number;
  email: string;
  role: string;
  permissions: string[];
  expiresAt: number;
}

interface UserProfile {
  id: number;
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
    this.redis = new RedisClient({
      url: "redis://localhost:6379",
      maxConnections: 10,
    });

    this.cache = new CacheManager(this.redis);
    this.sessions = new SessionManager(this.redis);
    this.rateLimiter = new RateLimiter(this.redis);

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.redis.on("error", (error) => {
      console.error("Redis connection error:", error);
    });

    this.redis.on("connect", () => {
      console.log("Connected to Redis");
    });
  }

  /**
   * Rate limiting cho authentication endpoint
   */
  private async setupAuthRateLimit(): Promise<void> {
    // Rate limiting sẽ được setup trong checkLoginRateLimit method
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
    userId: number,
    deviceId: string,
    userAgent: string,
    ip: string
  ): Promise<string> {
    const sessionData = {
      userAgent,
      ip,
      loginTime: Date.now(),
      lastActivity: Date.now(),
    };

    return await this.sessions.create(userId, deviceId, sessionData);
  }

  /**
   * Cache user profile
   */
  async getUserProfile(userId: number): Promise<UserProfile | null> {
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
  async invalidateUserCache(userId: number): Promise<void> {
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
  async checkSuspiciousActivity(userId: number): Promise<boolean> {
    const sessions = await this.sessions.getUserSessions(userId);

    // Check for multiple active sessions
    if (sessions.length > 5) {
      console.log(
        `Suspicious activity detected for user ${userId}: ${sessions.length} active sessions`
      );
      return true;
    }

    return false;
  }

  /**
   * Logout user from all devices
   */
  async logoutFromAllDevices(userId: number): Promise<number> {
    return await this.sessions.destroyUserSessions(userId);
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
        userId: 123,
        email: "user@example.com",
        role: "admin",
        permissions: ["read", "write", "delete"],
        expiresAt: Date.now() + 3600000, // 1 hour from now
      };
    }

    return null;
  }

  private async fetchUserProfileFromDatabase(
    userId: number
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
async function demonstrateAuthService() {
  const authService = new AuthService();
  const userId = 123;
  const deviceId = "device-mobile-001";

  try {
    // Test rate limiting
    const canLogin = await authService.checkLoginRateLimit("user@example.com");
    if (!canLogin) {
      console.log("Login rate limited");
      return;
    }

    // Validate token
    const tokenData = await authService.validateToken("valid-token-123");
    console.log("Token validation result:", tokenData);

    // Create session
    const sessionId = await authService.createLoginSession(
      userId,
      deviceId,
      "Mozilla/5.0...",
      "192.168.1.1"
    );
    console.log("Session created:", sessionId);

    // Get user profile
    const profile = await authService.getUserProfile(userId);
    console.log("User profile:", profile);

    // Check for suspicious activity
    const suspicious = await authService.checkSuspiciousActivity(userId);
    console.log("Suspicious activity:", suspicious);

    // Logout from all devices
    const loggedOutSessions = await authService.logoutFromAllDevices(userId);
    console.log("Logged out sessions:", loggedOutSessions);

    // Cleanup
    await authService.cleanupExpiredData();
  } catch (error) {
    console.error("Error in auth service demo:", error);
  }
}

// Run demonstration
if (require.main === module) {
  demonstrateAuthService().catch(console.error);
}

export { AuthService };
