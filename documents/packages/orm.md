# PG ORM

Package ORM được thiết kế để tương tác với PostgreSQL, tập trung vào sự đơn giản, hiệu năng và các tính năng cần thiết cho dự án nội bộ. ORM này không phụ thuộc vào bất kỳ framework cụ thể nào và được viết hoàn toàn bằng TypeScript.

## 1. Mục tiêu và Triết lý Thiết kế

- **Không phụ thuộc framework (Framework-Agnostic):** Có thể sử dụng trong mọi dự án TypeScript.
- **Sử dụng `pg`:** Tận dụng thư viện `pg` (node-postgres) cho tất cả các tương tác với database.
- **API trực quan và dễ sử dụng:** Ưu tiên sự đơn giản và trải nghiệm tốt cho lập trình viên.
- **TypeScript là trung tâm (TypeScript-First):** Đảm bảo type safety, tự động hoàn thành code, và tránh `any`.
- **Hiệu năng và Bảo mật:** Chú trọng đến việc thực thi truy vấn hiệu quả và SQL injection.
- **Tập trung vào nhu cầu nội bộ:** Ưu tiên các tính năng cần thiết cho dự án hiện tại, không bao gồm các mối quan hệ (relationships) phức tạp ở giai đoạn này.

## 2. Các Tính năng Cốt lõi Tập trung

### 2.1. Quản lý Kết nối (Connection Management)

- Sử dụng `pg` để thiết lập và quản lý kết nối đến PostgreSQL.
- **Khởi tạo một lần duy nhất (Singleton Pattern):** Connection pool sẽ được khởi tạo một lần duy nhất trong suốt vòng đời của ứng dụng để tối ưu tài nguyên và đảm bảo tính nhất quán.
- Hỗ trợ connection pooling để tối ưu hiệu năng.
- Cung cấp API để cấu hình thông tin kết nối (host, port, user, password, database) cho lần khởi tạo đầu tiên.

### 2.2. Định nghĩa Model (Đơn giản hóa)

- Cung cấp cơ chế để định nghĩa cấu trúc của bảng và các trường dữ liệu tương ứng.
- Tự động map tên giữa quy ước `PascalCase` (trong code) và `snake_case` (trong database cho tên cột).
- Giai đoạn đầu sẽ không tập trung vào các class Model phức tạp, có thể sử dụng interface hoặc object schema đơn giản.

### 2.3. Truy vấn Dữ liệu Cơ bản (Basic Querying)

