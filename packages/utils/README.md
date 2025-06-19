# @repo/utils

A collection of common utility functions for the wibusystem monorepo, including powerful date/time utilities with timezone support and Vietnamese i18n.

## Features

- **Type-safe utilities** - All functions are fully typed with TypeScript
- **Comprehensive date/time handling** - Timezone conversion, arithmetic, comparison
- **Vietnamese i18n support** - Complete Vietnamese localization for dates/times
- **Tree-shakeable** - Use only what you need
- **Well tested** - Comprehensive test coverage with Bun test
- **Zero dependencies** (except dayjs for date utilities)

## Installation

```bash
# In monorepo workspace
bun add @repo/utils

# For external usage (after publishing)
bun add @repo/utils
```

## Basic Utilities

### Type Guards & Object Utils

```typescript
import { isDefined, get } from "@repo/utils";

// Type-safe null/undefined checking
const value: string | null = getValue();
if (isDefined(value)) {
  // TypeScript knows value is string here
  console.log(value.toUpperCase());
}

// Safe object property access
const user = { profile: { name: "John" } };
const name = get(user, "profile.name", "Unknown"); // 'John'
const email = get(user, "profile.email", "No email"); // 'No email'
```

### Function Utilities

```typescript
import { debounce, delay, clamp } from "@repo/utils";

// Debounce function calls
const debouncedSearch = debounce((query: string) => {
  console.log("Searching for:", query);
}, 300);

// Create delays
await delay(1000); // Wait 1 second

// Clamp numbers to range
const progress = clamp(percentage, 0, 100);
```

## Date & Time Utilities

### Timezone Conversion (GMT+7 ↔ UTC ↔ Unix)

```typescript
import {
  parseVietnamTimeToUnix,
  parseUnixToVietnamTime,
  getCurrentVietnamTime,
  getCurrentUnixTimestamp,
  DateFormats,
} from "@repo/utils";

// Client → Server: Vietnam time → Unix timestamp
const clientTime = "25/12/2024 14:30:00";
const unixTimestamp = parseVietnamTimeToUnix(
  clientTime,
  DateFormats.DD_MM_YYYY_HH_MM_SS
);

// Server → Client: Unix timestamp → Vietnam time
const backToVietnam = parseUnixToVietnamTime(
  unixTimestamp,
  DateFormats.DD_MM_YYYY_HH_MM_SS
);

// Current times
const currentVN = getCurrentVietnamTime(DateFormats.DD_MM_YYYY_HH_MM_SS);
const currentUnix = getCurrentUnixTimestamp();
```

### Date Arithmetic

```typescript
import {
  addMinutes,
  addHours,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  subtractDays,
  DateFormats,
} from "@repo/utils";

const baseDate = "25/12/2024 10:00:00";

// Adding time
const inThirtyMinutes = addMinutes(
  baseDate,
  30,
  DateFormats.DD_MM_YYYY_HH_MM_SS
);
const inTwoHours = addHours(baseDate, 2, DateFormats.DD_MM_YYYY_HH_MM_SS);
const inFiveDays = addDays(baseDate, 5, DateFormats.DD_MM_YYYY_HH_MM_SS);
const inOneWeek = addWeeks(baseDate, 1, DateFormats.DD_MM_YYYY_HH_MM_SS);
const inTwoMonths = addMonths(baseDate, 2, DateFormats.DD_MM_YYYY_HH_MM_SS);
const inOneYear = addYears(baseDate, 1, DateFormats.DD_MM_YYYY_HH_MM_SS);

// Subtracting time
const tenDaysAgo = subtractDays(baseDate, 10, DateFormats.DD_MM_YYYY_HH_MM_SS);
```

### Date Comparison

```typescript
import {
  isDateBefore,
  isDateAfter,
  isDateSame,
  isDateSameOrBefore,
  isDateBetween,
} from "@repo/utils";

const date1 = "24/12/2024 10:00:00";
const date2 = "25/12/2024 10:00:00";
const date3 = "26/12/2024 10:00:00";

// Comparisons
const isBefore = isDateBefore(date1, date2); // true
const isAfter = isDateAfter(date2, date1); // true
const isSame = isDateSame(date1, date2); // false
const isSameOrBefore = isDateSameOrBefore(date1, date2); // true
const isBetween = isDateBetween(date2, date1, date3); // true
```

