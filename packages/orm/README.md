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

### 2.6. Query Builder (Đang phát triển)

`OrmClient` cung cấp một `QueryBuilder` để xây dựng các câu lệnh `SELECT` một cách an toàn và trực quan.

**Khởi tạo QueryBuilder:**

Bạn có thể lấy một instance của `QueryBuilder` từ `OrmClient` bằng cách truyền vào class của Entity:

```typescript
const qb = ormClient.createQueryBuilder(User); // User là một class Entity đã định nghĩa
```

**Các phương thức hỗ trợ:**

- **`select(...fields: SelectInputItem[])`**: Chọn các cột sẽ được trả về. Hỗ trợ:
  - Tên thuộc tính của Entity (ví dụ: `'username'`, `'email'`). ORM sẽ tự động ánh xạ sang tên cột trong database.
  - Đối tượng `{ property: string, alias?: string }` để chọn thuộc tính và đặt bí danh cho cột kết quả.
  - Đối tượng `{ expression: string, alias: string }` để sử dụng biểu thức SQL thuần và đặt bí danh.
  - Nếu không gọi `select()`, mặc định sẽ là `SELECT *` (chọn tất cả các cột đã định nghĩa trong Entity).
- **`where(condition: WhereCondition)`**: Thêm điều kiện `WHERE` chính. `WhereCondition` là một object `{ [columnName: string]: any }`.
  Ví dụ: `.where({ status: 'active', role: 'admin' })` sẽ tạo ra `WHERE "status" = $1 AND "role" = $2`.
- **`orWhere(condition: WhereCondition)`**: Thêm điều kiện `WHERE` với toán tử `OR`. Phải được gọi sau một `where()` hoặc `orWhere()` khác.
- **`whereIn(field: string, values: any[])`**: Thêm điều kiện `WHERE field IN (...)`.
- **`orWhereIn(field: string, values: any[])`**: Thêm điều kiện `OR field IN (...)`.
- **`whereNull(field: string)`**: Thêm điều kiện `WHERE field IS NULL`.
- **`orWhereNull(field: string)`**: Thêm điều kiện `OR field IS NULL`.
- **`whereNotNull(field: string)`**: Thêm điều kiện `WHERE field IS NOT NULL`.
- **`orWhereNotNull(field: string)`**: Thêm điều kiện `OR field IS NOT NULL`.
- **`orderBy(fieldOrObject: string | OrderByClause, direction?: 'ASC' | 'DESC')`**: Sắp xếp kết quả.
  Ví dụ: `.orderBy('createdAt', 'DESC')` hoặc `.orderBy({ column: 'username', order: 'ASC' })`.
- **`limit(count: number)`**: Giới hạn số lượng bản ghi trả về.
- **`offset(count: number)`**: Bỏ qua một số lượng bản ghi (dùng cho phân trang).
- **`getOne(): Promise<Partial<Entity> | undefined>`**: Thực thi truy vấn và trả về một bản ghi duy nhất (hoặc `undefined` nếu không tìm thấy). Tự động thêm `LIMIT 1`.
- **`getMany(): Promise<Partial<Entity>[]>`**: Thực thi truy vấn và trả về một mảng các bản ghi.

**Ví dụ sử dụng QueryBuilder:**

