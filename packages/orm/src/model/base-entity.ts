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
    default: () => Date.now(), // Sẽ được thay thế bằng toMillisFromDateTime(now()) khi sử dụng thực tế
  })
  createdAt!: number;

  /**
   * Thời gian cập nhật (Unix timestamp - milliseconds)
   * Sẽ được cập nhật tự động khi entity được cập nhật
   */
  @Column({
    type: PostgresDataType.BIGINT,
    nullable: true,
    description: "Thời gian cập nhật (Unix timestamp - milliseconds)",
  })
  updatedAt?: number;

  /**
   * Chuyển đổi createdAt thành đối tượng Date
   * @returns Đối tượng Date
   */
  getCreatedAtDate(): Date {
    return new Date(this.createdAt);
  }

  /**
   * Chuyển đổi updatedAt thành đối tượng Date
   * @returns Đối tượng Date hoặc undefined nếu updatedAt là undefined
   */
  getUpdatedAtDate(): Date | undefined {
    return this.updatedAt ? new Date(this.updatedAt) : undefined;
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
    this.updatedAt = Date.now(); // Sẽ được thay thế bằng toMillisFromDateTime(now()) khi sử dụng thực tế
  }

  /**
   * Chuyển đổi createdAt thành đối tượng DateTime của Luxon sử dụng @repo/common
   * @param zone Múi giờ (mặc định là UTC)
   * @returns Đối tượng DateTime của Luxon
   * @example
   * ```typescript
   * import { fromMillisToDateTime } from "@repo/common/utils/date";
   *
   * // Trong class kế thừa từ BaseEntity
   * const dateTime = fromMillisToDateTime(this.createdAt, "Asia/Ho_Chi_Minh");
   * ```
   */
  getCreatedAtDateTime<T>(
    fromMillisToDateTime: (ms: number, zone?: string) => T,
    zone?: string
  ): T {
    return fromMillisToDateTime(this.createdAt, zone);
  }

  /**
   * Chuyển đổi updatedAt thành đối tượng DateTime của Luxon sử dụng @repo/common
   * @param fromMillisToDateTime Hàm chuyển đổi từ milliseconds sang DateTime
   * @param zone Múi giờ (mặc định là UTC)
   * @returns Đối tượng DateTime của Luxon hoặc undefined nếu updatedAt là undefined
   * @example
   * ```typescript
   * import { fromMillisToDateTime } from "@repo/common/utils/date";
   *
   * // Trong class kế thừa từ BaseEntity
   * const dateTime = this.getUpdatedAtDateTime(fromMillisToDateTime, "Asia/Ho_Chi_Minh");
   * ```
   */
  getUpdatedAtDateTime<T>(
    fromMillisToDateTime: (ms: number, zone?: string) => T,
    zone?: string
  ): T | undefined {
    return this.updatedAt
      ? fromMillisToDateTime(this.updatedAt, zone)
      : undefined;
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
   * @returns Chuỗi đã định dạng hoặc undefined nếu updatedAt là undefined
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
  ): string | undefined {
    return this.updatedAt
      ? formatMillis(this.updatedAt, format, zone, locale)
      : undefined;
  }
}

/**
 * Decorator để tự động cập nhật trường updatedAt khi entity được cập nhật
 *
 * Lưu ý: Trong thực tế, bạn nên sử dụng hàm từ @repo/common như sau:
 * ```
 * import { now, toMillisFromDateTime } from "@repo/common/utils/date";
 *
 * // Trong decorator AutoUpdateTimestamp
 * updatedAt = toMillisFromDateTime(now());
 * ```
 *
 * @param constructor Constructor của class
 */
export function AutoUpdateTimestamp<
  T extends new (...args: any[]) => Record<string, any>,
>(constructor: T): T {
  return class extends constructor {
    constructor(...args: any[]) {
      super(...args);

      // Ghi đè phương thức toJSON nếu có
      // Lưu ý: Đây là cách đơn giản để minh họa, trong thực tế bạn nên sử dụng cách tiếp cận khác
      // để tránh sử dụng any và đảm bảo type safety
      const self = this;
      const originalToJSON = self.toJSON;

      if (typeof originalToJSON === "function") {
        self.toJSON = function () {
          // Sẽ được thay thế bằng toMillisFromDateTime(now()) khi sử dụng thực tế
          self.updatedAt = Date.now();
          return originalToJSON.apply(this);
        };
      }
    }
  };
}
