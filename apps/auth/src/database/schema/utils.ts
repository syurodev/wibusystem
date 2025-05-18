import { type TObject } from "@sinclair/typebox";
import type { Column, Table } from "drizzle-orm";
import { type BuildSchema } from "drizzle-typebox";

// Helper type to extract properties from Drizzle schema (used by spread)
// This is a simplified version focusing on what drizzle-typebox might produce.
interface DrizzleAdaptedTable {
  properties: Record<string, TObject | Column<any, object, object>>;
  [key: string]: any; // Allow other properties that Drizzle tables might have
}

type SpreadableSchema = TObject | Table | DrizzleAdaptedTable;

type Spread<
  T extends SpreadableSchema,
  Mode extends "select" | "insert" | undefined,
> =
  T extends TObject<infer Fields>
    ? { [K in keyof Fields]: Fields[K] }
    : T extends Table
      ? Mode extends "select"
        ? // @ts-ignore // Tạm thời bỏ qua lỗi type ở đây vì không còn dùng spread với createSelectSchema nữa
          BuildSchema<"select", T["_"]["columns"], undefined>["properties"]
        : Mode extends "insert"
          ? // @ts-ignore // Tạm thời bỏ qua lỗi type ở đây vì không còn dùng spread với createInsertSchema nữa
            BuildSchema<"insert", T["_"]["columns"], undefined>["properties"]
          : T["_"]["columns"] // Fallback for raw table columns if mode is undefined
      : T extends DrizzleAdaptedTable
        ? T["properties"]
        : {};