### Date Differences

```typescript
import {
  getDifferenceInMinutes,
  getDifferenceInHours,
  getDifferenceInDays,
} from "@repo/utils";

const startDate = "24/12/2024 10:00:00";
const endDate = "25/12/2024 14:30:00";

const diffMinutes = getDifferenceInMinutes(endDate, startDate); // 1710
const diffHours = getDifferenceInHours(endDate, startDate, true); // 28.5
const diffDays = getDifferenceInDays(endDate, startDate, true); // 1.1875
```

## Vietnamese i18n Support 🇻🇳

### Vietnamese Date Formatting

```typescript
import {
  toVietnameseShortDate,
  toVietnameseMediumDate,
  toVietnameseLongDate,
  toVietnameseFullDate,
  toVietnameseTime,
  toVietnameseDateTime,
  VietnameseFormats,
} from "@repo/utils";

const date = new Date("2024-12-25T14:30:45");

// Vietnamese date formats
console.log(toVietnameseShortDate(date)); // "25/12/2024"
console.log(toVietnameseMediumDate(date)); // "25 tháng 12 năm 2024"
console.log(toVietnameseLongDate(date)); // "Thứ Tư, 25 tháng 12 năm 2024"
console.log(toVietnameseFullDate(date)); // "Thứ Tư, ngày 25 tháng 12 năm 2024"

// Vietnamese time formats
console.log(toVietnameseTime(date)); // "14 giờ 30 phút"
console.log(toVietnameseTime(date, true)); // "14 giờ 30 phút 45 giây"

// Vietnamese datetime formats
console.log(toVietnameseDateTime(date)); // "Thứ Tư, 25/12/2024 lúc 14:30"
console.log(toVietnameseDateTime(date, true)); // "Thứ Tư, ngày 25 tháng 12 năm 2024 lúc 14 giờ 30 phút"
```

### Vietnamese Relative Time

```typescript
import {
  getVietnameseRelativeTime,
  getVietnameseRelativeTimeBetween,
  subtractHours,
  addDays,
} from "@repo/utils";

// Vietnamese relative time
const threeHoursAgo = subtractHours(new Date(), 3);
const fiveDaysLater = addDays(new Date(), 5);

console.log(getVietnameseRelativeTime(threeHoursAgo)); // "3 giờ trước"
console.log(getVietnameseRelativeTime(fiveDaysLater)); // "5 ngày nữa"

// Between two dates
const date1 = new Date("2024-12-20");
const date2 = new Date("2024-12-25");
console.log(getVietnameseRelativeTimeBetween(date2, date1)); // "5 ngày nữa"
```

### Vietnamese Date Components

```typescript
import {
  getVietnameseWeekday,
  getVietnameseMonth,
  getVietnameseDateOrdinal,
  getVietnameseTimePeriod,
} from "@repo/utils";

const date = new Date("2024-12-25T14:30:00"); // Thứ Tư

// Weekday names
console.log(getVietnameseWeekday(date)); // "Thứ Tư"
console.log(getVietnameseWeekday(date, true)); // "T4"

// Month names
console.log(getVietnameseMonth(date)); // "Tháng Mười Hai"
console.log(getVietnameseMonth(date, true)); // "Th12"

// Date ordinal
console.log(getVietnameseDateOrdinal(date)); // "ngày 25"

// Time periods
console.log(getVietnameseTimePeriod(date)); // "chiều" (2:30 PM)
```

### Vietnamese Time Periods & Context

```typescript
import {
  toVietnameseDateWithPeriod,
  toVietnameseDateTimeWithPeriod,
  getVietnameseTimePeriod,
} from "@repo/utils";

const morningTime = new Date("2024-12-25T08:30:00");
const eveningTime = new Date("2024-12-25T19:30:00");

// Time periods: sáng (5-12), chiều (12-18), tối (18-22), đêm (22-5)
console.log(getVietnameseTimePeriod(morningTime)); // "sáng"
console.log(getVietnameseTimePeriod(eveningTime)); // "tối"

// Date with period context
console.log(toVietnameseDateWithPeriod(morningTime)); // "sáng 25/12/2024"
console.log(toVietnameseDateTimeWithPeriod(eveningTime)); // "tối 25/12/2024 lúc 19:30"
```

