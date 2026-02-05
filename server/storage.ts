import { db } from "./db";
import {
  program_content,
  tracking_events,
  type ProgramContent,
  type InsertProgramContent,
  type InsertTrackingEvent,
  type TrackingEvent
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Program Content
  getProgramContent(language: string): Promise<ProgramContent[]>;
  createProgramContent(content: InsertProgramContent): Promise<ProgramContent>;
  
  // Tracking
  logTrackingEvent(event: InsertTrackingEvent): Promise<TrackingEvent>;
}

export class DatabaseStorage implements IStorage {
  // Program Content
  async getProgramContent(language: string): Promise<ProgramContent[]> {
    return await db
      .select()
      .from(program_content)
      .where(eq(program_content.language, language))
      .orderBy(program_content.order);
  }

  async createProgramContent(content: InsertProgramContent): Promise<ProgramContent> {
    const [newContent] = await db
      .insert(program_content)
      .values(content)
      .returning();
    return newContent;
  }

  // Tracking
  async logTrackingEvent(event: InsertTrackingEvent): Promise<TrackingEvent> {
    const [newEvent] = await db
      .insert(tracking_events)
      .values(event)
      .returning();
    return newEvent;
  }
}

export const storage = new DatabaseStorage();
