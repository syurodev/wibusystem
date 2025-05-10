# @repo/orm - PostgreSQL ORM

Package `@repo/orm` là một Object-Relational Mapper (ORM) được thiết kế để tương tác với cơ sở dữ liệu PostgreSQL. ORM này tập trung vào sự đơn giản, hiệu năng và cung cấp các tính năng cần thiết cho các dự án nội bộ sử dụng TypeScript.

## 1. Mục tiêu và Triết lý Thiết kế

- **Không phụ thuộc framework (Framework-Agnostic):** Có thể tích hợp vào bất kỳ dự án TypeScript nào.
- **Sử dụng `pg`:** Tận dụng thư viện `pg` (node-postgres) cho tất cả các tương tác với database, đảm bảo hiệu suất và độ tin cậy.
- **API trực quan và dễ sử dụng:** Ưu tiên sự đơn giản và trải nghiệm tốt cho lập trình viên.
- **TypeScript là trung tâm (TypeScript-First):** Đảm bảo an toàn kiểu (type safety), hỗ trợ tự động hoàn thành code (autocompletion), và hạn chế tối đa việc sử dụng `any`.
- **Hiệu năng và Bảo mật:** Chú trọng đến việc thực thi truy vấn hiệu quả và ngăn chặn SQL injection thông qua parameterized queries.
- **Tập trung vào nhu cầu nội bộ:** Ưu tiên các tính năng thiết yếu, với kế hoạch mở rộng trong tương lai.

## 2. Các Tính năng Hiện tại

### 2.1. Quản lý Kết nối (Connection Management)

- **Khởi tạo và Đóng kết nối:** Dễ dàng khởi tạo và đóng kết nối đến PostgreSQL thông qua `OrmFactory`.

  ```typescript
  import { OrmFactory, ConnectionConfig, OrmClient } from "@repo/orm";

  const dbConfig: ConnectionConfig = {
    user: "your_user",
    password: "your_password",
    database: "your_database",
    host: "localhost", // Tùy chọn, mặc định là 'localhost'
    port: 5432, // Tùy chọn, mặc định là 5432
    // logging: true   // Bật logging để xem các truy vấn SQL
  };

  let ormClient: OrmClient;

  async function connect() {
    ormClient = await OrmFactory.initialize(dbConfig);
    console.log("Kết nối ORM thành công!");
  }

  async function disconnect() {
    await OrmFactory.close();
    console.log("Đã đóng kết nối ORM.");
  }
  ```

- **Connection Pooling:** Tích hợp sẵn connection pooling từ thư viện `pg` để tối ưu hiệu năng.
- **Singleton Pattern:** `ConnectionManager` được quản lý dưới dạng Singleton, đảm bảo một kết nối pool duy nhất trong toàn ứng dụng.

### 2.2. Thực thi Truy vấn SQL Trực tiếp

- `OrmClient` cung cấp phương thức `query()` để thực thi các câu lệnh SQL thuần.
  ```typescript
  async function getUsers() {
    if (!ormClient) return;
    try {
      const result = await ormClient.query(
        "SELECT * FROM users WHERE status = $1",
        ["active"]
      );
      console.log("Users:", result.rows);
      return result.rows;
    } catch (error) {
      console.error("Lỗi khi truy vấn users:", error);
    }
  }
  ```

### 2.3. Định nghĩa Model và Ánh xạ Cơ bản

- Sử dụng decorators TypeScript (`@Entity`, `@Column`, `@PrimaryColumn`, etc.) để định nghĩa cấu trúc model và ánh xạ với các bảng trong cơ sở dữ liệu.
- `OrmClient` cung cấp các phương thức `toDatabase` và `fromDatabase` (thông qua `ModelManager` nội bộ) để hỗ trợ chuyển đổi cơ bản giữa đối tượng model và dữ liệu database.

  ```typescript
  import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    BaseEntity,
  } from "@repo/orm";

  @Entity("users") // Tên bảng trong database
  class User extends BaseEntity {
    @Column()
    username: string;

    @Column({ name: "email_address" }) // Chỉ định tên cột khác nếu cần
    email: string;

    @Column({ type: "boolean", default: true })
    is_active: boolean;
  }

  // Đăng ký model với ModelManager (thường được thực hiện ngầm khi sử dụng các decorator)
  // Hiện tại, việc đăng ký và sử dụng ModelManager chi tiết hơn đang được hoàn thiện.
  ```

  // Ngoài ra, `OrmClient` còn cung cấp các phương thức để lấy thông tin metadata từ model đã định nghĩa:

  ```typescript
  // (Giả sử ormClient đã được khởi tạo như trong các ví dụ khác,
  // và ModelManager đã xử lý metadata cho model 'User' được định nghĩa ở trên)

  // Ví dụ lấy tên bảng của model 'User'
  const tableUser = ormClient.getTableName("User");
  console.log(`Tên bảng của User: ${tableUser}`);
  // Kết quả mong đợi: "users"

  // Ví dụ lấy tên cột cho thuộc tính 'username' của model 'User'
  // (ORM sẽ tự động chuyển đổi camelCase 'username' thành snake_case 'user_name' theo quy ước)
  const columnUsername = ormClient.getColumnName("User", "username");
  console.log(`Tên cột cho thuộc tính 'username': ${columnUsername}`);
  // Kết quả mong đợi: "user_name"

  // Ví dụ lấy tên cột cho thuộc tính 'email' của model 'User'
  // (Tên cột này được ghi đè trực tiếp trong decorator @Column({ name: "email_address" }))
  const columnEmail = ormClient.getColumnName("User", "email");
  console.log(`Tên cột cho thuộc tính 'email': ${columnEmail}`);
  // Kết quả mong đợi: "email_address"

  // Ví dụ lấy tên cột cho thuộc tính 'id' (kế thừa từ BaseEntity)
  const columnId = ormClient.getColumnName("User", "id");
  console.log(`Tên cột cho thuộc tính 'id': ${columnId}`);
  // Kết quả mong đợi: "id"
  ```

