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

// === PROGRAM CONTENT (Phase 3 - legacy, kept for migration compatibility) ===
export const program_content = pgTable("program_content", {
  id: serial("id").primaryKey(),
  section: text("section").notNull(),
  language: text("language").notNull(),
  content: text("content").notNull(),
  order: integer("order").default(0),
  published: boolean("published").notNull().default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProgramContentSchema = createInsertSchema(program_content).omit({ id: true, updatedAt: true });
export type ProgramContent = typeof program_content.$inferSelect;
export type InsertProgramContent = z.infer<typeof insertProgramContentSchema>;

// === PROGRAM INTRO (thematic intro paragraph before pieces) ===
export const program_intro = pgTable("program_intro", {
  id: serial("id").primaryKey(),
  language: text("language").notNull().unique(),
  content: text("content").notNull().default(""),
  published: boolean("published").notNull().default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProgramIntroSchema = createInsertSchema(program_intro).omit({ id: true, updatedAt: true });
export type ProgramIntro = typeof program_intro.$inferSelect;
export type InsertProgramIntro = z.infer<typeof insertProgramIntroSchema>;

// === PROGRAM PIECES (multi-piece support) ===
export const program_pieces = pgTable("program_pieces", {
  id: serial("id").primaryKey(),
  language: text("language").notNull(),
  title: text("title").notNull().default(""),
  composer: text("composer").notNull().default(""),
  notes: text("notes").notNull().default(""),
  pieceOrder: integer("piece_order").notNull().default(0),
  published: boolean("published").notNull().default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProgramPieceSchema = createInsertSchema(program_pieces).omit({ id: true, updatedAt: true });
export type ProgramPiece = typeof program_pieces.$inferSelect;
export type InsertProgramPiece = z.infer<typeof insertProgramPieceSchema>;

// === CONTENT VERSION HISTORY (Phase 3) ===
export const content_versions = pgTable("content_versions", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").notNull(),
  section: text("section").notNull(),
  language: text("language").notNull(),
  content: text("content").notNull(),
  version: integer("version").notNull().default(1),
  sourceType: text("source_type").notNull().default("manual"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContentVersionSchema = createInsertSchema(content_versions).omit({ id: true, createdAt: true });
export type ContentVersion = typeof content_versions.$inferSelect;
export type InsertContentVersion = z.infer<typeof insertContentVersionSchema>;

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

// === ARCHIVED STATISTICS (Phase 4) ===
export const archived_statistics = pgTable("archived_statistics", {
  id: serial("id").primaryKey(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  snapshot: jsonb("snapshot").notNull(),
  totalCount: integer("total_count").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ArchivedStatistic = typeof archived_statistics.$inferSelect;

export type LanguageStat = {
  language: string;
  label: string;
  count: number;
  percentage: number;
};

export type AnalyticsSnapshot = {
  stats: LanguageStat[];
  dateRange: { start: string; end: string };
  totalCount: number;
};
