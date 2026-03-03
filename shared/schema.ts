import { pgTable, text, varchar, integer, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const freemiumUsage = pgTable("freemium_usage", {
  id: serial("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  monthYear: text("month_year").notNull(),
  actionCount: integer("action_count").notNull().default(0),
});

export const insertFreemiumUsageSchema = createInsertSchema(freemiumUsage).omit({ id: true });
export type InsertFreemiumUsage = z.infer<typeof insertFreemiumUsageSchema>;
export type FreemiumUsage = typeof freemiumUsage.$inferSelect;

export const actionLogs = pgTable("action_logs", {
  id: serial("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  actionType: text("action_type").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertActionLogSchema = createInsertSchema(actionLogs).omit({ id: true, createdAt: true });
export type InsertActionLog = z.infer<typeof insertActionLogSchema>;
export type ActionLog = typeof actionLogs.$inferSelect;