### 2.4. Xử lý Lỗi (Error Handling)

- ORM cung cấp các lớp lỗi tùy chỉnh (custom error classes) kế thừa từ `OrmError` (ví dụ: `ConnectionError`, `QueryFailedError`, `PoolNotInitializedError`, `ModelError`).
- Mỗi instance lỗi đều chứa:
  - `name`: Tên của lớp lỗi (ví dụ: `'QueryFailedError'`).
  - `message`: Mô tả chi tiết về lỗi.
  - `code`: Một mã lỗi từ enum `OrmErrorCode` để phân loại lỗi một cách chương trình.
  - Các thuộc tính bổ sung tùy theo loại lỗi (ví dụ: `QueryFailedError` có thể chứa `query` và `parameters`).

**Cách xử lý lỗi:**

1.  **Sử dụng `instanceof` (khuyến khích cho type safety):**

    ```typescript
    import {
      OrmError,
      QueryFailedError,
      ConnectionError,
      OrmErrorCode,
    } from "@repo/orm";

    async function someOrmOperation() {
      try {
        // Thực hiện thao tác với ormClient
        // const data = await ormClient.query("SELECT * FROM non_existent_table");
      } catch (error) {
        if (error instanceof QueryFailedError) {
          console.error("Lỗi truy vấn cụ thể:", error.message);
          console.error("SQL:", error.query); // Truy cập thuộc tính riêng của QueryFailedError
          console.error("Mã lỗi:", error.code); // Mã lỗi: OrmErrorCode.QUERY_FAILED_ERROR
        } else if (error instanceof ConnectionError) {
          console.error("Lỗi kết nối:", error.message);
          console.error("Mã lỗi:", error.code); // Mã lỗi: OrmErrorCode.CONNECTION_ERROR hoặc PoolNotInitializedError
        } else if (error instanceof OrmError) {
          // Bắt các lỗi ORM chung khác nếu cần
          console.error("Lỗi ORM chung:", error.message, "Mã lỗi:", error.code);
        } else {
          // Lỗi không xác định
          console.error("Lỗi không xác định:", error);
        }
      }
    }
    ```

2.  **Sử dụng `error.code` với `OrmErrorCode` enum:**

    ```typescript
    import { OrmErrorCode } from "@repo/orm"; // Giả sử error là một instance của OrmError

    // ... trong khối catch (error)
    // if (error instanceof OrmError) { // Nên kiểm tra instanceof OrmError trước
    //   switch (error.code) {
    //     case OrmErrorCode.QUERY_FAILED_ERROR:
    //       console.error("Xử lý lỗi truy vấn thất bại dựa trên mã lỗi.", error.message);
    //       // const queryError = error as QueryFailedError; // Type cast nếu cần truy cập thuộc tính riêng
    //       // console.log(queryError.query)
    //       break;
    //     case OrmErrorCode.CONNECTION_ERROR:
    //     case OrmErrorCode.POOL_NOT_INITIALIZED_ERROR:
    //       console.error("Xử lý lỗi kết nối dựa trên mã lỗi.", error.message);
    //       break;
    //     case OrmErrorCode.MODEL_NOT_REGISTERED_ERROR:
    //       console.error("Model chưa đăng ký:", error.message);
    //       break;
    //     // Thêm các case khác cho các mã lỗi cần thiết
    //     default:
    //       console.error("Lỗi ORM không xác định với mã:", error.code, error.message);
    //   }
    // }
    ```

    _Lưu ý khi dùng `error.code`:_ Để truy cập các thuộc tính cụ thể của từng loại lỗi (như `error.query`), bạn có thể cần thực hiện type assertion (ví dụ: `error as QueryFailedError`) sau khi đã xác định loại lỗi bằng `error.code` hoặc `instanceof`.

