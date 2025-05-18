# Project Packages Overview

This document provides an overview of the internal packages used within this monorepo. These packages are located in the `packages/` directory.

## 1. `@repo/elysia-grpc`

- **Description**: A plugin for ElysiaJS to integrate and manage gRPC services. It allows defining services using Protocol Buffers (`.proto` files) and implementing their handlers in TypeScript. Also provides utilities for creating gRPC clients.
- **Key Functionalities**:
  - Simplified gRPC server setup within ElysiaJS.
  - Utility function `createGrpcClient` to create gRPC clients.
  - Load gRPC service definitions from multiple `.proto` files.
  - Automatic gRPC server lifecycle management.
- **Main Files/Exports**:
  - `grpc` plugin: The main plugin to integrate with Elysia.
  - `createGrpcClient()`: Utility function for client creation.
  - `GrpcProtoDefinition`: Interface for defining proto files.
  - `ServiceImplementationMap`: Type for mapping service implementations.
- **README**: `packages/elysia-grpc/README.md` for detailed usage.

## 2. `@repo/common`

- **Description**: A shared package containing common utilities, configurations, enums, and types used across different services in the project.
- **Key Functionalities/Modules**:
  - **Configs**: Contains API definitions (`api-definitions`).
  - **Enums**:
    - `ApiAccessibility`
    - `BOOLEAN` (from `boolean.enum.ts`)
    - `CurrencyCode`
    - `Default` (contents depend on `default.enum.ts`)
    - `HttpStatusCode`
    - `MessageCode`
    - `Permissions`
    - `Roles`
  - **Types**:
    - `Editor` types (from `editor.type.ts`).
    - `ApiResponse<T>`: Interface for standardized API responses.
  - **Utils**:
    - **Date Utilities (`utils/date/`)**:
      - `convertToMillis(input: Date | DateTime): number`: Converts JS Date or Luxon DateTime to Unix milliseconds.
      - `convertFromMillis(ms: number, zone?: string): Date`: Converts Unix milliseconds to JS Date.
      - `fromMillisToDateTime(ms: number, zone?: string): DateTime`: Converts Unix milliseconds to Luxon DateTime.
      - `fromSecondsToDateTime(seconds: number, zone?: string): DateTime`: Converts Unix seconds to Luxon DateTime.
      - `toSecondsFromDateTime(dt: DateTime): number`: Converts Luxon DateTime to Unix seconds.
      - `now(zone?: string): DateTime`: Gets current time as Luxon DateTime in specified zone.
      - `formatDateTime(dt: DateTime, format?: string, locale?: string): string`: Formats Luxon DateTime to string.
      - `formatMillis(ms: number, format?: string, zone?: string, locale?: string): string`: Formats Unix milliseconds to string.
      - `addDuration(dt: DateTime, duration: DurationLike): DateTime`: Adds duration to DateTime.
      - `subtractDuration(dt: DateTime, duration: DurationLike): DateTime`: Subtracts duration from DateTime.
      - `addYears(dt: DateTime, years: number): DateTime`
      - `addMonths(dt: DateTime, months: number): DateTime`
      - `addDays(dt: DateTime, days: number): DateTime`
      - `addHours(dt: DateTime, hours: number): DateTime`
      - `addMinutes(dt: DateTime, minutes: number): DateTime`
      - `addSeconds(dt: DateTime, seconds: number): DateTime`
      - `subtractYears(dt: DateTime, years: number): DateTime`
      - `subtractMonths(dt: DateTime, months: number): DateTime`
      - `subtractDays(dt: DateTime, days: number): DateTime`
      - `subtractHours(dt: DateTime, hours: number): DateTime`
      - `subtractMinutes(dt: DateTime, minutes: number): DateTime`
      - `subtractSeconds(dt: DateTime, seconds: number): DateTime`
      - `isBefore(dt1: DateTime, dt2: DateTime): boolean`
      - `isAfter(dt1: DateTime, dt2: DateTime): boolean`
      - `isSame(dt1: DateTime, dt2: DateTime, unit: keyof DurationLike): boolean`
      - `isSameDay(dt1: DateTime, dt2: DateTime): boolean`
      - `isSameHour(dt1: DateTime, dt2: DateTime): boolean`
      - `isSameMinute(dt1: DateTime, dt2: DateTime): boolean`
      - `isBetween(dt: DateTime, startDt: DateTime, endDt: DateTime, options?): boolean`
      - `COMMON_DATE_FORMATS`: Constant object for common date format strings.
      - `TIMEZONES`: Constant object for common IANA timezone strings.
    - **Formatting Utilities (`utils/formatting/`)**:
      - `currencyUtils.formatCurrency(amount: number, currencyCode?: CurrencyCodeEnum | string, locale?: string, options?: Intl.NumberFormatOptions): string`: Formats a number as a currency string.
    - **Response Formatter (`utils/response-formatter.ts`)**:
      - `createSuccessResponse<T>(data: T, message?: string, statusCode?: HttpStatusCode, pagination?): ApiResponse<T>`: Creates a standardized success API response.
      - `createErrorResponse(message: string, statusCode?: HttpStatusCode, errorCode?: string, errorDetails?: any): ApiResponse<null>`: Creates a standardized error API response.
- **Main Exports**: Exports all modules from `configs`, `enums`, `types`, and `utils` via `packages/common/src/index.ts`.
- **README**: N/A (Information gathered from `package.json` and `src` directory).

## 3. `@repo/ui`

- **Description**: A package containing shared React UI components.
- **Key Functionalities/Components**:
  - `Button`: A button component.
  - `Card`: A card layout component.
  - `Code`: A component for displaying code snippets.
- **Exports**: Components are exported from `packages/ui/src/*.tsx`.
- **README**: N/A (Information gathered from `package.json` and `src` directory).

## 4. `@repo/eslint-config`

- **Description**: Provides shared ESLint configurations for maintaining code quality and consistency across the monorepo.
- **Key Configurations**:
  - `base.js`: Base ESLint configuration.
  - `next.js`: ESLint configuration tailored for Next.js projects.
  - `react-internal.js`: ESLint configuration for internal React projects/libraries.
- **README**: `packages/eslint-config/README.md`.

## 5. `@repo/typescript-config`

- **Description**: Contains shared TypeScript `tsconfig.json` configurations for different types of projects within the monorepo.
- **Key Configurations**:
  - `base.json`: A base TypeScript configuration.
  - `base-buildable.json`: A base configuration for buildable packages.
  - `elysia.json`: TypeScript configuration for ElysiaJS projects.
  - `nextjs.json`: TypeScript configuration for Next.js projects.
  - `react-library.json`: TypeScript configuration for React library projects.
- **README**: N/A (Information gathered from `package.json` and file names).