- **Query Builder cho CRUD:**
  - API fluent để xây dựng các câu lệnh `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
  - Hỗ trợ các mệnh đề cơ bản như `WHERE`, `ORDER BY`, `LIMIT`, `OFFSET`.
- **Gọi Stored Procedures:**
  - Phương thức dễ dàng để gọi các stored procedures trong PostgreSQL và nhận kết quả trả về.
  - Ví dụ: `db.callProcedure('my_procedure_name', [param1, param2])`
- **Hỗ trợ Full-Text Search:**

  - Tích hợp khả năng thực hiện truy vấn full-text search của PostgreSQL.
  - Query Builder sẽ cung cấp các phương thức để làm việc với cột `tsvector` và hàm `to_tsquery` (hoặc `plainto_tsquery`, `phraseto_tsquery`, `websearch_to_tsquery`).
  - API thân thiện trong Query Builder, ví dụ:

    ```typescript
    // Tìm kiếm đơn giản
    db.select()
      .from("documents")
      .whereTsVectorMatches("content_vector", "search term")
      .execute();

    // Tìm kiếm với ngôn ngữ cụ thể và ranking
    db.select(["title", "ts_rank_cd(content_vector, query) AS rank"])
      .from("documents")
      .whereTsVectorMatches("content_vector", "search term", {
        queryFunction: "plainto_tsquery", // hoặc 'to_tsquery', 'phraseto_tsquery', 'websearch_to_tsquery'
        config: "english", // Ngôn ngữ FTS
        rank: {
          function: "ts_rank_cd", // hoặc 'ts_rank'
          normalization: 32, // Tùy chọn
          weights: [0.1, 0.2, 0.4, 1.0], // Tùy chọn
        },
      })
      .orderBy("rank", "DESC")
      .execute();
    ```

  - ORM cần hỗ trợ việc tạo index GIN hoặc GiST trên các cột `tsvector` để đảm bảo hiệu năng truy vấn.

### 2.4. Giao dịch (Transactions)

- Cung cấp API để thực hiện nhiều thao tác database trong một giao dịch duy nhất, đảm bảo tính toàn vẹn dữ liệu (ACID).
- Ví dụ: `db.transaction(async (transactionClient) => { /* các thao tác với transactionClient */ })`

### 2.5. Schema Migrations

- **Công cụ Migration:**
  - Phát triển một công cụ hoặc cơ chế để tạo và quản lý các file migration.
  - Mỗi migration file sẽ chứa các thay đổi schema (tạo bảng, sửa cột, tạo index) bằng SQL thuần hoặc API của ORM (nếu có).
- **Quản lý Migrations:**
  - Cung cấp các lệnh (CLI hoặc hàm) để chạy migrations (`up`), rollback (`down`), và kiểm tra trạng thái.
  - Lịch sử migration sẽ được lưu trữ trong một bảng riêng trong database.

### 2.6. Xử lý Lỗi (Error Handling)

- ORM sẽ ném ra các lớp lỗi (custom error classes) cụ thể để người dùng có thể bắt và xử lý một cách tường minh. Ví dụ: `QueryFailedError`, `ConnectionError`, `MigrationError`, `TransactionError`.
- Thông điệp lỗi sẽ cố gắng cung cấp đủ ngữ cảnh để gỡ lỗi.

### 2.7. Ánh xạ Kiểu dữ liệu (Data Type Mapping)

- ORM sẽ tự động xử lý việc chuyển đổi giữa các kiểu dữ liệu TypeScript và PostgreSQL. Các quy tắc ánh xạ chính bao gồm:
  - **`string`** (TypeScript) <-> `TEXT`, `VARCHAR`, `CHAR`, etc. (PostgreSQL).
  - **`number`** (TypeScript) <-> `INTEGER`, `BIGINT`, `SMALLINT`, `NUMERIC`, `REAL`, `DOUBLE PRECISION`, etc. (PostgreSQL), tùy theo cấu hình hoặc độ lớn của số.
  - **`boolean`** (TypeScript) <-> `SMALLINT` (PostgreSQL): `true` được lưu thành `1`, `false` được lưu thành `0`.
  - **`Date`** (TypeScript) <-> `BIGINT` (PostgreSQL): Đối tượng `Date` trong TypeScript sẽ được chuyển đổi thành Unix timestamp (số mili giây hoặc giây kể từ 1/1/1970 UTC) và lưu trữ dưới dạng `BIGINT`. Khi đọc ra, giá trị `BIGINT` sẽ được chuyển đổi ngược lại thành đối tượng `Date`.
  - **`Array`** (TypeScript) <-> `ARRAY` (PostgreSQL) cho các kiểu dữ liệu cơ bản (ví dụ: `string[]` <-> `TEXT[]`).
  - **`object` / `any`** (TypeScript) <-> `JSONB` hoặc `JSON` (PostgreSQL) cho dữ liệu có cấu trúc động.
  - **`string` (đại diện cho `tsvector` / `tsquery`)** (TypeScript) <-> `TSVECTOR` / `TSQUERY` (PostgreSQL): Các kiểu dữ liệu FTS của PostgreSQL sẽ được xử lý như chuỗi trong mã TypeScript. Việc tạo và chuyển đổi giá trị (ví dụ: dùng `to_tsvector()`) thường được thực hiện ở phía database hoặc thông qua các hàm của Query Builder.
- Người dùng có thể cần chỉ định rõ kiểu PostgreSQL trong một số trường hợp để đảm bảo độ chính xác.

### 2.8. Quy ước Đặt tên (Naming Conventions)

- **Tên Bảng (Tables):** Mặc định sử dụng `snake_case` và ở dạng số nhiều (ví dụ: `users`, `blog_posts`, `product_categories`). ORM sẽ cung cấp cách để ghi đè tên bảng nếu cần.
- **Tên Cột (Columns):** Như đã đề cập, `snake_case` trong database, tương ứng với `camelCase` hoặc `PascalCase` (cho thuộc tính model) trong code TypeScript.
- **Primary Keys:** Mặc định là `id`.
- **Foreign Keys:** (Hiện tại chưa tập trung) Sẽ theo quy ước `[tên_bảng_tham_chiếu_số_ít]_id` (ví dụ: `user_id` trong bảng `posts`).

### 2.9. Logging (Ghi Log)

- ORM sẽ cung cấp một cơ chế logging tùy chọn, cho phép người dùng ghi lại các câu lệnh SQL được thực thi, thời gian thực thi, và các tham số đi kèm.
- Có thể cấu hình mức độ log (ví dụ: debug, info, warn, error) và nơi xuất log (console, file).
- Tính năng này rất hữu ích cho việc gỡ lỗi và theo dõi hiệu năng.

### 2.10. Bảo mật (Security)

- **Chống SQL Injection:** Đây là ưu tiên hàng đầu. Tất cả các giá trị đầu vào từ người dùng sẽ được truyền vào câu lệnh SQL thông qua parameterized queries (biến thay thế). ORM sẽ không bao giờ ghép chuỗi trực tiếp giá trị vào câu lệnh SQL.
- Các biện pháp bảo mật khác sẽ được xem xét nếu cần thiết.

## 3. Cấu trúc Package (Gợi ý Ban đầu)

```
orm/
├── src/
│   ├── connection/         # Quản lý kết nối DB
│   │   ├── connection-manager.ts
│   │   └── types.ts
│   ├── query-builder/      # Xây dựng và thực thi truy vấn
│   │   ├── query-builder.ts
│   │   └── types.ts
│   ├── migrations/         # Quản lý schema migrations
│   │   ├── migration-runner.ts
│   │   ├── migration-template.ts
│   │   └── types.ts
│   ├── transaction/        # Quản lý transactions
│   │   └── transaction-manager.ts
│   ├── model/              # (Đơn giản hóa) Định nghĩa schema, metadata
│   ├── errors/             # Định nghĩa các lớp lỗi tùy chỉnh
│   ├── logger/             # Module cho logging (nếu tách riêng)
│   ├── types/              # Các kiểu dữ liệu chung của ORM
│   ├── utils/              # Các hàm tiện ích (vd: naming-strategy)
│   └── index.ts            # Entry point, export các module chính
│
├── examples/               # Ví dụ sử dụng
│   └── basic-usage.ts
│   └── migrations-example/
│       └── 001_create_users_table.ts
│
├── package.json
├── tsconfig.json
├── README.md               # Sẽ chi tiết hơn khi phát triển
└── .gitignore
```

## 4. Công nghệ và Thư viện Chính

- **Ngôn ngữ:** TypeScript
- **Database Client:** `pg` (node-postgres)
- **Định dạng code:** Prettier (theo quy tắc đã định)
- **(Tùy chọn cho Migration CLI):** `commander` hoặc `yargs`

## 5. Ví dụ Sử dụng Sơ lược (Illustrative Example)

```typescript
// Lưu ý: Đây chỉ là ví dụ minh họa API, có thể thay đổi trong quá trình phát triển.
import { OrmFactory, QueryResult } from "./orm"; // Giả sử tên package là 'orm'

interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean; // Sẽ được map sang SMALLINT (0 hoặc 1)
  created_at: Date; // Sẽ được map sang BIGINT (Unix timestamp)
}

async function main() {
  // Khởi tạo ORM (ConnectionManager sẽ được quản lý nội bộ dạng Singleton)
  const db = await OrmFactory.initialize({
    host: "localhost",
    port: 5432,
    user: "your_user",
    password: "your_password",
    database: "your_database",
    // Tùy chọn logging
    logging: true, // hoặc ['query', 'error'] hoặc một logger function
  });

  try {
    // Truy vấn SELECT
    const activeUsers: QueryResult<User[]> = await db
      .select<User>(["id", "username", "email", "created_at"])
      .from("users") // Tên bảng theo quy ước
      .where({ is_active: true, username: "LIKE %john%" })
      .orderBy("created_at", "DESC")
      .limit(10)
      .execute();

    if (activeUsers.rowCount > 0) {
      console.log("Active users:", activeUsers.rows);
      activeUsers.rows.forEach((user) => {
        console.log(
          `User: ${user.username}, Created: ${user.created_at.toISOString()}`
        );
      });
    }

    // Ví dụ Full-Text Search
    interface Document {
      id: number;
      title: string;
      content_vector: string; // Đại diện cho tsvector
      // ... các trường khác
    }
    const searchResults = await db
      .select<Document>()
      .from("documents")
      .whereTsVectorMatches("content_vector", "typescript ORM", {
        config: "english",
      })
      .execute();

    console.log("Search results:", searchResults.rows);

    // Gọi Stored Procedure
    const result = await db.callProcedure("get_user_count", [true]);
    console.log("User count from SP:", result.rows);

    // Thực hiện Transaction
    await db.transaction(async (trxClient) => {
      await trxClient
        .insert<User>("users", [
          {
            username: "new_user",
            email: "new@example.com",
            is_active: true,
            created_at: new Date(),
          },
        ])
        .execute();
      // Các thao tác khác trong transaction
    });
  } catch (error) {
    // Xử lý lỗi từ ORM (ví dụ: QueryFailedError)
    console.error("An error occurred:", error.message);
  } finally {
    // Đóng kết nối (ORM có thể tự quản lý việc này khi ứng dụng kết thúc)
    // await OrmFactory.close();
  }
}

main();
```

## 6. Các Bước Phát triển Tiếp theo (Dự kiến)

1.  **Thiết kế API chi tiết** cho từng module (Connection, Query Builder, Transactions, Migrations, Error Handling, Logging).
2.  **Triển khai `ConnectionManager`** sử dụng `pg` (Singleton Pattern).
3.  **Xây dựng `QueryBuilder`** với các tính năng CRUD, Stored Procedure call, Full-Text Search và ánh xạ kiểu dữ liệu.
4.  **Triển khai `TransactionManager`**.
5.  **Phát triển hệ thống `Schema Migrations`**.
6.  **Hoàn thiện cơ chế Error Handling và Logging**.
7.  Viết tài liệu README chi tiết và các ví dụ sử dụng nâng cao.
8.  (Sau này) Bổ sung unit tests và integration tests.

---

_Lưu ý: Đây là tài liệu phác thảo ban đầu và sẽ được cập nhật chi tiết hơn trong quá trình phát triển._
