// Ví dụ sử dụng AdvancedBaseEntity trong ORM
import {
  AdvancedBaseEntity,
  AutoUpdateTimestamp,
  Column,
  Entity,
  Index,
  OrmFactory,
  PostgresDataType,
  UniqueIndex,
} from "../src";

// Định nghĩa model User kế thừa từ AdvancedBaseEntity
@Entity({
  description: "Bảng lưu thông tin người dùng",
})
@AutoUpdateTimestamp // Tự động cập nhật trường updatedAt khi entity được cập nhật
class User extends AdvancedBaseEntity {
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
  @Index() // Tạo index thường cho isActive
  isActive!: boolean;

  // Không cần định nghĩa id, createdAt, updatedAt vì đã được kế thừa từ AdvancedBaseEntity
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

    // Tạo một instance của User
    const user = new User();
    user.username = "johndoe";
    user.email = "john@example.com";
    user.isActive = true;
    // Không cần gán createdAt vì nó sẽ được tự động gán giá trị mặc định (thời gian hiện tại)

    // Chuyển đổi từ model sang dữ liệu database
    const dbData = db.toDatabase("User", user);
    console.log("Dữ liệu database của User:", dbData);
    // Kết quả sẽ bao gồm: username, email, is_active, created_at

    // Giả lập dữ liệu từ database
    const dbResult = {
      id: 1,
      username: "johndoe",
      email: "john@example.com",
      is_active: 1,
      created_at: Date.now(),
      updated_at: null,
    };

    // Chuyển đổi từ dữ liệu database sang model
    const userModel = db.fromDatabase<User>("User", dbResult);
    console.log("Model User:", userModel);
    // Kết quả sẽ bao gồm: id, username, email, isActive, createdAt, updatedAt

    // Sử dụng các phương thức của AdvancedBaseEntity
    console.log("Created At Date:", userModel.getCreatedAtDate());
    console.log("Updated At Date:", userModel.getUpdatedAtDate());

    // Cập nhật trường updatedAt
    userModel.updateTimestamp();
    console.log("Updated At sau khi cập nhật:", userModel.updatedAt);
    console.log("Updated At Date sau khi cập nhật:", userModel.getUpdatedAtDate());

    // Đóng kết nối khi hoàn thành
    await OrmFactory.close();
    console.log("Đã đóng kết nối đến database");
  } catch (error) {
    console.error("Lỗi:", (error as Error).message);
  }
}

// Chạy hàm main
main().catch(console.error);

/**
 * Ví dụ sử dụng CommonBaseEntity với tích hợp @repo/common
 * 
 * Lưu ý: Để chạy ví dụ này, bạn cần cài đặt package @repo/common
 * và import các hàm cần thiết từ @repo/common/utils/date
 */
/*
import { CommonBaseEntity, Entity, Column, PostgresDataType } from "../src";
import { fromMillisToDateTime, formatMillis, COMMON_DATE_FORMATS, TIMEZONES } from "@repo/common/utils/date";

@Entity()
class Article extends CommonBaseEntity {
  @Column({
    type: PostgresDataType.VARCHAR,
    length: 200,
  })
  title!: string;
}

async function commonExample() {
  const article = new Article();
  article.title = "Using CommonBaseEntity";
  article.createdAt = Date.now();
  
  // Sử dụng các hàm từ @repo/common
  const createdAtDateTime = fromMillisToDateTime(article.createdAt, TIMEZONES.ASIA_HO_CHI_MINH);
  console.log("Created At DateTime:", createdAtDateTime.toString());
  
  const formattedDate = formatMillis(
    article.createdAt,
    COMMON_DATE_FORMATS.DATE_TIME,
    TIMEZONES.ASIA_HO_CHI_MINH,
    "vi-VN"
  );
  console.log("Formatted Date:", formattedDate);
}
*/