```typescript
import {
  OrmFactory,
  ConnectionConfig,
  OrmClient,
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
} from "@repo/orm";

@Entity("users")
class User extends BaseEntity {
  @Column()
  username: string;

  @Column({ name: "email_address" })
  email: string;

  @Column()
  status: string; // ví dụ: 'active', 'inactive'

  @Column({ type: "number" })
  age: number;

  @Column({ name: "created_at", type: "date" })
  createdAt: Date;
}

const dbConfig: ConnectionConfig = {
  user: "your_pg_user",
  password: "your_pg_password",
  database: "your_pg_database",
  host: "localhost",
  logging: ["query"],
};

async function queryWithBuilder() {
  let ormClient: OrmClient;
  try {
    ormClient = await OrmFactory.initialize(dbConfig);
    console.log("ORM for QueryBuilder demo initialized.");

    // Giả sử bảng 'users' đã tồn tại và có dữ liệu

    // 1. Lấy một người dùng theo username
    const specificUser = await ormClient
      .createQueryBuilder(User)
      .select("id", "username", "email") // Chọn các cột cụ thể
      .where({ username: "john.doe" })
      .getOne();
    console.log("Specific user:", specificUser);

    // 2. Lấy tất cả người dùng đang hoạt động, lớn hơn 25 tuổi, sắp xếp theo ngày tạo
    const activeUsers = await ormClient
      .createQueryBuilder(User)
      .where({ status: "active" })
      .where({ age: 25 })
      .orderBy("createdAt", "DESC")
      .limit(10)
      .getMany();
    console.log("Active users over 25 (first 10):", activeUsers);

    // 3. Sử dụng select với alias và expression
    const userStats = await ormClient
      .createQueryBuilder(User)
      .select(
        { property: "username", alias: "userLogin" },
        {
          expression: "CONCAT(username, '@example.com')",
          alias: "fullEmailGuess",
        },
        "status"
      )
      .where({ id: 1 }) // Giả sử có user với id = 1
      .getOne();
    console.log("User stats with alias:", userStats);
    // Kết quả mong đợi có thể là: { userLogin: 'someuser', fullEmailGuess: 'someuser@example.com', status: 'active' }

    // 4. Sử dụng `whereIn` và `whereNotNull`
    const usersByIds = await ormClient
      .createQueryBuilder(User)
      .select("id", "username")
      .whereIn("id", [1, 2, 3])
      .whereNotNull("email")
      .getMany();
    console.log("Users by IDs [1,2,3] with non-null email:", usersByIds);
  } catch (error) {
    console.error("QueryBuilder Error:", error.message);
  } finally {
    if (ormClient) {
      await OrmFactory.close();
      console.log("ORM connection closed for QueryBuilder demo.");
    }
  }
}

queryWithBuilder();
```

Lưu ý: Phương thức `andWhere` và các toán tử điều kiện phức tạp (như `>` trong ví dụ trên) có thể chưa được triển khai đầy đủ hoặc có cú pháp khác. Tham khảo tài liệu QueryBuilder chi tiết khi hoàn thiện.

### 2.7. Thực thi Câu lệnh INSERT

QueryBuilder hỗ trợ thực thi câu lệnh `INSERT` cho một hoặc nhiều hàng.

```typescript
// Giả sử ormClient và class User đã được định nghĩa

// INSERT một User mới
async function insertSingleUser() {
  try {
    const insertResult = await ormClient
      .createQueryBuilder(User) // Hoặc .createQueryBuilder("users")
      .insert({
        username: "newuser",
        email: "newuser@example.com",
        status: "pending",
        age: 30,
      })
      .returning("id") // Tùy chọn: trả về ID của user mới được chèn
      .execute(); // Giả sử có phương thức execute() hoặc insert() tự thực thi

    console.log("Insert single user result:", insertResult.rows);
    // Mong đợi: [{ id: <new_id> }]
    console.log("Rows affected:", insertResult.rowCount); // Mong đợi: 1
  } catch (error) {
    console.error("Error inserting single user:", error);
  }
}

// INSERT nhiều Users cùng lúc
async function insertMultipleUsers() {
  try {
    const usersToInsert = [
      { username: "user_a", email: "a@example.com", age: 25 },
      { username: "user_b", email: "b@example.com", age: 35 },
    ];
    const insertMultiResult = await ormClient
      .createQueryBuilder(User)
      .insert(usersToInsert)
      .returning(["id", "username"]) // Trả về nhiều cột
      .execute();

    console.log("Insert multiple users result:", insertMultiResult.rows);
    // Mong đợi: [{ id: <id_a>, username: "user_a" }, { id: <id_b>, username: "user_b" }]
    console.log("Rows affected:", insertMultiResult.rowCount); // Mong đợi: 2
  } catch (error) {
    console.error("Error inserting multiple users:", error);
  }
}

// Gọi các hàm ví dụ
// insertSingleUser();
// insertMultipleUsers();
```

**Phương thức `insert(data: InsertInput)`**

- `data`: Có thể là một object (cho một hàng) hoặc một mảng các object (cho nhiều hàng). Keys của object là tên thuộc tính của Entity (sẽ được chuyển đổi sang snake_case cho tên cột), và values là giá trị tương ứng.

**Phương thức `returning(columns?: ReturningOption)`**

- Chỉ định các cột sẽ được trả về sau câu lệnh `INSERT` (hoặc `UPDATE`, `DELETE` trong tương lai).
- `columns` (tùy chọn):
  - `string`: Tên một cột (ví dụ: `'id'`).
  - `string[]`: Mảng các tên cột (ví dụ: `['id', 'username']`).
  - `'*'` (mặc định nếu không gọi `returning` hoặc gọi `returning("*")`): Trả về tất cả các cột của hàng bị ảnh hưởng.