### Business/Formal Vietnamese Formats

```typescript
import {
  toVietnameseFormalDate,
  toVietnameseDateRange,
  toVietnameseDateWithLunar,
} from "@repo/utils";

const date = new Date("2024-12-25");
const startDate = new Date("2024-12-20");
const endDate = new Date("2024-12-25");

// Formal business format
console.log(toVietnameseFormalDate(date)); // "Ngày 25 tháng 12 năm 2024"
console.log(toVietnameseFormalDate(date, true)); // "Ngày 25 tháng 12 năm 2024, tại ............"

// Date ranges
console.log(toVietnameseDateRange(startDate, endDate)); // "từ 20/12/2024 đến 25/12/2024"

// With lunar calendar note
console.log(toVietnameseDateWithLunar(date)); // "25/12/2024 (âm lịch)"
```

### Locale Management

```typescript
import {
  setGlobalLocale,
  getCurrentLocale,
  withLocale,
  VIETNAMESE_LOCALE,
  DEFAULT_LOCALE,
} from "@repo/utils";

// Set global locale
setGlobalLocale(VIETNAMESE_LOCALE); // Set to Vietnamese
console.log(getCurrentLocale()); // "vi"

// Temporary locale switching
const englishResult = withLocale(DEFAULT_LOCALE, () => {
  return dayjs().format("dddd, MMMM DD, YYYY");
});
console.log(englishResult); // "Wednesday, December 25, 2024"
console.log(getCurrentLocale()); // Still "vi"
```

## Supported Date Formats

### Standard Formats

```typescript
export const DateFormats = {
  DD_MM_YYYY: "DD/MM/YYYY", // 25/12/2024
  DD_MM_YYYY_HH_MM: "DD/MM/YYYY HH:mm", // 25/12/2024 14:30
  DD_MM_YYYY_HH_MM_SS: "DD/MM/YYYY HH:mm:ss", // 25/12/2024 14:30:45
  DD_MM_YYYY_DASH: "DD-MM-YYYY", // 25-12-2024
  DD_MM_YYYY_HH_MM_DASH: "DD-MM-YYYY HH:mm", // 25-12-2024 14:30
  DD_MM_YYYY_HH_MM_SS_DASH: "DD-MM-YYYY HH:mm:ss", // 25-12-2024 14:30:45
  YYYY_MM_DD: "YYYY-MM-DD", // 2024-12-25
  YYYY_MM_DD_HH_MM: "YYYY-MM-DD HH:mm", // 2024-12-25 14:30
  YYYY_MM_DD_HH_MM_SS: "YYYY-MM-DD HH:mm:ss", // 2024-12-25 14:30:45
} as const;
```

### Vietnamese Formats

```typescript
export const VietnameseFormats = {
  SHORT_DATE: "DD/MM/YYYY", // 25/12/2024
  MEDIUM_DATE: "DD [tháng] MM [năm] YYYY", // 25 tháng 12 năm 2024
  LONG_DATE: "dddd, DD [tháng] MM [năm] YYYY", // Thứ Tư, 25 tháng 12 năm 2024
  FULL_DATE: "dddd, [ngày] DD [tháng] MM [năm] YYYY", // Thứ Tư, ngày 25 tháng 12 năm 2024

  SHORT_TIME: "HH:mm", // 14:30
  LONG_TIME: "HH [giờ] mm [phút]", // 14 giờ 30 phút
  FULL_TIME: "HH [giờ] mm [phút] ss [giây]", // 14 giờ 30 phút 45 giây

  SHORT_DATETIME: "DD/MM/YYYY HH:mm", // 25/12/2024 14:30
  LONG_DATETIME: "dddd, DD/MM/YYYY [lúc] HH:mm", // Thứ Tư, 25/12/2024 lúc 14:30
  FULL_DATETIME:
    "dddd, [ngày] DD [tháng] MM [năm] YYYY [lúc] HH [giờ] mm [phút]",
} as const;
```

