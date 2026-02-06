import { db } from "./db";
import {
  program_content,
  tracking_events,
  admin_credentials,
  supported_languages,
  type ProgramContent,
  type InsertProgramContent,
  type InsertTrackingEvent,
  type TrackingEvent,
  type AdminCredentials,
  type SupportedLanguage,
  type InsertSupportedLanguage
} from "@shared/schema";
import { eq, asc } from "drizzle-orm";

export interface IStorage {
  getProgramContent(language: string): Promise<ProgramContent[]>;
  createProgramContent(content: InsertProgramContent): Promise<ProgramContent>;
  logTrackingEvent(event: InsertTrackingEvent): Promise<TrackingEvent>;
  getAdminCredentials(): Promise<AdminCredentials | undefined>;
  setAdminPassword(hash: string): Promise<void>;
  getSupportedLanguages(): Promise<SupportedLanguage[]>;
  getSupportedLanguage(id: number): Promise<SupportedLanguage | undefined>;
  createSupportedLanguage(lang: InsertSupportedLanguage): Promise<SupportedLanguage>;
  updateSupportedLanguage(id: number, updates: Partial<InsertSupportedLanguage>): Promise<SupportedLanguage | undefined>;
  deleteSupportedLanguage(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
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

  async logTrackingEvent(event: InsertTrackingEvent): Promise<TrackingEvent> {
    const [newEvent] = await db
      .insert(tracking_events)
      .values(event)
      .returning();
    return newEvent;
  }

  async getAdminCredentials(): Promise<AdminCredentials | undefined> {
    const [creds] = await db.select().from(admin_credentials).limit(1);
    return creds;
  }

  async setAdminPassword(hash: string): Promise<void> {
    const existing = await this.getAdminCredentials();
    if (existing) {
      await db
        .update(admin_credentials)
        .set({ passwordHash: hash, updatedAt: new Date() })
        .where(eq(admin_credentials.id, existing.id));
    } else {
      await db.insert(admin_credentials).values({ passwordHash: hash });
    }
  }

  async getSupportedLanguages(): Promise<SupportedLanguage[]> {
    return await db
      .select()
      .from(supported_languages)
      .orderBy(asc(supported_languages.order));
  }

  async getSupportedLanguage(id: number): Promise<SupportedLanguage | undefined> {
    const [lang] = await db
      .select()
      .from(supported_languages)
      .where(eq(supported_languages.id, id));
    return lang;
  }

  async createSupportedLanguage(lang: InsertSupportedLanguage): Promise<SupportedLanguage> {
    const [newLang] = await db
      .insert(supported_languages)
      .values(lang)
      .returning();
    return newLang;
  }

  async updateSupportedLanguage(id: number, updates: Partial<InsertSupportedLanguage>): Promise<SupportedLanguage | undefined> {
    const [updated] = await db
      .update(supported_languages)
      .set(updates)
      .where(eq(supported_languages.id, id))
      .returning();
    return updated;
  }

  async deleteSupportedLanguage(id: number): Promise<boolean> {
    const result = await db
      .delete(supported_languages)
      .where(eq(supported_languages.id, id))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
