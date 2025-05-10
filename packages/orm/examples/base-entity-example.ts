// Ví dụ sử dụng BaseEntity trong ORM với tích hợp @repo/common
import {
  AutoUpdateTimestamp,
  BaseEntity,
  Column,
  Entity,
  Index,
  OrmFactory,
  PostgresDataType,
  UniqueIndex,
} from "../src";

// Giả lập import từ @repo/common
// Trong thực tế, bạn sẽ import từ @repo/common như sau:
// import {
//   now,
//   toMillisFromDateTime,
//   fromMillisToDateTime,
//   formatMillis,
//   COMMON_DATE_FORMATS,
//   TIMEZONES
// } from "@repo/common/utils/date";

// Giả lập các hàm và hằng số từ @repo/common
const TIMEZONES = {
  UTC: "utc",
  ASIA_HO_CHI_MINH: "Asia/Ho_Chi_Minh",
};

const COMMON_DATE_FORMATS = {
  DATE_ONLY: "dd/MM/yyyy",
  DATE_TIME: "dd/MM/yyyy HH:mm:ss",
  ISO_DATE_TIME: "yyyy-MM-dd'T'HH:mm:ss'Z'",
};

// Giả lập hàm now từ @repo/common
function now(): unknown {
  // Trong thực tế, hàm này sẽ trả về một đối tượng DateTime của Luxon
  return {
    toString: () => new Date().toISOString(),
    toMillis: () => Date.now(),
  };
}

// Giả lập hàm toMillisFromDateTime từ @repo/common
function toMillisFromDateTime(dateTime: { toMillis: () => number }): number {
  // Trong thực tế, hàm này sẽ chuyển đổi đối tượng DateTime của Luxon thành milliseconds
  return dateTime.toMillis();
}

// Định nghĩa kiểu DateTime để sử dụng trong ví dụ
interface DateTime {
  toString: () => string;
  toFormat: (format: string) => string;
  setZone: (newZone: string) => DateTime;
  setLocale: (locale: string) => DateTime;
}

// Giả lập hàm fromMillisToDateTime từ @repo/common
function fromMillisToDateTime(ms: number, zone: string = "utc"): DateTime {
  // Trong thực tế, hàm này sẽ trả về một đối tượng DateTime của Luxon
  return {
    toString: () => new Date(ms).toISOString(),
    toFormat: (format: string) => {
      // Tham số format được giữ lại để tương thích với API, nhưng không được sử dụng đầy đủ trong ví dụ này
      const date = new Date(ms);
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    },
    setZone: (newZone: string) => fromMillisToDateTime(ms, newZone),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setLocale: (locale: string) => fromMillisToDateTime(ms, zone),
  };
}

// Giả lập hàm formatMillis từ @repo/common
function formatMillis(
  ms: number,
  format: string = COMMON_DATE_FORMATS.DATE_TIME,
  zone: string = TIMEZONES.UTC,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  locale: string = "en-US"
): string {
  // Tham số locale được giữ lại để tương thích với API, nhưng không được sử dụng trong ví dụ này
  const dt = fromMillisToDateTime(ms, zone);
  return dt.toFormat(format);
}

// Định nghĩa model User kế thừa từ BaseEntity
@Entity({
  description: "Bảng lưu thông tin người dùng",
})
@AutoUpdateTimestamp // Tự động cập nhật trường updatedAt khi entity được cập nhật
class User extends BaseEntity {
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

  // Không cần định nghĩa id, createdAt, updatedAt vì đã được kế thừa từ BaseEntity
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

    // Kiểm tra xem userModel có đầy đủ các phương thức của BaseEntity không
    if (userModel && typeof userModel.getCreatedAtDate === "function") {
      // Sử dụng các phương thức cơ bản của BaseEntity
      console.log("Created At Date:", userModel.getCreatedAtDate());

      if (typeof userModel.getUpdatedAtDate === "function") {
        console.log("Updated At Date:", userModel.getUpdatedAtDate());
      }

      // Cập nhật trường updatedAt
      if (typeof userModel.updateTimestamp === "function") {
        userModel.updateTimestamp();
        console.log("Updated At sau khi cập nhật:", userModel.updatedAt);

        if (typeof userModel.getUpdatedAtDate === "function") {
          console.log(
            "Updated At Date sau khi cập nhật:",
            userModel.getUpdatedAtDate()
          );
        }
      }
    } else {
      console.log("userModel không phải là instance đầy đủ của BaseEntity");
    }

    // Sử dụng các phương thức tích hợp với @repo/common
    console.log("\n--- Sử dụng các phương thức tích hợp với @repo/common ---");

    if (userModel && typeof userModel.getCreatedAtDateTime === "function") {
      // Chuyển đổi createdAt thành đối tượng DateTime của Luxon
      const createdAtDateTime = userModel.getCreatedAtDateTime(
        fromMillisToDateTime,
        TIMEZONES.ASIA_HO_CHI_MINH
      );
      console.log("Created At DateTime:", createdAtDateTime.toString());

      // Chuyển đổi updatedAt thành đối tượng DateTime của Luxon
      if (typeof userModel.getUpdatedAtDateTime === "function") {
        const updatedAtDateTime = userModel.getUpdatedAtDateTime(
          fromMillisToDateTime,
          TIMEZONES.ASIA_HO_CHI_MINH
        );
        console.log(
          "Updated At DateTime:",
          updatedAtDateTime ? updatedAtDateTime.toString() : "N/A"
        );
      }

      // Định dạng createdAt thành chuỗi
      if (typeof userModel.formatCreatedAt === "function") {
        const formattedCreatedAt = userModel.formatCreatedAt(
          formatMillis,
          COMMON_DATE_FORMATS.DATE_TIME,
          TIMEZONES.ASIA_HO_CHI_MINH,
          "vi-VN"
        );
        console.log("Formatted Created At:", formattedCreatedAt);
      }

      // Định dạng updatedAt thành chuỗi
      if (typeof userModel.formatUpdatedAt === "function") {
        const formattedUpdatedAt = userModel.formatUpdatedAt(
          formatMillis,
          COMMON_DATE_FORMATS.DATE_TIME,
          TIMEZONES.ASIA_HO_CHI_MINH,
          "vi-VN"
        );
        console.log("Formatted Updated At:", formattedUpdatedAt || "N/A");
      }
    } else {
      console.log(
        "userModel không hỗ trợ các phương thức tích hợp với @repo/common"
      );
    }

    // Đóng kết nối khi hoàn thành
    await OrmFactory.close();
    console.log("Đã đóng kết nối đến database");
  } catch (error) {
    console.error("Lỗi:", (error as Error).message);
  }
}

// Chạy hàm main
main().catch(console.error);