## Use Case Examples

### API Server with Vietnamese Client

```typescript
import {
  parseVietnamTimeToUnix,
  parseUnixToVietnamTime,
  toVietnameseDateTime,
  DateFormats,
} from "@repo/utils";

// Receiving date from Vietnamese client
const clientDate = "25/12/2024 14:30:00"; // GMT+7
const unixTimestamp = parseVietnamTimeToUnix(
  clientDate,
  DateFormats.DD_MM_YYYY_HH_MM_SS
);

// Store in database as Unix timestamp
await database.save({ timestamp: unixTimestamp });

// Retrieve and send back to client in Vietnamese
const dbTimestamp = await database.getTimestamp();
const vietnamTime = parseUnixToVietnamTime(
  dbTimestamp,
  DateFormats.DD_MM_YYYY_HH_MM_SS
);
const vietnameseDisplay = toVietnameseDateTime(dbTimestamp); // "Thứ Tư, 25/12/2024 lúc 14:30"

res.json({
  timestamp: vietnamTime,
  display: vietnameseDisplay,
});
```

### Vietnamese User Interface

```typescript
import {
  getVietnameseRelativeTime,
  toVietnameseShortDate,
  getVietnameseTimePeriod,
  toVietnameseDateWithPeriod,
} from "@repo/utils";

// Comment timestamps
const commentTime = new Date("2024-12-24T10:30:00");
const display = getVietnameseRelativeTime(commentTime); // "1 ngày trước"

// Calendar events
const eventDate = new Date("2024-12-25T09:00:00");
const eventDisplay = toVietnameseDateWithPeriod(eventDate); // "sáng 25/12/2024"

// Notifications
const notificationTime = new Date("2024-12-25T19:30:00");
const period = getVietnameseTimePeriod(notificationTime); // "tối"
```

### Formal Documents

```typescript
import { toVietnameseFormalDate, toVietnameseDateRange } from "@repo/utils";

// Contract dates
const contractDate = new Date("2024-12-25");
const formalDate = toVietnameseFormalDate(contractDate, true);
// "Ngày 25 tháng 12 năm 2024, tại ............"

// Project timeline
const startDate = new Date("2024-12-01");
const endDate = new Date("2024-12-31");
const projectPeriod = toVietnameseDateRange(startDate, endDate);
// "từ 01/12/2024 đến 31/12/2024"
```

## Development

### Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test:coverage

# Update snapshots
bun test:update-snapshots

# Generate CI report
bun test:ci
```

### Building

```bash
# Build for production
bun run build

# Type checking
bun run check-types

# Linting
bun run lint
```

## Dependencies

- **dayjs** - For comprehensive date/time manipulation
  - Core plugins: timezone, utc, customParseFormat, relativeTime, isLeapYear
  - i18n plugins: localizedFormat, weekday, updateLocale
  - Vietnamese locale: 'dayjs/locale/vi'

## String Utilities 🔤

Powerful string processing utilities with Vietnamese language support.

### Vietnamese Accent Removal

```typescript
import { removeVietnameseAccents, isVietnameseText } from "@repo/utils";

// Remove Vietnamese accents
removeVietnameseAccents("Nguyễn Văn Đức"); // "Nguyen Van Duc"
removeVietnameseAccents("Tiếng Việt"); // "Tieng Viet"
removeVietnameseAccents("Hồ Chí Minh"); // "Ho Chi Minh"

// Detect Vietnamese text
isVietnameseText("Nguyễn Văn Đức"); // true
isVietnameseText("Hello World"); // false
```

### Slugify & URL-Friendly Strings

```typescript
import { slugify, toFilename } from "@repo/utils";

// Create URL-friendly slugs
slugify("Nguyễn Văn Đức"); // "nguyen-van-duc"
slugify("Tiếng Việt 123!"); // "tieng-viet-123"
slugify("Hello World", "_"); // "hello_world"

// Create filename-safe strings
toFilename("Nguyễn Văn Đức.pdf"); // "nguyen_van_duc.pdf"
toFilename("Bài viết về công nghệ.docx"); // "bai_viet_ve_cong_nghe.docx"
```

### Case Conversion

```typescript
import {
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  toKebabCase,
} from "@repo/utils";

