import { db } from "./db";
import {
  program_content,
  program_intro,
  program_pieces,
  content_versions,
  tracking_events,
  admin_credentials,
  supported_languages,
  type ProgramContent,
  type InsertProgramContent,
  type ProgramIntro,
  type InsertProgramIntro,
  type ProgramPiece,
  type InsertProgramPiece,
  type ContentVersion,
  type InsertContentVersion,
  type InsertTrackingEvent,
  type TrackingEvent,
  type AdminCredentials,
  type SupportedLanguage,
  type InsertSupportedLanguage
} from "@shared/schema";
import { eq, and, asc, desc } from "drizzle-orm";

export interface IStorage {
  // Program content (legacy)
  getProgramContent(language: string): Promise<ProgramContent[]>;
  getPublishedContent(language: string): Promise<ProgramContent[]>;
  getAllContentForLanguage(language: string): Promise<ProgramContent[]>;
  getContentById(id: number): Promise<ProgramContent | undefined>;
  createProgramContent(content: InsertProgramContent): Promise<ProgramContent>;
  updateProgramContent(id: number, updates: Partial<InsertProgramContent>): Promise<ProgramContent | undefined>;
  deleteProgramContent(id: number): Promise<boolean>;
  publishContent(language: string): Promise<void>;
  unpublishContent(language: string): Promise<void>;

  // Program intro
  getIntro(language: string): Promise<ProgramIntro | undefined>;
  saveIntro(language: string, content: string): Promise<ProgramIntro>;
  publishIntro(language: string): Promise<void>;
  unpublishIntro(language: string): Promise<void>;

  // Program pieces (multi-piece)
  getPiecesForLanguage(language: string): Promise<ProgramPiece[]>;
  getPublishedPieces(language: string): Promise<ProgramPiece[]>;
  getPieceById(id: number): Promise<ProgramPiece | undefined>;
  createPiece(piece: InsertProgramPiece): Promise<ProgramPiece>;
  updatePiece(id: number, updates: Partial<InsertProgramPiece>): Promise<ProgramPiece | undefined>;
  deletePiece(id: number): Promise<boolean>;
  publishPieces(language: string): Promise<void>;
  unpublishPieces(language: string): Promise<void>;

  // Content versions
  createContentVersion(version: InsertContentVersion): Promise<ContentVersion>;
  getContentVersions(language: string, section: string): Promise<ContentVersion[]>;
  getLatestVersionNumber(contentId: number): Promise<number>;

  // Tracking
  logTrackingEvent(event: InsertTrackingEvent): Promise<TrackingEvent>;

  // Admin
  getAdminCredentials(): Promise<AdminCredentials | undefined>;
  setAdminPassword(hash: string): Promise<void>;

  // Languages
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

  async getPublishedContent(language: string): Promise<ProgramContent[]> {
    return await db
      .select()
      .from(program_content)
      .where(and(eq(program_content.language, language), eq(program_content.published, true)))
      .orderBy(program_content.order);
  }

  async getAllContentForLanguage(language: string): Promise<ProgramContent[]> {
    return await db
      .select()
      .from(program_content)
      .where(eq(program_content.language, language))
      .orderBy(program_content.order);
  }

  async getContentById(id: number): Promise<ProgramContent | undefined> {
    const [item] = await db
      .select()
      .from(program_content)
      .where(eq(program_content.id, id));
    return item;
  }

  async createProgramContent(content: InsertProgramContent): Promise<ProgramContent> {
    const [newContent] = await db
      .insert(program_content)
      .values(content)
      .returning();
    return newContent;
  }