- Nếu không gọi `returning()`, kết quả trả về từ `insert()` sẽ có `rows` là một mảng rỗng, nhưng `rowCount` vẫn cho biết số hàng đã chèn.

### 2.8. Thực thi Câu lệnh UPDATE

QueryBuilder cho phép thực thi câu lệnh `UPDATE` với các điều kiện `WHERE`.

```typescript
// Giả sử ormClient và class User đã được định nghĩa

async function updateUserStatus() {
  try {
    const updateResult = await ormClient
      .createQueryBuilder(User)
      .update({
        status: "active",
        // updatedAt: new Date() // Cập nhật trường updatedAt nếu cần
      })
      .where("username = $1", ["newuser"])
      .orWhereIn("id", [10, 11, 12])
      .returning("id", "status") // Tùy chọn: trả về các cột đã được cập nhật
      .execute();

    console.log("Update user status result:", updateResult.rows);
    // Mong đợi (ví dụ): [{ id: <id_updated_1>, status: "active" }, { id: <id_updated_2>, status: "active" }]
    console.log("Rows affected by update:", updateResult.rowCount);
  } catch (error) {
    console.error("Error updating user status:", error);
  }
}

// Cập nhật tất cả user (CẨN THẬN!)
async function updateAllUsersAge() {
  try {
    // Cảnh báo: Câu lệnh này sẽ cập nhật TẤT CẢ các hàng trong bảng users
    // nếu không có mệnh đề WHERE. QueryBuilder sẽ hiển thị cảnh báo trong console.
    const confirmUpdateAll = true; // Phải có cơ chế xác nhận rõ ràng trong ứng dụng thực tế

    if (confirmUpdateAll) {
      const result = await ormClient
        .createQueryBuilder(User)
        .update({ age: 30 })
        // .where(...) // Bỏ qua where để cập nhật tất cả (KHÔNG KHUYẾN KHÍCH NẾU KHÔNG CỐ Ý)
        .execute();
      console.log(`Updated age for ${result.rowCount} users.`);
    } else {
      console.log("Update all users cancelled.");
    }
  } catch (error) {
    console.error("Error updating all users age:", error);
  }
}

// Gọi hàm ví dụ
// updateUserStatus();
// updateAllUsersAge();
```

**Phương thức `update(data: UpdateInput)`**

- `data`: Một object chứa các cặp key-value, trong đó key là tên thuộc tính của Entity (sẽ được chuyển sang snake_case cho tên cột) và value là giá trị mới cho cột đó.
- Luôn phải đi kèm với các phương thức `where`, `orWhere`, `whereIn` v.v. để chỉ định hàng nào sẽ được cập nhật. Nếu không có mệnh đề `WHERE`, QueryBuilder sẽ log một cảnh báo vì thao tác này sẽ cập nhật tất cả các hàng trong bảng.

**Lưu ý về `execute()`:**

Trong các ví dụ trên, tôi đã sử dụng `.execute()` như một phương thức giả định để thực thi câu lệnh `INSERT` hoặc `UPDATE`. Hiện tại, các phương thức `insert()` và `update()` trên `QueryBuilder` của bạn là `async` và tự thực thi. Bạn có thể giữ nguyên như vậy hoặc cân nhắc việc tách riêng bước xây dựng và bước thực thi nếu muốn QueryBuilder linh hoạt hơn (ví dụ: cho phép lấy SQL đã build trước khi chạy).

Nếu `insert()` và `update()` tự thực thi, thì không cần `.execute()` nữa, và `returning()` sẽ được gọi trước `insert()` hoặc `update()`.

Ví dụ (nếu `insert` tự thực thi):

```typescript
const result = await ormClient
  .createQueryBuilder(User)
  .returning("id") // Gọi trước
  .insert({ username: "new_user" });
```

### 2.9. Sử dụng Các Hàm Tổng Hợp (Aggregate Functions)

QueryBuilder cung cấp các phương thức tiện lợi để sử dụng các hàm tổng hợp SQL phổ biến như `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`. Kết quả của các hàm này thường được truy cập thông qua một alias.

