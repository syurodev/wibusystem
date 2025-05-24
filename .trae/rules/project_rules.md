1. Structure & Naming
   1.1. Each package should have a single responsibility (Single Responsibility Principle).
   1.2. Use clear, scoped names like @repo/common, @repo/ui, @repo/elysia-grpc.
   1.3. Avoid overly generic names like core or lib.
   1.4. Avoid unnecessary cross-dependencies between shared packages.

2. Source Code Organization
   2.1. Keep source files under src/, and build outputs in dist/.
   2.2. The entry file should be src/index.ts.
   2.3. Use sub-files for grouping functionality, e.g. src/date.ts, src/user.ts.
   2.4. Avoid side effects when importing packages — no code should execute on import unless explicitly designed to do so.

3. TypeScript & Build
   3.1. All packages should be written in TypeScript.
   3.2. Build outputs should include .d.ts (type declarations).
   3.3. Use lightweight build tools like tsup, unbuild, or rollup.
   3.4. Prefer ESM output; include CJS only if necessary.

4. Integration with Turborepo
   4.1. Each package must have a valid package.json, for example:

```json
{
  "name": "@repo/common",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch"
  }
}
```

4.2. In root turbo.json, define tasks using the new tasks format:

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": ["dist/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "check-types": {
      "dependsOn": ["^check-types"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

4.3. Use a shared tsconfig.base.json at the root:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@repo/common": ["packages/common/src"],
      "@repo/elysia-grpc": ["packages/elysia-grpc/src"]
    }
  }
}
```

5. Code Conventions
   5.1. Do not access environment variables (process.env) directly inside shared packages — isolate such logic.
   5.2. If environment variables are required, isolate them into a dedicated package (e.g. @yourorg/env).
   5.3. Centralize enums, constants, and config values into separate packages like @yourorg/constants.