const text = "nguyễn văn đức";

toCamelCase(text); // "nguyenVanDuc"
toPascalCase(text); // "NguyenVanDuc"
toSnakeCase(text); // "nguyen_van_duc"
toKebabCase(text); // "nguyen-van-duc"
```

### Capitalization & Vietnamese Names

```typescript
import { capitalize, capitalizeWords, formatVietnameseName } from "@repo/utils";

// Basic capitalization
capitalize("hello world"); // "Hello world"
capitalizeWords("hello world"); // "Hello World"

// Vietnamese name formatting
formatVietnameseName("nguyễn văn đức"); // "Nguyễn Văn Đức"
formatVietnameseName("TRẦN THỊ HƯƠNG"); // "Trần Thị Hương"
formatVietnameseName("  lê   minh   tuấn  "); // "Lê Minh Tuấn"
```

### Vietnamese Validation

```typescript
import {
  isValidEmail,
  isValidVietnamesePhone,
  isValidVietnameseId,
} from "@repo/utils";

// Email validation
isValidEmail("user@example.com"); // true
isValidEmail("invalid-email"); // false

// Vietnamese phone number validation
isValidVietnamesePhone("0912345678"); // true
isValidVietnamesePhone("+84912345678"); // true
isValidVietnamesePhone("84912345678"); // true
isValidVietnamesePhone("091 234 5678"); // true (with spaces)
isValidVietnamesePhone("(091) 234-5678"); // true (with formatting)
isValidVietnamesePhone("0123456789"); // false (invalid prefix)

// Vietnamese ID validation (CCCD/CMND)
isValidVietnameseId("123456789"); // true (CMND - 9 digits)
isValidVietnameseId("123456789012"); // true (CCCD - 12 digits)
isValidVietnameseId("123 456 789"); // true (with spaces)
isValidVietnameseId("12345678"); // false (too short)
```

### Text Formatting

```typescript
import {
  truncate,
  truncateWords,
  stripHtml,
  normalizeWhitespace,
} from "@repo/utils";

// Text truncation
truncate("Hello World", 5); // "He..."
truncate("Hello World", 11, "---"); // "Hello W---"
truncateWords("Hello beautiful world", 10); // "Hello..."

// HTML stripping
stripHtml("<p>Hello <strong>World</strong></p>"); // "Hello World"

// Whitespace normalization
normalizeWhitespace("  Multiple   spaces  "); // "Multiple spaces"
normalizeWhitespace("Line 1\n\n\nLine 2"); // "Line 1\nLine 2"
```

### Text Extraction & Analysis

```typescript
import {
  extractNumbers,
  extractVietnameseWords,
  countWords,
  countCharacters,
  getReadingTime,
} from "@repo/utils";

// Extract numbers from text
extractNumbers("Price: $123.45 and €67.89"); // [123.45, 67.89]

// Extract Vietnamese words only
extractVietnameseWords("Nguyễn Văn Đức 123!"); // "Nguyễn Văn Đức"
extractVietnameseWords("Hello Việt Nam 2024"); // "Hello Việt Nam"

// Text analysis
countWords("Hello world"); // 2
countCharacters("Hello world"); // 10 (excluding spaces)

const longText = "Lorem ipsum dolor sit amet...";
getReadingTime(longText); // Estimated minutes (200 words/min default)
getReadingTime(longText, 150); // Custom reading speed
```

### Search & Highlight (Accent-Insensitive)

```typescript
import { searchVietnameseText, highlightSearchTerm } from "@repo/utils";

// Accent-insensitive Vietnamese search
searchVietnameseText("Nguyễn Văn Đức", "nguyen"); // true
searchVietnameseText("Nguyễn Văn Đức", "NGUYEN"); // true
searchVietnameseText("Nguyễn Văn Đức", "duc"); // true (finds "Đức")

