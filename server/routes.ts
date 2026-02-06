import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import bcrypt from "bcryptjs";
import OpenAI from "openai";

declare module "express-session" {
  interface SessionData {
    isAdmin?: boolean;
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.isAdmin) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  // === Public: Content Routes (serves published content, falls back to all) ===
  app.get(api.content.list.path, async (req, res) => {
    const language = req.query.language as string;
    if (!language) {
      return res.status(400).json({ message: "Language parameter is required" });
    }
    const published = await storage.getPublishedContent(language);
    if (published.length > 0) {
      return res.json(published);
    }
    const content = await storage.getProgramContent(language);
    res.json(content);
  });

  // === Public: Tracking Routes ===
  app.post(api.tracking.log.path, async (req, res) => {
    try {
      const input = api.tracking.log.input.parse(req.body);
      const event = await storage.logTrackingEvent(input);
      res.status(201).json(event);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // === Public: Languages list (for the mobile app) ===
  app.get(api.languages.list.path, async (_req, res) => {
    const languages = await storage.getSupportedLanguages();
    const enabled = languages.filter(l => l.enabled);
    res.json(enabled);
  });

  // === Admin: Login ===
  app.post(api.admin.login.path, async (req, res) => {
    try {
      const { password } = api.admin.login.input.parse(req.body);
      const creds = await storage.getAdminCredentials();
      if (!creds) {
        return res.status(401).json({ message: "Admin not configured" });
      }
      const valid = await bcrypt.compare(password, creds.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid password" });
      }
      req.session.isAdmin = true;
      res.json({ message: "Logged in" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === Admin: Logout ===
  app.post(api.admin.logout.path, (req, res) => {
    req.session.isAdmin = false;
    res.json({ message: "Logged out" });
  });

  // === Admin: Session check ===
  app.get(api.admin.session.path, (req, res) => {
    res.json({ authenticated: !!req.session?.isAdmin });
  });

  // === Admin: Change Password ===
  app.post(api.admin.changePassword.path, requireAdmin, async (req, res) => {
    try {
      const { currentPassword, newPassword } = api.admin.changePassword.input.parse(req.body);
      const creds = await storage.getAdminCredentials();
      if (!creds) {
        return res.status(401).json({ message: "Admin not configured" });
      }
      const valid = await bcrypt.compare(currentPassword, creds.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      const hash = await bcrypt.hash(newPassword, 12);
      await storage.setAdminPassword(hash);
      res.json({ message: "Password changed successfully" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === Admin: Language list (all, including disabled) ===
  app.get(api.languages.adminList.path, requireAdmin, async (req, res) => {
    const languages = await storage.getSupportedLanguages();
    res.json(languages);
  });

  // === Admin: Language CRUD ===
  app.post(api.languages.create.path, requireAdmin, async (req, res) => {
    try {
      const input = api.languages.create.input.parse(req.body);
      const lang = await storage.createSupportedLanguage(input);
      res.status(201).json(lang);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.languages.update.path, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const input = api.languages.update.input.parse(req.body);
    const updated = await storage.updateSupportedLanguage(id, input);
    if (!updated) {
      return res.status(404).json({ message: "Language not found" });
    }
    res.json(updated);
  });

  app.delete(api.languages.delete.path, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const deleted = await storage.deleteSupportedLanguage(id);
    if (!deleted) {
      return res.status(404).json({ message: "Language not found" });
    }
    res.status(204).send();
  });

  // === Admin: Content Management ===
  app.get(api.adminContent.list.path, requireAdmin, async (req, res) => {
    const language = req.query.language as string;
    if (!language) {
      return res.status(400).json({ message: "Language parameter is required" });
    }
    const content = await storage.getAllContentForLanguage(language);
    res.json(content);
  });

  app.post(api.adminContent.save.path, requireAdmin, async (req, res) => {
    try {
      const input = api.adminContent.save.input.parse(req.body);
      const savedContent = [];

      for (const sectionData of input.sections) {
        const existing = (await storage.getAllContentForLanguage(input.language))
          .find(c => c.section === sectionData.section);

        if (existing) {
          const latestVersion = await storage.getLatestVersionNumber(existing.id);
          await storage.createContentVersion({
            contentId: existing.id,
            section: existing.section,
            language: existing.language,
            content: existing.content,
            version: latestVersion + 1,
            sourceType: "manual",
          });
          const updated = await storage.updateProgramContent(existing.id, {
            content: sectionData.content,
            order: sectionData.order,
            published: false,
          });
          if (updated) savedContent.push(updated);
        } else {
          const created = await storage.createProgramContent({
            section: sectionData.section,
            language: input.language,
            content: sectionData.content,
            order: sectionData.order ?? 0,
            published: false,
          });
          savedContent.push(created);
        }
      }

      res.json({ message: "Content saved", content: savedContent });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post(api.adminContent.publish.path, requireAdmin, async (req, res) => {
    const { language } = req.body;
    if (!language) {
      return res.status(400).json({ message: "Language is required" });
    }
    await storage.publishContent(language);
    res.json({ message: `Content published for ${language}` });
  });

  app.post(api.adminContent.unpublish.path, requireAdmin, async (req, res) => {
    const { language } = req.body;
    if (!language) {
      return res.status(400).json({ message: "Language is required" });
    }
    await storage.unpublishContent(language);
    res.json({ message: `Content unpublished for ${language}` });
  });

  app.get(api.adminContent.versions.path, requireAdmin, async (req, res) => {
    const language = req.query.language as string;
    const section = req.query.section as string;
    if (!language || !section) {
      return res.status(400).json({ message: "Language and section parameters are required" });
    }
    const versions = await storage.getContentVersions(language, section);
    res.json(versions);
  });

  app.post(api.adminContent.translate.path, requireAdmin, async (req, res) => {
    try {
      const input = api.adminContent.translate.input.parse(req.body);

      const englishContent = await storage.getAllContentForLanguage("en");
      if (englishContent.length === 0) {
        return res.status(400).json({ message: "No English content found. Please create English content first." });
      }

      const titleContent = englishContent.find(c => c.section === "title")?.content || "";
      const composerContent = englishContent.find(c => c.section === "composer")?.content || "";
      const notesContent = englishContent.filter(c => c.section.startsWith("notes")).map(c => c.content).join("\n\n") || "";

      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const response = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content: `You are a professional translator specializing in classical music and concert program notes. Translate the following concert program content from English to ${input.targetLanguageLabel}. Maintain the formal, elegant tone appropriate for concert programs. Preserve any musical terms, opus numbers, and proper names. Return your response as a JSON object with three fields: "title", "composer", "notes". The notes field should contain properly formatted HTML with <p> tags for paragraphs.`,
          },
          {
            role: "user",
            content: JSON.stringify({
              title: titleContent,
              composer: composerContent,
              notes: notesContent,
            }),
          },
        ],
        response_format: { type: "json_object" },
      });

      const translatedText = response.choices[0]?.message?.content || "{}";
      const translated = JSON.parse(translatedText);

      res.json({
        title: translated.title || titleContent,
        composer: translated.composer || composerContent,
        notes: translated.notes || notesContent,
      });
    } catch (err: any) {
      console.error("Translation error:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: err.message || "Translation failed" });
    }
  });

  // Seed
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  // Seed admin password
  const creds = await storage.getAdminCredentials();
  if (!creds) {
    console.log("Seeding admin credentials...");
    const hash = await bcrypt.hash("bassiisclassy", 12);
    await storage.setAdminPassword(hash);
  }

  // Seed languages
  const langs = await storage.getSupportedLanguages();
  if (langs.length === 0) {
    console.log("Seeding languages...");
    await storage.createSupportedLanguage({ code: "en", label: "English", nativeLabel: "English", dir: "ltr", enabled: true, order: 1 });
    await storage.createSupportedLanguage({ code: "es", label: "Spanish", nativeLabel: "Español", dir: "ltr", enabled: true, order: 2 });
    await storage.createSupportedLanguage({ code: "zh", label: "Chinese", nativeLabel: "简体中文", dir: "ltr", enabled: true, order: 3 });
    await storage.createSupportedLanguage({ code: "fa", label: "Farsi", nativeLabel: "فارسی", dir: "rtl", enabled: true, order: 4 });
  }

  // Seed content
  const enContent = await storage.getProgramContent("en");
  if (enContent.length === 0) {
    console.log("Seeding content...");
    await storage.createProgramContent({ section: "title", language: "en", content: "Winter Concert 2025", order: 1, published: true });
    await storage.createProgramContent({ section: "composer", language: "en", content: "Ludwig van Beethoven", order: 2, published: true });
    await storage.createProgramContent({ section: "notes", language: "en", content: "Symphony No. 9 in D minor, Op. 125, is a choral symphony, the final complete symphony by Ludwig van Beethoven, composed between 1822 and 1824.", order: 3, published: true });
    await storage.createProgramContent({ section: "title", language: "es", content: "Concierto de Invierno 2025", order: 1, published: true });
    await storage.createProgramContent({ section: "composer", language: "es", content: "Ludwig van Beethoven", order: 2, published: true });
    await storage.createProgramContent({ section: "notes", language: "es", content: "La Sinfonía n.º 9 en re menor, op. 125, es una sinfonía coral, la última sinfonía completa de Ludwig van Beethoven, compuesta entre 1822 y 1824.", order: 3, published: true });
    await storage.createProgramContent({ section: "title", language: "zh", content: "2025年冬季音乐会", order: 1, published: true });
    await storage.createProgramContent({ section: "composer", language: "zh", content: "路德维希·范·贝多芬", order: 2, published: true });
    await storage.createProgramContent({ section: "notes", language: "zh", content: "D小调第九交响曲，作品125，是路德维希·范·贝多芬的最后一部完整交响曲，创作于1822年至1824年之间。", order: 3, published: true });
    await storage.createProgramContent({ section: "title", language: "fa", content: "کنسرت زمستانی ۲۰۲۵", order: 1, published: true });
    await storage.createProgramContent({ section: "composer", language: "fa", content: "لودویگ فان بتهوون", order: 2, published: true });
    await storage.createProgramContent({ section: "notes", language: "fa", content: "سمفونی شماره ۹ در ر مینور، اپوس ۱۲۵، آخرین سمفونی کامل لودویگ فان بتهوون است که بین سال‌های ۱822 تا ۱824 ساخته شده است.", order: 3, published: true });
  }

  console.log("Database ready!");
}
