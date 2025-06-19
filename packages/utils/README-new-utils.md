# Utils Package - New Utilities

Đây là tài liệu cho các utilities mới được thêm vào package utils.

## Number Utilities (`number-utils.ts`)

### Định dạng số

#### `formatNumber(value, options)`

Định dạng số với các tùy chọn linh hoạt:

```typescript
formatNumber(1234567.89, { vietnamese: true }); // "1.234.567,89"
formatNumber(1234567.89, { vietnamese: false }); // "1,234,567.89"
formatNumber(1234567.89, { decimals: 0 }); // "1.234.568"
```

#### `numberToVietnameseText(value)`

Chuyển đổi số thành chữ tiếng Việt:

```typescript
numberToVietnameseText(123); // "một trăm hai mươi ba"
numberToVietnameseText(1234); // "một nghìn hai trăm ba mươi bốn"
```

#### `formatBytes(bytes, options)`

Định dạng dung lượng byte:

```typescript
formatBytes(1024); // "1.00 KB"
formatBytes(1024 * 1024, { vietnamese: true }); // "1,00 MB"
```

#### `formatPercentage(value, decimals, vietnamese)`

Định dạng phần trăm:

```typescript
formatPercentage(0.1234); // "12.34%"
formatPercentage(0.1234, 1, true); // "12,3%"
```

### Phân tích số

#### `parseFormattedNumber(value, vietnamese)`

Phân tích chuỗi số đã định dạng:

```typescript
parseFormattedNumber("1.234.567,89", true); // 1234567.89
parseFormattedNumber("1,234,567.89", false); // 1234567.89
```

#### `isValidNumber(value)`

Kiểm tra chuỗi có phải số hợp lệ:

```typescript
isValidNumber("123.45"); // true
isValidNumber("abc"); // false
```

#### `isVietnameseNumber(value)`

Kiểm tra định dạng số tiếng Việt:

```typescript
isVietnameseNumber("1.234.567,89"); // true
```

### Toán học

#### `sum(numbers)`, `average(numbers)`, `median(numbers)`

Các hàm tính toán cơ bản:

```typescript
sum([1, 2, 3, 4, 5]); // 15
average([1, 2, 3, 4, 5]); // 3
median([1, 2, 3, 4, 5]); // 3
```

#### `roundTo(value, decimals)`

Làm tròn đến số chữ số thập phân:

```typescript
roundTo(3.14159, 2); // 3.14
```

#### `clamp(value, min, max)`

Giới hạn giá trị trong khoảng:

```typescript
clamp(10, 0, 5); // 5
```

## Currency Utilities (`currency-utils.ts`)

### Định dạng tiền tệ

#### `formatVND(amount, options)`

Định dạng VND chuyên dụng:

```typescript
formatVND(50000); // "50.000 ₫"
formatVND(1000000, { compact: true }); // "1,0tr ₫"
```

#### `formatCurrency(amount, options)`

Định dạng tiền tệ đa dạng:

```typescript
formatCurrency(100, { currency: "USD", showSymbol: true }); // "100.00 $"
formatCurrency(50000, { currency: "VND", compact: true }); // "50k ₫"
```

#### `vndToVietnameseText(amount)`

Chuyển VND thành chữ tiếng Việt:

```typescript
vndToVietnameseText(50000); // "năm mười nghìn đồng"
vndToVietnameseText(1000000); // "một triệu đồng"
```

### Phân tích tiền tệ

#### `parseCurrency(value, currency)`

Phân tích chuỗi tiền tệ:

```typescript
parseCurrency("50.000 ₫", "VND"); // 50000
parseCurrency("1.5tr ₫", "VND"); // 1500000
```

### Chuyển đổi và tính toán

#### `convertCurrency(amount, from, to, rate)`

Chuyển đổi tiền tệ:

```typescript
convertCurrency(100, "USD", "VND", 24000); // 2400000
```

#### `calculatePriceChange(oldPrice, newPrice)`

Tính thay đổi giá:

```typescript
calculatePriceChange(100000, 120000);
// { change: 20000, percentage: 20, direction: "up" }
```

#### `formatPriceRange(range, options)`

Định dạng khoảng giá:

```typescript
formatPriceRange({ min: 100000, max: 500000, currency: "VND" });
// "100.000 ₫ - 500.000 ₫"
```

### Định dạng theo ngữ cảnh

#### `formatCurrencyForContext(amount, context, currency, locale)`

Định dạng tiền tệ theo ngữ cảnh sử dụng:

```typescript
// Hiển thị
formatCurrencyForContext(50000, "display", "VND", "vi"); // "50.000 ₫"

// Nhập liệu
formatCurrencyForContext(50000, "input", "VND", "vi"); // "50.000"

// Gọn gàng
formatCurrencyForContext(50000, "compact", "VND", "vi"); // "50k ₫"

// Xuất dữ liệu
formatCurrencyForContext(50000, "export", "VND", "vi"); // "50,000 Vietnamese dong"
```

## Object Utilities (`object-utils.ts`) ✅

### Sao chép và gộp object

#### `deepClone(obj, options)`

Sao chép sâu object với tùy chọn:

```typescript
const original = { a: 1, b: { c: 2 } };
const cloned = deepClone(original);
// cloned !== original && cloned.b !== original.b

// Với tùy chọn
deepClone(obj, { maxDepth: 5, cloneFunctions: true });
```

#### `deepMerge(target, ...sources)`

Gộp sâu nhiều object:

