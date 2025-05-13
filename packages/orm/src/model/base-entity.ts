import { convertFromMillis, formatMillis } from "@repo/common";

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
  id!: string | number;

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
  createdAt: Date = new Date();

  /**
   * Thời gian cập nhật (Unix timestamp - milliseconds)
   * Sẽ được cập nhật tự động khi entity được cập nhật
   */
  updatedAt: Date = new Date();

  constructor(data?: Partial<any>) {
    if (data) {
      const dataCopy = { ...data };
      if (typeof dataCopy.createdAt === "number") {
        dataCopy.createdAt = convertFromMillis(dataCopy.createdAt);
      }
      if (typeof dataCopy.updatedAt === "number") {
        dataCopy.updatedAt = convertFromMillis(dataCopy.updatedAt);
      }
      Object.assign(this, dataCopy);
    }
    if (!(this.createdAt instanceof Date)) {
      this.createdAt = new Date();
    }
    if (!(this.updatedAt instanceof Date)) {
      this.updatedAt = new Date();
    }
  }

  /**
   * Updates the updatedAt timestamp to the current time.
   */
  protected updateTimestamp(): void {
    this.updatedAt = new Date();
  }

  /**
   * Returns the createdAt timestamp as a Date object or a custom formatted string.
   * @param converter Optional function to format the Date object.
   */
  public getCreatedAtConverted<T>(converter?: (date: Date) => T): T | Date {
    return converter ? converter(this.createdAt) : this.createdAt;
  }

  /**
   * Returns the updatedAt timestamp as a Date object or a custom formatted string.
   * @param converter Optional function to format the Date object.
   */
  public getUpdatedAtConverted<T>(converter?: (date: Date) => T): T | Date {
    return converter ? converter(this.updatedAt) : this.updatedAt;
  }

  /**
   * Converts the entity to a JSON object.
   * Date objects are converted to ISO strings.
   * Numeric timestamps (if any unconverted ones exist on properties) are also converted to ISO strings.
   */
  public toJSON(): Record<string, unknown> {
    const jsonData: Record<string, unknown> = {};
    let metadata;
    // try {
    //   metadata = ModelManager.getModelMetadata(
    //     this.constructor as Constructor<this>
    //   );
    // } catch (error) {
    //   Object.getOwnPropertyNames(this).forEach((prop) => {
    //     if (typeof (this as any)[prop] !== "function") {
    //       const value = (this as any)[prop];
    //       if (value instanceof Date) {
    //         jsonData[prop] = value.toISOString();
    //       } else {
    //         jsonData[prop] = value;
    //       }
    //     }
    //   });
    //   return jsonData;
    // }

    // for (const propertyName in metadata.columns) {
    //   if (
    //     Object.prototype.hasOwnProperty.call(metadata.columns, propertyName)
    //   ) {
    //     const columnDef = metadata.columns[propertyName];
    //     const propValue = (this as any)[propertyName];

    //     if (propValue === undefined || propValue === null) {
    //       jsonData[propertyName] = propValue;
    //       continue;
    //     }

    //     if (propValue instanceof Date) {
    //       jsonData[propertyName] = propValue.toISOString();
    //     } else if (
    //       columnDef &&
    //       (columnDef.type === PostgresDataType.DATE ||
    //         columnDef.type === PostgresDataType.TIMESTAMP ||
    //         columnDef.type === PostgresDataType.TIMESTAMPTZ) &&
    //       typeof propValue === "number"
    //     ) {
    //       try {
    //         jsonData[propertyName] = convertFromMillis(propValue).toISOString();
    //       } catch (e) {
    //         ModelManager.loggerService?.warn(
    //           `Failed to convert numeric timestamp to ISO string for ${propertyName}: ${String(e)}`
    //         );
    //         jsonData[propertyName] = propValue;
    //       }
    //     } else {
    //       jsonData[propertyName] = propValue;
    //     }
    //   }
    // }
    return jsonData;
  }

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
   * Định dạng createdAt thành chuỗi theo định dạng mong muốn.
   */
  public formatCreatedAt(
    format = "dd/MM/yyyy HH:mm:ss",
    zone?: string,
    locale?: string
  ): string {
    return formatMillis(this.createdAt.getTime(), format, zone, locale);
  }

  /**
   * Định dạng updatedAt thành chuỗi theo định dạng mong muốn.
   */
  public formatUpdatedAt(
    format = "dd/MM/yyyy HH:mm:ss",
    zone?: string,
    locale?: string
  ): string {
    return formatMillis(this.updatedAt.getTime(), format, zone, locale);
  }
}
