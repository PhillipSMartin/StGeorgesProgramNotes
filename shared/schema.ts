import { pgTable, text, serial, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Export Auth tables
export * from "./models/auth";

// === ADMIN CREDENTIALS (Phase 2) ===
export const admin_credentials = pgTable("admin_credentials", {
  id: serial("id").primaryKey(),
  passwordHash: text("password_hash").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type AdminCredentials = typeof admin_credentials.$inferSelect;

// === SUPPORTED LANGUAGES (Phase 2) ===
export const supported_languages = pgTable("supported_languages", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  label: text("label").notNull(),
  nativeLabel: text("native_label").notNull(),
  dir: text("dir").notNull().default("ltr"),
  enabled: boolean("enabled").notNull().default(true),
  order: integer("order").default(0),
});

export const insertSupportedLanguageSchema = createInsertSchema(supported_languages).omit({ id: true });
export type SupportedLanguage = typeof supported_languages.$inferSelect;
export type InsertSupportedLanguage = z.infer<typeof insertSupportedLanguageSchema>;

// === PROGRAM CONTENT (Phase 3 Prep) ===
export const program_content = pgTable("program_content", {
  id: serial("id").primaryKey(),
  section: text("section").notNull(),
  language: text("language").notNull(),
  content: text("content").notNull(),
  order: integer("order").default(0),
});

export const insertProgramContentSchema = createInsertSchema(program_content).omit({ id: true });
export type ProgramContent = typeof program_content.$inferSelect;
export type InsertProgramContent = z.infer<typeof insertProgramContentSchema>;

// === TRACKING (Phase 1 & 4) ===
export const tracking_events = pgTable("tracking_events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTrackingEventSchema = createInsertSchema(tracking_events).omit({ id: true, createdAt: true });
export type TrackingEvent = typeof tracking_events.$inferSelect;
export type InsertTrackingEvent = z.infer<typeof insertTrackingEventSchema>;