```typescript
const target = { a: 1, b: { c: 2 } };
const source = { b: { d: 3 }, e: 4 };
const merged = deepMerge(target, source);
// { a: 1, b: { c: 2, d: 3 }, e: 4 }
```

### So sánh object

#### `deepEqual(a, b, options)`

So sánh sâu hai object:

```typescript
deepEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } }); // true
deepEqual(obj1, obj2, { ignoreKeys: ["id", "createdAt"] });
```

### Làm phẳng object

#### `flatten(obj, options)` / `unflatten(obj, separator)`

Làm phẳng và mở rộng object:

```typescript
const nested = { a: { b: { c: 1 } } };
const flat = flatten(nested); // { "a.b.c": 1 }
const restored = unflatten(flat); // { a: { b: { c: 1 } } }

// Với tùy chọn
flatten(obj, { separator: "_", maxDepth: 3, prefix: "data" });
```

### Truy cập nested properties

#### `getNestedValue(obj, path, defaultValue)`

Lấy giá trị từ đường dẫn nested:

```typescript
const obj = { user: { profile: { name: "John" } } };
getNestedValue(obj, "user.profile.name"); // 'John'
getNestedValue(obj, "user.profile.age", 25); // 25 (default)
getNestedValue(obj, ["user", "profile", "name"]); // 'John'
```

#### `setNestedValue(obj, path, value)`

Đặt giá trị cho đường dẫn nested:

```typescript
const obj = {};
setNestedValue(obj, "user.profile.name", "John");
// obj = { user: { profile: { name: 'John' } } }
```

### Chọn lọc properties

#### `pick(obj, keys)` / `omit(obj, keys)`

Chọn hoặc loại bỏ properties:

```typescript
const obj = { a: 1, b: 2, c: 3 };
pick(obj, ["a", "c"]); // { a: 1, c: 3 }
omit(obj, ["b"]); // { a: 1, c: 3 }
```

### Biến đổi object

#### `mapValues(obj, mapper)`

Biến đổi values của object:

```typescript
const obj = { a: 1, b: 2, c: 3 };
mapValues(obj, (value, key) => value * 2); // { a: 2, b: 4, c: 6 }
```

#### `filterObject(obj, predicate)`

Lọc properties của object:

```typescript
const obj = { a: 1, b: 2, c: 3, d: 4 };
filterObject(obj, (value) => value % 2 === 0); // { b: 2, d: 4 }
```

### Xử lý tiếng Việt

#### `transformObjectForVietnamese(obj, options)`

Biến đổi object cho tiếng Việt:

```typescript
const obj = {
  tên: "Nguyễn Văn A",
  số_tiền: 1500000,
  ngày_tạo: new Date(),
};

transformObjectForVietnamese(obj, {
  convertDates: true, // Chuyển sang múi giờ VN
  formatNumbers: true, // Định dạng số kiểu VN
  normalizeKeys: true, // Bỏ dấu trong key
});
// { ten: 'Nguyễn Văn A', so_tien: '1.500.000', ngay_tao: ... }
```

### Utility functions

#### `isObject(value)` / `isEmpty(obj)`

Kiểm tra object:

```typescript
isObject({}); // true
isObject([]); // false
isEmpty({}); // true
isEmpty({ a: 1 }); // false
```

## Cách sử dụng

```typescript
import {
  // Number utilities
  formatNumber,
  numberToVietnameseText,
  formatBytes,
  formatPercentage,
  parseFormattedNumber,

  // Currency utilities
  formatVND,
  formatCurrency,
  vndToVietnameseText,
  parseCurrency,
  convertCurrency,
  formatPriceRange,

  // Object utilities
  deepClone,
  deepMerge,
  deepEqual,
  flatten,
  unflatten,
  getNestedValue,
  setNestedValue,
  pick,
  omit,
  mapValues,
  filterObject,
  transformObjectForVietnamese,
} from "@wibusystem/utils";

// Ví dụ sử dụng
const price = 1500000;
console.log(formatVND(price)); // "1.500.000 ₫"
console.log(vndToVietnameseText(price)); // "một triệu năm trăm nghìn đồng"

const user = { name: "John", profile: { age: 30 } };
const cloned = deepClone(user);
const age = getNestedValue(user, "profile.age", 0);
```

## Đặc điểm nổi bật

1. **Hỗ trợ tiếng Việt**: Tất cả utilities đều có hỗ trợ định dạng tiếng Việt
2. **Type Safety**: Được viết bằng TypeScript với type checking đầy đủ
3. **Performance**: Tối ưu hóa hiệu suất với caching và pre-compilation
4. **SonarQube Compliant**: Tuân thủ các quy tắc code quality nghiêm ngặt
5. **Low Cognitive Complexity**: Functions được tách nhỏ để dễ hiểu và maintain
6. **Modern JavaScript**: Sử dụng `Object.hasOwn()` thay vì `hasOwnProperty.call()`
7. **Production Ready**: Đã test và sẵn sàng cho production

## Build Info

- **CJS**: 58.02 KB
- **ESM**: 49.42 KB
- **TypeScript Definitions**: 30.49 KB
- **Tổng cộng**: ~138 KB

Package đã được tối ưu hóa cho tree-shaking, chỉ import những gì cần thiết.

## SonarQube Compliance

Tất cả code đã được tối ưu hóa để tuân thủ SonarQube rules:

- ✅ Cognitive Complexity < 15
- ✅ Sử dụng `Object.hasOwn()` thay vì `Object.prototype.hasOwnProperty.call()`
- ✅ Tránh code duplication
- ✅ Functions được tách nhỏ và có single responsibility
- ✅ Proper error handling và type safety