// Highlight search terms
highlightSearchTerm("Hello world", "world"); // "Hello <mark>world</mark>"
highlightSearchTerm("Hello world", "WORLD"); // "Hello <mark>world</mark>" (case-insensitive)
highlightSearchTerm("Hello world", "world", "strong"); // "Hello <strong>world</strong>"
```

### Utility Functions

```typescript
import { generateRandomString, generateVietnamesePassword } from "@repo/utils";

// Generate random strings
generateRandomString(10); // Random 10-character alphanumeric string
generateRandomString(8, "ABC123"); // Random 8-character string from "ABC123"

// Generate Vietnamese-friendly passwords (excludes confusing characters)
generateVietnamesePassword(12); // 12-character password
// Excludes: 0, O, l, I, 1 (confusing characters)
// Includes: A-Z, a-z, 2-9, !@#$%^&*

try {
  generateVietnamesePassword(7); // Throws error
} catch (error) {
  console.log(error.message); // "Password length must be at least 8 characters"
}
```

### Use Case Examples

#### Blog/CMS System

```typescript
import {
  removeVietnameseAccents,
  slugify,
  truncate,
  countWords,
  getReadingTime,
} from "@repo/utils";

const blogPost = {
  title: "Hướng dẫn lập trình JavaScript",
  content: "Đây là nội dung bài viết về JavaScript...",
};

// Generate URL slug
const slug = slugify(blogPost.title); // "huong-dan-lap-trinh-javascript"

// Meta description
const metaDescription = truncate(blogPost.content, 160);

// Reading stats
const wordCount = countWords(blogPost.content);
const readingTime = getReadingTime(blogPost.content);

console.log({
  slug,
  metaDescription,
  wordCount,
  readingTime: `${readingTime} phút đọc`,
});
```

#### User Profile System

```typescript
import {
  formatVietnameseName,
  isValidVietnamesePhone,
  isValidVietnameseId,
  isValidEmail,
} from "@repo/utils";

function validateUserProfile(profile: any) {
  const errors: string[] = [];

  // Format and validate name
  if (profile.name) {
    profile.name = formatVietnameseName(profile.name);
  }

  // Validate email
  if (!isValidEmail(profile.email)) {
    errors.push("Email không hợp lệ");
  }

  // Validate phone
  if (!isValidVietnamesePhone(profile.phone)) {
    errors.push("Số điện thoại không hợp lệ");
  }

  // Validate ID
  if (!isValidVietnameseId(profile.idNumber)) {
    errors.push("Số CCCD/CMND không hợp lệ");
  }

  return { isValid: errors.length === 0, errors, profile };
}
```

#### Search System

```typescript
import {
  searchVietnameseText,
  highlightSearchTerm,
  removeVietnameseAccents,
} from "@repo/utils";

function searchProducts(products: any[], searchTerm: string) {
  // Accent-insensitive search
  const results = products.filter(
    (product) =>
      searchVietnameseText(product.name, searchTerm) ||
      searchVietnameseText(product.description, searchTerm)
  );

  // Highlight search terms in results
  return results.map((product) => ({
    ...product,
    highlightedName: highlightSearchTerm(product.name, searchTerm),
    highlightedDescription: highlightSearchTerm(
      product.description,
      searchTerm
    ),
  }));
}

// Usage
const products = [
  { name: "Áo sơ mi nam", description: "Áo sơ mi màu xanh đẹp" },
  { name: "Quần jean nữ", description: "Quần jean thời trang" },
];

const results = searchProducts(products, "ao"); // Finds "Áo sơ mi nam"
```

## Contributing

1. Add your utility function to `src/index.ts` or create a new file in `src/`
2. For Vietnamese i18n features, add to `src/date-i18n.ts`
3. For string processing features, add to `src/string-utils.ts`
4. Create comprehensive tests in the `tests/` directory
5. Update this README with API documentation
6. Ensure all tests pass with `bun test`
7. Check TypeScript compilation with `bun run check-types`

## Vietnamese i18n Support 🇻🇳

Day.js có hỗ trợ i18n mạnh mẽ và chúng tôi đã tận dụng điều này để tạo ra các utility functions hiển thị ngày tháng bằng tiếng Việt hoàn chỉnh.

### Vietnamese Date Formatting

```typescript
import {
  toVietnameseShortDate,
  toVietnameseMediumDate,
  toVietnameseLongDate,
  toVietnameseFullDate,
  toVietnameseTime,
  toVietnameseDateTime,
  VietnameseFormats,
} from "@repo/utils";