  async updateProgramContent(id: number, updates: Partial<InsertProgramContent>): Promise<ProgramContent | undefined> {
    const [updated] = await db
      .update(program_content)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(program_content.id, id))
      .returning();
    return updated;
  }

  async deleteProgramContent(id: number): Promise<boolean> {
    const result = await db
      .delete(program_content)
      .where(eq(program_content.id, id))
      .returning();
    return result.length > 0;
  }

  async publishContent(language: string): Promise<void> {
    await db
      .update(program_content)
      .set({ published: true, updatedAt: new Date() })
      .where(eq(program_content.language, language));
  }

  async unpublishContent(language: string): Promise<void> {
    await db
      .update(program_content)
      .set({ published: false, updatedAt: new Date() })
      .where(eq(program_content.language, language));
  }

  // Program intro
  async getIntro(language: string): Promise<ProgramIntro | undefined> {
    const [intro] = await db
      .select()
      .from(program_intro)
      .where(eq(program_intro.language, language));
    return intro;
  }

  async saveIntro(language: string, content: string): Promise<ProgramIntro> {
    const existing = await this.getIntro(language);
    if (existing) {
      const [updated] = await db
        .update(program_intro)
        .set({ content, published: false, updatedAt: new Date() })
        .where(eq(program_intro.language, language))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(program_intro)
      .values({ language, content, published: false })
      .returning();
    return created;
  }

  async publishIntro(language: string): Promise<void> {
    await db
      .update(program_intro)
      .set({ published: true, updatedAt: new Date() })
      .where(eq(program_intro.language, language));
  }

  async unpublishIntro(language: string): Promise<void> {
    await db
      .update(program_intro)
      .set({ published: false, updatedAt: new Date() })
      .where(eq(program_intro.language, language));
  }

  // Program pieces (multi-piece support)
  async getPiecesForLanguage(language: string): Promise<ProgramPiece[]> {
    return await db
      .select()
      .from(program_pieces)
      .where(eq(program_pieces.language, language))
      .orderBy(asc(program_pieces.pieceOrder));
  }

  async getPublishedPieces(language: string): Promise<ProgramPiece[]> {
    return await db
      .select()
      .from(program_pieces)
      .where(and(eq(program_pieces.language, language), eq(program_pieces.published, true)))
      .orderBy(asc(program_pieces.pieceOrder));
  }

  async getPieceById(id: number): Promise<ProgramPiece | undefined> {
    const [piece] = await db
      .select()
      .from(program_pieces)
      .where(eq(program_pieces.id, id));
    return piece;
  }

  async createPiece(piece: InsertProgramPiece): Promise<ProgramPiece> {
    const [newPiece] = await db
      .insert(program_pieces)
      .values(piece)
      .returning();
    return newPiece;
  }

  async updatePiece(id: number, updates: Partial<InsertProgramPiece>): Promise<ProgramPiece | undefined> {
    const [updated] = await db
      .update(program_pieces)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(program_pieces.id, id))
      .returning();
    return updated;
  }

  async deletePiece(id: number): Promise<boolean> {
    const result = await db
      .delete(program_pieces)
      .where(eq(program_pieces.id, id))
      .returning();
    return result.length > 0;
  }

  async publishPieces(language: string): Promise<void> {
    await db
      .update(program_pieces)
      .set({ published: true, updatedAt: new Date() })
      .where(eq(program_pieces.language, language));
  }

  async unpublishPieces(language: string): Promise<void> {
    await db
      .update(program_pieces)
      .set({ published: false, updatedAt: new Date() })
      .where(eq(program_pieces.language, language));
  }

  async createContentVersion(version: InsertContentVersion): Promise<ContentVersion> {
    const [newVersion] = await db
      .insert(content_versions)
      .values(version)
      .returning();
    return newVersion;
  }

  async getContentVersions(language: string, section: string): Promise<ContentVersion[]> {
    return await db
      .select()
      .from(content_versions)
      .where(and(eq(content_versions.language, language), eq(content_versions.section, section)))
      .orderBy(desc(content_versions.version));
  }

  async getLatestVersionNumber(contentId: number): Promise<number> {
    const versions = await db
      .select()
      .from(content_versions)
      .where(eq(content_versions.contentId, contentId))
      .orderBy(desc(content_versions.version))
      .limit(1);
    return versions.length > 0 ? versions[0].version : 0;
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