```typescript
// Giả sử ormClient và class User, Order đã được định nghĩa

async function performAggregateQueries() {
  try {
    // Đếm tổng số user
    const totalUsersResult = await ormClient
      .createQueryBuilder(User)
      .count("*", "total_users") // COUNT(*) AS total_users
      .getOne<{ total_users: string | number }>(); // Kiểu trả về có thể là string hoặc number tùy DB driver
    console.log("Total users:", totalUsersResult?.total_users);

    // Đếm số user đang hoạt động
    const activeUsersCountResult = await ormClient
      .createQueryBuilder(User)
      .where("status = $1", ["active"])
      .count("id", "active_count") // COUNT(id) AS active_count (hoặc tên cột tương ứng)
      .getOne<{ active_count: string | number }>();
    console.log("Active users:", activeUsersCountResult?.active_count);

    // Tính tổng giá trị các đơn hàng
    // Giả sử Order có thuộc tính 'amount'
    const totalOrderAmountResult = await ormClient
      .createQueryBuilder("orders") // Hoặc dùng class Order nếu có
      .sum("amount", "total_revenue")
      .getOne<{ total_revenue: string | number | null }>();
    console.log("Total revenue:", totalOrderAmountResult?.total_revenue);

    // Tính giá trị trung bình của một đơn hàng
    const averageOrderPriceResult = await ormClient
      .createQueryBuilder("orders")
      .avg("amount", "average_price")
      .getOne<{ average_price: string | number | null }>();
    console.log("Average order price:", averageOrderPriceResult?.average_price);

    // Tìm giá trị đơn hàng nhỏ nhất và lớn nhất
    const minMaxPriceResult = await ormClient
      .createQueryBuilder("orders")
      .min("amount", "min_price")
      .max("amount", "max_price")
      .getOne<{
        min_price: string | number | null;
        max_price: string | number | null;
      }>();
    console.log("Min order price:", minMaxPriceResult?.min_price);
    console.log("Max order price:", minMaxPriceResult?.max_price);

    // Kết hợp nhiều hàm tổng hợp
    const userStatsResult = await ormClient
      .createQueryBuilder(User)
      .count("*", "total")
      .avg("age", "average_age")
      .where("status = $1", ["active"])
      .getOne<{ total: number; average_age: number | null }>();
    console.log("Active User Stats:", userStatsResult);
  } catch (error) {
    console.error("Error performing aggregate queries:", error);
  }
}

// performAggregateQueries();
```

**Các phương thức tổng hợp:**

- `count(field: string = "*", alias?: string): this`
  - `field`: Tên thuộc tính hoặc cột để đếm. Mặc định là `"*"` (đếm tất cả các hàng).
  - `alias`: Tên bí danh cho kết quả (ví dụ: `'total_users'`). Nếu không cung cấp, một alias mặc định sẽ được tạo (ví dụ: `count_id`, `count_all`).
- `sum(field: string, alias?: string): this`
  - `field`: Tên thuộc tính hoặc cột để tính tổng (không thể là `"*"`).
- `avg(field: string, alias?: string): this`
  - `field`: Tên thuộc tính hoặc cột để tính trung bình (không thể là `"*"`).
- `min(field: string, alias?: string): this`
  - `field`: Tên thuộc tính hoặc cột để tìm giá trị nhỏ nhất (không thể là `"*"`).
- `max(field: string, alias?: string): this`
  - `field`: Tên thuộc tính hoặc cột để tìm giá trị lớn nhất (không thể là `"*"`).

**Lưu ý khi lấy kết quả:**

- Các truy vấn tổng hợp thường trả về một hàng duy nhất. Sử dụng `getOne<ResultType>()` để lấy kết quả này.
- `ResultType` nên là một interface hoặc type mô tả cấu trúc của đối tượng kết quả, với các thuộc tính khớp với alias bạn đã đặt. Ví dụ: `interface { total_users: number }`.
- Giá trị trả về từ database cho các hàm tổng hợp có thể là `string` hoặc `number` (hoặc `null` nếu không có dữ liệu để tổng hợp, ví dụ `SUM` trên một bảng rỗng). Hãy kiểm tra kiểu dữ liệu thực tế từ driver database của bạn và ép kiểu (cast) một cách cẩn thận nếu cần.

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

- **Query Builder hoàn chỉnh:**
  - Hỗ trợ đầy đủ cho các câu lệnh `INSERT`, `UPDATE`, `DELETE`.
  - Hỗ trợ các điều kiện `WHERE` phức tạp hơn (ví dụ: `LIKE`, `BETWEEN`, toán tử so sánh `>, <, >=, <=`).
  - Các hàm tổng hợp (Aggregation functions) như `COUNT`, `SUM`, `AVG`, `MAX`, `MIN`.
  - Nhóm kết quả (`GROUP BY`).
  - Điều kiện `HAVING`.
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
