// Ví dụ sử dụng Model trong ORM
import {
  Column,
  Entity,
  ForeignKey,
  Index,
  OrmFactory,
  PostgresDataType,
  PrimaryGeneratedColumn,
  UniqueIndex,
} from "../src";

// Định nghĩa model User
@Entity({
  tableName: "users", // Tùy chọn, mặc định sẽ là "users"
  description: "Bảng lưu thông tin người dùng",
})
class User {
  @PrimaryGeneratedColumn({
    description: "ID của người dùng",
  })
  id!: number;

  @Column({
    type: PostgresDataType.VARCHAR,
    length: 100,
    nullable: false,
    description: "Tên người dùng",
  })
  @UniqueIndex() // Tạo unique index cho username
  username!: string;

  @Column({
    type: PostgresDataType.VARCHAR,
    length: 255,
    nullable: false,
    description: "Email của người dùng",
  })
  @UniqueIndex() // Tạo unique index cho email
  email!: string;

  @Column({
    type: PostgresDataType.SMALLINT,
    default: 1,
    description: "Trạng thái hoạt động của người dùng (1: active, 0: inactive)",
  })
  @Index() // Tạo index thường cho is_active
  isActive!: boolean;

  @Column({
    type: PostgresDataType.BIGINT,
    description: "Thời gian tạo tài khoản (Unix timestamp)",
  })
  createdAt!: Date;
}

// Định nghĩa model Post
@Entity({
  description: "Bảng lưu thông tin bài viết",
})
class Post {
  @PrimaryGeneratedColumn({
    description: "ID của bài viết",
  })
  id!: number;

  @Column({
    type: PostgresDataType.VARCHAR,
    length: 200,
    nullable: false,
    description: "Tiêu đề bài viết",
  })
  @Index()
  title!: string;

  @Column({
    type: PostgresDataType.TEXT,
    description: "Nội dung bài viết",
  })
  content!: string;

  @Column({
    type: PostgresDataType.INTEGER,
    nullable: false,
    description: "ID của người dùng đã tạo bài viết",
  })
  @ForeignKey({
    referencedTable: "users",
    onDelete: "CASCADE",
  })
  @Index()
  userId!: number;

  @Column({
    type: PostgresDataType.BIGINT,
    description: "Thời gian tạo bài viết (Unix timestamp)",
  })
  createdAt!: Date;
}

async function main() {
  try {
    // Khởi tạo ORM
    const db = await OrmFactory.initialize({
      host: "localhost",
      port: 5432,
      user: "postgres",
      password: "your_password",
      database: "your_database",
      logging: true,
    });

    console.log("ORM đã được khởi tạo thành công!");

    // Lấy tên bảng từ model
    const userTableName = db.getTableName("User");
    console.log("Tên bảng User:", userTableName);

    const postTableName = db.getTableName("Post");
    console.log("Tên bảng Post:", postTableName);

    // Lấy tên cột từ thuộc tính model
    const usernameColumn = db.getColumnName("User", "username");
    console.log("Tên cột username:", usernameColumn);

    const isActiveColumn = db.getColumnName("User", "isActive");
    console.log("Tên cột isActive:", isActiveColumn);

    // Tạo một instance của User
    const user = new User();
    user.username = "johndoe";
    user.email = "john@example.com";
    user.isActive = true;
    user.createdAt = new Date();

    // Chuyển đổi từ model sang dữ liệu database
    const dbData = db.toDatabase("User", user);
    console.log("Dữ liệu database:", dbData);

    // Giả lập dữ liệu từ database
    const dbResult = {
      id: 1,
      username: "johndoe",
      email: "john@example.com",
      is_active: 1,
      created_at: new Date().toISOString(),
    };

    // Chuyển đổi từ dữ liệu database sang model
    const userModel = db.fromDatabase<User>("User", dbResult);
    console.log("Model User:", userModel);

    // Đóng kết nối khi hoàn thành
    await OrmFactory.close();
    console.log("Đã đóng kết nối đến database");
  } catch (error) {
    console.error("Lỗi:", (error as Error).message);
  }
}

// Chạy hàm main
main().catch(console.error);
