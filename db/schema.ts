import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const productChanges = sqliteTable("product_changes", {
  id: text("id").primaryKey(),
  action: text("action", { enum: ["upsert", "delete"] }).notNull(),
  data: text("data").notNull().default("{}"),
  updatedAt: integer("updated_at").notNull(),
});

export const categoryChanges = sqliteTable("category_changes", {
  id: text("id").primaryKey(),
  action: text("action", { enum: ["upsert", "delete"] }).notNull(),
  data: text("data").notNull().default("{}"),
  updatedAt: integer("updated_at").notNull(),
});

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  customerName: text("customer_name").notNull().default(""),
  customerPhone: text("customer_phone").notNull().default(""),
  payload: text("payload").notNull(),
  total: integer("total").notNull().default(0),
  status: text("status").notNull().default("nuevo"),
  createdAt: integer("created_at").notNull(),
}, (table) => [index("idx_orders_created_at").on(table.createdAt)]);