const date = new Date("2024-12-25T14:30:45");

// Vietnamese date formats
console.log(toVietnameseShortDate(date)); // "25/12/2024"
console.log(toVietnameseMediumDate(date)); // "25 tháng 12 năm 2024"
console.log(toVietnameseLongDate(date)); // "Thứ Tư, 25 tháng 12 năm 2024"
console.log(toVietnameseFullDate(date)); // "Thứ Tư, ngày 25 tháng 12 năm 2024"

// Vietnamese time formats
console.log(toVietnameseTime(date)); // "14 giờ 30 phút"
console.log(toVietnameseTime(date, true)); // "14 giờ 30 phút 45 giây"

// Vietnamese datetime formats
console.log(toVietnameseDateTime(date)); // "Thứ Tư, 25/12/2024 lúc 14:30"
console.log(toVietnameseDateTime(date, true)); // "Thứ Tư, ngày 25 tháng 12 năm 2024 lúc 14 giờ 30 phút"
```

### Vietnamese Relative Time

```typescript
import {
  getVietnameseRelativeTime,
  getVietnameseRelativeTimeBetween,
  subtractHours,
  addDays,
} from "@repo/utils";

// Vietnamese relative time
const threeHoursAgo = subtractHours(new Date(), 3);
const fiveDaysLater = addDays(new Date(), 5);

console.log(getVietnameseRelativeTime(threeHoursAgo)); // "3 giờ trước"
console.log(getVietnameseRelativeTime(fiveDaysLater)); // "5 ngày nữa"

// Between two dates
const date1 = new Date("2024-12-20");
const date2 = new Date("2024-12-25");
console.log(getVietnameseRelativeTimeBetween(date2, date1)); // "5 ngày nữa"
```

### Vietnamese Date Components

```typescript
import {
  getVietnameseWeekday,
  getVietnameseMonth,
  getVietnameseDateOrdinal,
  getVietnameseTimePeriod,
} from "@repo/utils";

const date = new Date("2024-12-25T14:30:00"); // Thứ Tư

// Weekday names
console.log(getVietnameseWeekday(date)); // "Thứ Tư"
console.log(getVietnameseWeekday(date, true)); // "T4"

// Month names
console.log(getVietnameseMonth(date)); // "Tháng Mười Hai"
console.log(getVietnameseMonth(date, true)); // "Th12"

// Date ordinal
console.log(getVietnameseDateOrdinal(date)); // "ngày 25"

// Time periods
console.log(getVietnameseTimePeriod(date)); // "chiều" (2:30 PM)
```

### Vietnamese Time Periods & Context

```typescript
import {
  toVietnameseDateWithPeriod,
  toVietnameseDateTimeWithPeriod,
  getVietnameseTimePeriod,
} from "@repo/utils";

const morningTime = new Date("2024-12-25T08:30:00");
const eveningTime = new Date("2024-12-25T19:30:00");

// Time periods: sáng (5-12), chiều (12-18), tối (18-22), đêm (22-5)
console.log(getVietnameseTimePeriod(morningTime)); // "sáng"
console.log(getVietnameseTimePeriod(eveningTime)); // "tối"

// Date with period context
console.log(toVietnameseDateWithPeriod(morningTime)); // "sáng 25/12/2024"
console.log(toVietnameseDateTimeWithPeriod(eveningTime)); // "tối 25/12/2024 lúc 19:30"
```

### Business/Formal Vietnamese Formats

```typescript
import {
  toVietnameseFormalDate,
  toVietnameseDateRange,
  toVietnameseDateWithLunar,
} from "@repo/utils";

const date = new Date("2024-12-25");
const startDate = new Date("2024-12-20");
const endDate = new Date("2024-12-25");

// Formal business format
console.log(toVietnameseFormalDate(date)); // "Ngày 25 tháng 12 năm 2024"
console.log(toVietnameseFormalDate(date, true)); // "Ngày 25 tháng 12 năm 2024, tại ............"

