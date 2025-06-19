# @repo/database

Pure database utilities package cho Wibusystem microservices - cung cấp connection management và base repository patterns.

## ✨ Features

- **Bun SQL Native**: Sử dụng [Bun's built-in PostgreSQL client](https://bun.sh/docs/api/sql) cho performance tối ưu
- **Type Safety**: Full TypeScript support với strict typing
- **Base Models**: Shared base model pattern với các cột cố định
- **Base Repository**: Generic repository với đầy đủ CRUD operations
- **Connection Management**: Flexible connection configuration
- **No Business Logic**: Pure utilities - services tự định nghĩa models/repos riêng

## 🏗️ Architecture

```
@repo/database/
├── src/
│   ├── postgres/
│   │   └── connection.ts      # Connection management
│   ├── shared/
│   │   ├── base-model.ts      # Base model interface & utilities
│   │   └── base-repository.ts # Generic repository base class
│   └── index.ts               # Main exports
├── migrations/                # Example migration files
└── README.md
```

## 🚀 Installation

```bash
# Database package được auto-link trong monorepo
bun install
```

## 📖 Usage

### 1. Initialize Database Connection

```typescript
import { createDatabaseConnection, PostgresConfig } from "@repo/database";

// Trong service của bạn
const dbConfig: PostgresConfig = {
  host: "localhost",
  port: 5432,
  database: "auth_service",
  username: "postgres",
  password: "password",
  ssl: false,
  maxConnections: 10,
};

const db = await createDatabaseConnection(dbConfig);

// Test connection
const isConnected = await db.testConnection();
if (!isConnected) {
  throw new Error("Database connection failed");
}

// Get SQL instance
const sql = db.sql;
```

### 2. Define Your Models

```typescript
// apps/auth/src/models/user.ts
import { BaseModel } from "@repo/database";

export interface User extends BaseModel {
  username: string;
  email: string;
  password_hash: string;
  is_active: boolean;
  role: "user" | "admin";
}

export interface CreateUserData {
  username: string;
  email: string;
  password_hash: string;
  role?: "user" | "admin";
  lasted_user_modified: bigint;
}
```

### 3. Create Repository

```typescript
// apps/auth/src/repositories/user-repository.ts
import { BaseRepository, CreateModel, UpdateModel } from "@repo/database";
import { User } from "../models/user";

export class UserRepository extends BaseRepository<User> {
  protected tableName = "users";

  // Custom methods cho business logic
  async findByEmail(email: string): Promise<User | null> {
    return await this.findOne({ email });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.findOne({ username });
  }

  async findActiveUsers(): Promise<User[]> {
    return await this.findWhere({ is_active: true });
  }

  async deactivateUser(userId: bigint, adminId: bigint): Promise<User | null> {
    return await this.update(userId, { is_active: false }, adminId);
  }
}

// Initialize với connection
export function createUserRepository(sql: any) {
  return new UserRepository(sql);
}
```

### 4. Use trong Service

```typescript
// apps/auth/src/index.ts
import { Elysia } from "elysia";
import { createDatabaseConnection } from "@repo/database";
import { createUserRepository } from "./repositories/user-repository";

const dbConfig = {
  host: process.env.DB_HOST!,
  port: parseInt(process.env.DB_PORT!),
  database: process.env.DB_NAME!,
  username: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
};

const db = await createDatabaseConnection(dbConfig);
const userRepo = createUserRepository(db.sql);

const app = new Elysia()
  .post("/register", async ({ body }) => {
    const user = await userRepo.create(body, BigInt(0)); // System user
    return { success: true, user };
  })
  .get("/users/:id", async ({ params }) => {
    const user = await userRepo.findById(BigInt(params.id));
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  });

export default app;
```

### 5. Base Repository Methods

BaseRepository cung cấp các methods cơ bản:

```typescript
// CRUD operations
await repo.create(data, userId);
await repo.createMany(dataArray, userId);
await repo.findById(id);
await repo.findOne(conditions);
await repo.findWhere(conditions, options);
await repo.findAll(options); // with pagination
await repo.update(id, data, userId);
await repo.updateWhere(conditions, data, userId);
await repo.delete(id);
await repo.deleteWhere(conditions);

// Utility methods
await repo.count(conditions);
await repo.exists(id);
await repo.existsWhere(conditions);
await repo.upsert(data, conflictColumns, userId);
await repo.truncate();

// Advanced operations
await repo.transaction(async (tx, txRepo) => {
  // Operations trong transaction
});
await repo.batch([op1, op2, op3]);
await repo.getTableStats();

// Raw SQL
await repo.raw("SELECT * FROM users WHERE email = $1", [email]);
```

## 🗄️ Database Schema Pattern

Tất cả tables phải có base columns:

```sql
CREATE TABLE your_table (
    -- Base columns (required)
    id BIGSERIAL PRIMARY KEY,
    created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
    updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
    version INTEGER NOT NULL DEFAULT 1,
    lasted_user_modified BIGINT NOT NULL,

    -- Your specific columns here
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active'
);
```

## 🔄 Migrations

Mỗi service manage migrations riêng:

```typescript
// apps/your-service/src/migrations/index.ts
import { readdir, readFile } from "fs/promises";

export async function runMigrations(db: any) {
  const migrationFiles = await readdir("./src/migrations");
  const migrations = [];

  for (const file of migrationFiles.sort()) {
    if (file.endsWith(".sql")) {
      const content = await readFile(`./src/migrations/${file}`, "utf-8");
      migrations.push(content);
    }
  }

  await db.migrate(migrations);
}
```

## 🎯 Best Practices

### 1. Service Ownership

- Mỗi service có database config riêng
- Mỗi service manage models/repos của mình
- Shared data thông qua APIs, không shared database

### 2. Base Model Usage

```typescript
import { withBaseFields, withUpdateFields, BaseModel } from "@repo/database";

// For creation
const insertData = withBaseFields(userData, currentUserId);

// For updates
const updateData = withUpdateFields(userData, currentUserId);
```

### 3. Connection Management

```typescript
// Trong service startup
const db = await createDatabaseConnection(config);

// Cleanup on shutdown
process.on("SIGTERM", async () => {
  await db.close();
});
```

### 4. Transaction Usage

```typescript
await userRepo.transaction(async (tx, txRepo) => {
  const user = await txRepo.create(userData, adminId);
  await txRepo.updateWhere({ role: "admin" }, { last_login: now() }, adminId);
  return user;
});
```

## 🚦 Type Safety Examples

```typescript
// Models với proper typing
interface Novel extends BaseModel {
  title: string;
  author_id: bigint;
  status: "draft" | "published";
}

// Repository với type safety
class NovelRepository extends BaseRepository<Novel> {
  protected tableName = "novels";

  async findByStatus(status: Novel["status"]): Promise<Novel[]> {
    return await this.findWhere({ status });
  }
}

// Usage với full IntelliSense
const novels = await novelRepo.findByStatus("published"); // Type safe!
```

## 📄 Error Handling

```typescript
try {
  const user = await userRepo.findById(userId);
} catch (error) {
  if (error.code === "ERR_POSTGRES_CONNECTION_CLOSED") {
    // Handle connection error
    await db.testConnection();
  }
  throw error;
}
```

## 🤝 Service Integration Pattern

```typescript
// Service A cần data từ Service B
// ❌ Không access database trực tiếp
// ✅ Call API của Service B

// Service A
const userData = await fetch("http://user-service/api/users/123").then((r) =>
  r.json()
);

// Service B provides API
app.get("/api/users/:id", async ({ params }) => {
  return await userRepo.findById(BigInt(params.id));
});
```

## 📄 License

Private package cho Wibusystem project.

## 🔄 **Transaction Support trong CRUD Methods:**

Tất cả CRUD methods hiện support optional transaction parameter:

```typescript
// Sử dụng trong transaction
await repo.transaction(async (tx, repo) => {
  // Pass transaction vào các CRUD methods
  const user = await repo.create(userData, userId, tx);
  const profile = await repo.create(profileData, userId, tx);

  // Update với transaction
  await repo.update(user.id, { status: "active" }, userId, tx);

  // Delete với transaction
  await repo.delete(oldRecordId, tx);

  return { user, profile };
});

// Hoặc sử dụng manual transaction management
const db = await createDatabaseConnection(config);
const tx = await db.sql.begin(async (transaction) => {
  const user = await userRepo.create(userData, userId, transaction);
  const post = await postRepo.create(postData, userId, transaction);
  return { user, post };
});
```

## 🎯 **Advanced Transaction Patterns:**

### **1. Complex Business Operations:**

```typescript
class UserService {
  async registerWithProfile(userData: any, profileData: any) {
    return await userRepo.transaction(async (tx, repo) => {
      // Create user dengan transaction
      const user = await repo.create(userData, BigInt(0), tx);

      // Create profile trong cùng transaction
      const profile = await profileRepo.create(
        {
          ...profileData,
          user_id: user.id,
        },
        user.id,
        tx
      );

      // Update user stats
      await repo.update(
        user.id,
        {
          has_profile: true,
        },
        user.id,
        tx
      );

      return { user, profile };
    });
  }
}
```

### **2. Batch Operations với Transaction:**

```typescript
// Batch create với transaction
const results = await repo.transaction(async (tx, repo) => {
  const users = [];

  for (const userData of userDataArray) {
    const user = await repo.create(userData, adminId, tx);
    users.push(user);
  }

  return users;
});

// Hoặc sử dụng createMany
const users = await repo.transaction(async (tx, repo) => {
  return await repo.createMany(userDataArray, adminId, tx);
});
```
