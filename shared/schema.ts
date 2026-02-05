import { pgTable, text, serial, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Export Auth tables
export * from "./models/auth";

// === PROGRAM CONTENT (Phase 3 Prep) ===
// Storing content in DB to allow for CMS later
export const program_content = pgTable("program_content", {
  id: serial("id").primaryKey(),
  section: text("section").notNull(), // e.g., "title", "composer", "notes"
  language: text("language").notNull(), // "en", "es", "zh", "fa"
  content: text("content").notNull(),
  order: integer("order").default(0),
});

export const insertProgramContentSchema = createInsertSchema(program_content).omit({ id: true });
export type ProgramContent = typeof program_content.$inferSelect;
export type InsertProgramContent = z.infer<typeof insertProgramContentSchema>;

// === TRACKING (Phase 1 & 4) ===
// Storing analytics events
export const tracking_events = pgTable("tracking_events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(), // "language_selected"
  payload: jsonb("payload").notNull(), // { language: "es" }
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTrackingEventSchema = createInsertSchema(tracking_events).omit({ id: true, createdAt: true });
export type TrackingEvent = typeof tracking_events.$inferSelect;
export type InsertTrackingEvent = z.infer<typeof insertTrackingEventSchema>;