### 2.5. Logging

- Hỗ trợ logging tùy chọn cho các truy vấn SQL và các thông báo lỗi. Có thể cấu hình qua `ConnectionConfig`.

## 3. Ví dụ Sử dụng Tổng quan

```typescript
import {
  OrmFactory,
  ConnectionConfig,
  OrmClient,
  Entity,
  Column,
  PrimaryGeneratedColumn,
  QueryResultRow,
  BaseEntity,
} from "@repo/orm";

// 1. Định nghĩa Model
@Entity("tasks")
class Task extends BaseEntity {
  @Column()
  title: string;

  @Column({ default: false })
  is_completed: boolean;
}

// 2. Cấu hình kết nối
const dbConfig: ConnectionConfig = {
  user: "your_pg_user",
  password: "your_pg_password",
  database: "your_pg_database",
  host: "localhost",
  logging: ["query", "error"], // Bật logging cho query và error
};

async function main() {
  let ormClient: OrmClient;

  try {
    // 3. Khởi tạo ORM
    ormClient = await OrmFactory.initialize(dbConfig);
    console.log("ORM initialized successfully.");

    // 4. Thực thi truy vấn SQL trực tiếp
    // Ví dụ: Tạo bảng (nếu chưa có - thường thì việc này sẽ do migration quản lý)
    await ormClient.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        is_completed BOOLEAN DEFAULT false
      );
    `);
    console.log("Table 'tasks' ensured.");

    // Ví dụ: Chèn dữ liệu
    const newTaskTitle = "Học cách sử dụng @repo/orm";
    const insertResult = await ormClient.query(
      "INSERT INTO tasks (title, is_completed) VALUES ($1, $2) RETURNING *",
      [newTaskTitle, false]
    );
    const newTask = insertResult.rows[0] as Task;
    console.log("New task inserted:", newTask);

    // Ví dụ: Truy vấn dữ liệu
    const tasksResult = await ormClient.query<Task>(
      "SELECT * FROM tasks WHERE is_completed = $1",
      [false]
    );
    console.log("Pending tasks:", tasksResult.rows);

    // Sử dụng các phương thức từ BaseEntity (ví dụ)
    // Lưu ý: Các phương thức save, update, delete trên BaseEntity cần QueryBuilder để hoạt động đầy đủ,
    // hiện tại chúng chưa được triển khai hoàn chỉnh trong BaseEntity.
    // const taskToComplete = new Task();
    // taskToComplete.id = newTask.id;
    // taskToComplete.title = newTask.title;
    // taskToComplete.is_completed = true;
    // await taskToComplete.save(ormClient); // Giả định phương thức save tồn tại và hoạt động
  } catch (error) {
    console.error("Đã xảy ra lỗi:", error.message);
    if (error.query) {
      console.error("Truy vấn lỗi:", error.query);
    }
  } finally {
    // 5. Đóng kết nối
    if (ormClient) {
      await OrmFactory.close();
      console.log("ORM connection closed.");
    }
  }
}

main();
```

## 4. Quy ước Đặt tên (Dự kiến từ `orm.md`)

- **Tên Bảng (Tables):** `snake_case`, số nhiều (ví dụ: `users`, `blog_posts`).
- **Tên Cột (Columns):** `snake_case` trong database, tương ứng với `camelCase` hoặc `PascalCase` cho thuộc tính model.
- **Primary Keys:** Mặc định là `id`.

## 5. Tính năng Dự kiến (Chưa triển khai hoặc đang phát triển)

- **Query Builder hoàn chỉnh:** API fluent để xây dựng các câu lệnh `SELECT`, `INSERT`, `UPDATE`, `DELETE` một cách an toàn và dễ dàng.
- **Hỗ trợ Giao dịch (Transactions) nâng cao:** API tiện lợi hơn trên `OrmClient` để quản lý các giao dịch.
- **Schema Migrations:** Công cụ để quản lý thay đổi schema của cơ sở dữ liệu.
- **Hỗ trợ Gọi Stored Procedures và Full-Text Search:** Các API chuyên biệt (ngoài việc dùng `query()` thuần).
- **Hoàn thiện các phương thức trên `BaseEntity`:** Như `save()`, `update()`, `delete()`, `find()` sau khi có Query Builder.

## 6. Cài đặt

(Thông tin cài đặt sẽ được cập nhật khi package được public hoặc theo hướng dẫn của monorepo)

```
# Ví dụ (nếu là một package riêng lẻ)
# npm install @repo/orm
# yarn add @repo/orm
```

## 7. Đóng góp

(Thông tin về cách đóng góp sẽ được cập nhật sau)

---

_Lưu ý: Đây là tài liệu README ban đầu và sẽ được cập nhật chi tiết hơn trong quá trình phát triển._