// Date ranges
console.log(toVietnameseDateRange(startDate, endDate)); // "từ 20/12/2024 đến 25/12/2024"

// With lunar calendar note
console.log(toVietnameseDateWithLunar(date)); // "25/12/2024 (âm lịch)"
```

### Locale Management

```typescript
import {
  setGlobalLocale,
  getCurrentLocale,
  withLocale,
  VIETNAMESE_LOCALE,
  DEFAULT_LOCALE,
} from "@repo/utils";

// Set global locale
setGlobalLocale(VIETNAMESE_LOCALE); // Set to Vietnamese
console.log(getCurrentLocale()); // "vi"

// Temporary locale switching
const englishResult = withLocale(DEFAULT_LOCALE, () => {
  return dayjs().format("dddd, MMMM DD, YYYY");
});
console.log(englishResult); // "Wednesday, December 25, 2024"
console.log(getCurrentLocale()); // Still "vi"
```

### Vietnamese Format Constants

```typescript
export const VietnameseFormats = {
  SHORT_DATE: "DD/MM/YYYY", // 25/12/2024
  MEDIUM_DATE: "DD [tháng] MM [năm] YYYY", // 25 tháng 12 năm 2024
  LONG_DATE: "dddd, DD [tháng] MM [năm] YYYY", // Thứ Tư, 25 tháng 12 năm 2024
  FULL_DATE: "dddd, [ngày] DD [tháng] MM [năm] YYYY", // Thứ Tư, ngày 25 tháng 12 năm 2024

  SHORT_TIME: "HH:mm", // 14:30
  LONG_TIME: "HH [giờ] mm [phút]", // 14 giờ 30 phút
  FULL_TIME: "HH [giờ] mm [phút] ss [giây]", // 14 giờ 30 phút 45 giây

  SHORT_DATETIME: "DD/MM/YYYY HH:mm", // 25/12/2024 14:30
  LONG_DATETIME: "dddd, DD/MM/YYYY [lúc] HH:mm", // Thứ Tư, 25/12/2024 lúc 14:30
  FULL_DATETIME:
    "dddd, [ngày] DD [tháng] MM [năm] YYYY [lúc] HH [giờ] mm [phút]",
} as const;
```

### Use Cases for Vietnamese i18n

#### 1. Vietnamese User Interface

```typescript
// Comment timestamps
const commentTime = new Date("2024-12-24T10:30:00");
const display = getVietnameseRelativeTime(commentTime); // "1 ngày trước"

// Calendar events
const eventDate = new Date("2024-12-25T09:00:00");
const eventDisplay = toVietnameseDateWithPeriod(eventDate); // "sáng 25/12/2024"

// Notifications
const notificationTime = new Date("2024-12-25T19:30:00");
const period = getVietnameseTimePeriod(notificationTime); // "tối"
```

#### 2. Formal Documents & Contracts

```typescript
// Contract dates
const contractDate = new Date("2024-12-25");
const formalDate = toVietnameseFormalDate(contractDate, true);
// "Ngày 25 tháng 12 năm 2024, tại ............"

// Project timeline
const startDate = new Date("2024-12-01");
const endDate = new Date("2024-12-31");
const projectPeriod = toVietnameseDateRange(startDate, endDate);
// "từ 01/12/2024 đến 31/12/2024"
```

#### 3. API Server with Vietnamese Client

```typescript
// Receiving date from Vietnamese client
const clientDate = "25/12/2024 14:30:00"; // GMT+7
const unixTimestamp = parseVietnamTimeToUnix(
  clientDate,
  DateFormats.DD_MM_YYYY_HH_MM_SS
);

// Retrieve and send back to client in Vietnamese
const dbTimestamp = await database.getTimestamp();
const vietnamTime = parseUnixToVietnamTime(
  dbTimestamp,
  DateFormats.DD_MM_YYYY_HH_MM_SS
);
const vietnameseDisplay = toVietnameseDateTime(dbTimestamp); // "Thứ Tư, 25/12/2024 lúc 14:30"

res.json({
  timestamp: vietnamTime,
  display: vietnameseDisplay,
});
```

## License

This package is part of the wibusystem monorepo.
