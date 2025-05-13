import { convertToMillis } from "@repo/common";
import { Column, PrimaryGeneratedColumn } from "./decorators";
import { PostgresDataType } from "./types";

/**
 * BaseEntity cung cấp các trường cơ bản cho tất cả các entity
 * với tích hợp các hàm thời gian từ @repo/common
 *
 * Các entity khác có thể kế thừa từ BaseEntity để có các trường:
 * - id: Khóa chính tự động tăng
 * - createdAt: Thời gian tạo (Unix timestamp - milliseconds)
 * - updatedAt: Thời gian cập nhật (Unix timestamp - milliseconds)
 */
export abstract class BaseEntity {
  /**
   * ID tự động tăng
   */
  @PrimaryGeneratedColumn({
    description: "ID tự động tăng",
  })
  id!: number;

  /**
   * Thời gian tạo (Unix timestamp - milliseconds)
   * Mặc định là thời gian hiện tại
   *
   * Lưu ý: Trong thực tế, bạn nên sử dụng hàm từ @repo/common như sau:
   * ```
   * import { now, toMillisFromDateTime } from "@repo/common/utils/date";
   *
   * // Trong decorator @Column
   * default: () => toMillisFromDateTime(now()),
   * ```
   */
  @Column({
    type: PostgresDataType.BIGINT,
    nullable: false,
    description: "Thời gian tạo (Unix timestamp - milliseconds)",
    default: () => convertToMillis(new Date()),
  })
  createdAt!: number;

  /**
   * Thời gian cập nhật (Unix timestamp - milliseconds)
   * Sẽ được cập nhật tự động khi entity được cập nhật
   */
  @Column({
    type: PostgresDataType.BIGINT,
    nullable: false,
    description: "Thời gian cập nhật (Unix timestamp - milliseconds)",
    default: () => convertToMillis(new Date()),
  })
  updatedAt!: number;

  /**
   * Chuyển đổi createdAt thành đối tượng Date
   * @returns Đối tượng Date
   */
  getCreatedAtDate(): Date {
    return new Date(this.createdAt);
  }

  /**
   * Chuyển đổi updatedAt thành đối tượng Date
   * @returns Đối tượng Date
   */
  getUpdatedAtDate(): Date {
    return new Date(this.updatedAt);
  }

  /**
   * Cập nhật trường updatedAt thành thời gian hiện tại
   *
   * Lưu ý: Trong thực tế, bạn nên sử dụng hàm từ @repo/common như sau:
   * ```
   * import { now, toMillisFromDateTime } from "@repo/common/utils/date";
   *
   * // Trong phương thức updateTimestamp
   * this.updatedAt = toMillisFromDateTime(now());
   * ```
   */
  updateTimestamp(): void {
    this.updatedAt = convertToMillis(new Date());
  }

  /**
   * Chuyển đổi createdAt thành một kiểu dữ liệu thời gian tùy ý (ví dụ: Date hoặc Luxon DateTime)
   * bằng cách sử dụng hàm chuyển đổi được cung cấp từ @repo/common hoặc tùy chỉnh.
   * @param converter Hàm chuyển đổi từ milliseconds (number) sang kiểu T.
   *                  Ví dụ: `convertFromMillis` từ `@repo/common` để lấy JS Date,
   *                  hoặc `fromMillisToDateTime` từ `@repo/common` để lấy Luxon DateTime.
   * @param zone Múi giờ tùy chọn cho việc chuyển đổi.
   * @returns Đối tượng kiểu T.
   * @example
   * ```typescript
   * import { convertFromMillis, fromMillisToDateTime } from "@repo/common";
   *
   * const jsDate = entity.getCreatedAtConverted(convertFromMillis, "Asia/Ho_Chi_Minh");
   * const luxonDateTime = entity.getCreatedAtConverted(fromMillisToDateTime, "Europe/London");
   * ```
   */
  getCreatedAtConverted<T>(
    converter: (ms: number, zone?: string) => T,
    zone?: string
  ): T {
    return converter(this.createdAt, zone);
  }

  /**
   * Chuyển đổi updatedAt thành một kiểu dữ liệu thời gian tùy ý (ví dụ: Date hoặc Luxon DateTime)
   * bằng cách sử dụng hàm chuyển đổi được cung cấp từ @repo/common hoặc tùy chỉnh.
   * @param converter Hàm chuyển đổi từ milliseconds (number) sang kiểu T.
   *                  Ví dụ: `convertFromMillis` từ `@repo/common` để lấy JS Date,
   *                  hoặc `fromMillisToDateTime` từ `@repo/common` để lấy Luxon DateTime.
   * @param zone Múi giờ tùy chọn cho việc chuyển đổi.
   * @returns Đối tượng kiểu T.
   * @example
   * ```typescript
   * import { convertFromMillis, fromMillisToDateTime } from "@repo/common";
   *
   * const jsDate = entity.getUpdatedAtConverted(convertFromMillis, "Asia/Ho_Chi_Minh");
   * const luxonDateTime = entity.getUpdatedAtConverted(fromMillisToDateTime, "Europe/London");
   * ```
   */
  getUpdatedAtConverted<T>(
    converter: (ms: number, zone?: string) => T,
    zone?: string
  ): T {
    return converter(this.updatedAt, zone);
  }

  /**
   * Định dạng createdAt thành chuỗi sử dụng @repo/common
   * @param formatMillis Hàm định dạng milliseconds thành chuỗi
   * @param format Định dạng (mặc định là dd/MM/yyyy HH:mm:ss)
   * @param zone Múi giờ (mặc định là UTC)
   * @param locale Ngôn ngữ (mặc định là en-US)
   * @returns Chuỗi đã định dạng
   * @example
   * ```typescript
   * import { formatMillis, COMMON_DATE_FORMATS, TIMEZONES } from "@repo/common/utils/date";
   *
   * // Trong class kế thừa từ BaseEntity
   * const formattedDate = this.formatCreatedAt(formatMillis, COMMON_DATE_FORMATS.DATE_TIME, TIMEZONES.ASIA_HO_CHI_MINH, "vi-VN");
   * ```
   */
  formatCreatedAt(
    formatMillis: (
      ms: number,
      format?: string,
      zone?: string,
      locale?: string
    ) => string,
    format?: string,
    zone?: string,
    locale?: string
  ): string {
    return formatMillis(this.createdAt, format, zone, locale);
  }

  /**
   * Định dạng updatedAt thành chuỗi sử dụng @repo/common
   * @param formatMillis Hàm định dạng milliseconds thành chuỗi
   * @param format Định dạng (mặc định là dd/MM/yyyy HH:mm:ss)
   * @param zone Múi giờ (mặc định là UTC)
   * @param locale Ngôn ngữ (mặc định là en-US)
   * @returns Chuỗi đã định dạng
   * @example
   * ```typescript
   * import { formatMillis, COMMON_DATE_FORMATS, TIMEZONES } from "@repo/common/utils/date";
   *
   * // Trong class kế thừa từ BaseEntity
   * const formattedDate = this.formatUpdatedAt(formatMillis, COMMON_DATE_FORMATS.DATE_TIME, TIMEZONES.ASIA_HO_CHI_MINH, "vi-VN");
   * ```
   */
  formatUpdatedAt(
    formatMillis: (
      ms: number,
      format?: string,
      zone?: string,
      locale?: string
    ) => string,
    format?: string,
    zone?: string,
    locale?: string
  ): string {
    return formatMillis(this.updatedAt, format, zone, locale);
  }
}
