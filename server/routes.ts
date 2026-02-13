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

  // === Public: Intro Route (returns intro for a language, always returns data for admin usage) ===
  app.get(api.intro.get.path, async (req, res) => {
    const language = req.query.language as string;
    if (!language) {
      return res.status(400).json({ message: "Language parameter is required" });
    }
    const intro = await storage.getIntro(language);
    res.json(intro || null);
  });

  // === Public: Pieces Routes (serves published pieces, falls back to all) ===
  app.get(api.pieces.list.path, async (req, res) => {
    const language = req.query.language as string;
    if (!language) {
      return res.status(400).json({ message: "Language parameter is required" });
    }
    const published = await storage.getPublishedPieces(language);
    if (published.length > 0) {
      return res.json(published);
    }
    const all = await storage.getPiecesForLanguage(language);
    res.json(all);
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

  // === Admin: Reorder languages ===
  app.post(api.languages.reorder.path, requireAdmin, async (req, res) => {
    const { orderedIds } = api.languages.reorder.input.parse(req.body);
    for (let i = 0; i < orderedIds.length; i++) {
      await storage.updateSupportedLanguage(orderedIds[i], { order: i + 1 });
    }
    res.json({ message: "Languages reordered" });
  });

  // === Admin: Analytics ===
  app.get(api.analytics.current.path, requireAdmin, async (req, res) => {
    const analytics = await storage.getCurrentAnalytics();
    res.json(analytics);
  });

  app.post(api.analytics.clear.path, requireAdmin, async (req, res) => {
    await storage.clearAndArchiveAnalytics();
    res.json({ message: "Statistics archived and cleared" });
  });

  app.get(api.analytics.archives.path, requireAdmin, async (req, res) => {
    const archives = await storage.listArchivedAnalytics();
    res.json(archives.map(a => ({
      id: a.id,
      periodStart: a.periodStart.toISOString(),
      periodEnd: a.periodEnd.toISOString(),
      totalCount: a.totalCount,
      createdAt: a.createdAt?.toISOString() || null,
    })));
  });

  app.get("/api/admin/analytics/archives/:id", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const archived = await storage.getArchivedAnalytics(id);
    if (!archived) {
      return res.status(404).json({ message: "Archive not found" });
    }
    res.json(archived.snapshot);
  });

  // === Admin: Pieces Management ===
  app.get(api.adminPieces.list.path, requireAdmin, async (req, res) => {
    const language = req.query.language as string;
    if (!language) {
      return res.status(400).json({ message: "Language parameter is required" });
    }
    const pieces = await storage.getPiecesForLanguage(language);
    res.json(pieces);
  });

  app.post(api.adminPieces.save.path, requireAdmin, async (req, res) => {
    try {
      const input = api.adminPieces.save.input.parse(req.body);

      if (input.intro !== undefined) {
        await storage.saveIntro(input.language, input.intro);
      }

      const savedPieces = [];
      const savedIds = new Set<number>();

      for (const pieceData of input.pieces) {
        if (pieceData.id) {
          const existing = await storage.getPieceById(pieceData.id);
          if (existing) {
            const updated = await storage.updatePiece(existing.id, {
              title: pieceData.title,
              composer: pieceData.composer,
              notes: pieceData.notes,
              pieceOrder: pieceData.pieceOrder,
              published: false,
            });
            if (updated) {
              savedPieces.push(updated);
              savedIds.add(updated.id);
            }
            continue;
          }
        }
        const created = await storage.createPiece({
          language: input.language,
          title: pieceData.title,
          composer: pieceData.composer,
          notes: pieceData.notes,
          pieceOrder: pieceData.pieceOrder,
          published: false,
        });
        savedPieces.push(created);
        savedIds.add(created.id);
      }

      const allPieces = await storage.getPiecesForLanguage(input.language);
      for (const piece of allPieces) {
        if (!savedIds.has(piece.id)) {
          await storage.deletePiece(piece.id);
        }
      }

      res.json({ message: "Content saved", pieces: savedPieces });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete("/api/admin/pieces/:id", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid piece ID" });
    }
    await storage.deletePiece(id);
    res.status(204).send();
  });

  app.post(api.adminPieces.publish.path, requireAdmin, async (req, res) => {
    const { language } = req.body;
    if (!language) {
      return res.status(400).json({ message: "Language is required" });
    }
    await storage.publishPieces(language);
    await storage.publishIntro(language);
    res.json({ message: `Content published for ${language}` });
  });

  app.post(api.adminPieces.unpublish.path, requireAdmin, async (req, res) => {
    const { language } = req.body;
    if (!language) {
      return res.status(400).json({ message: "Language is required" });
    }
    await storage.unpublishPieces(language);
    await storage.unpublishIntro(language);
    res.json({ message: `Content unpublished for ${language}` });
  });

  async function translateContent(
    provider: "openai" | "google",
    targetLanguage: string,
    targetLanguageLabel: string,
    englishPieces: { title: string; composer: string; notes: string }[],
    englishIntro: { content: string } | null | undefined,
  ): Promise<{ intro?: string; pieces: { title: string; composer: string; notes: string }[] }> {
    if (provider === "google") {
      const apiKey = process.env.GOOGLE_CLOUD_TRANSLATION_API_KEY;
      if (!apiKey) {
        throw new Error("Google Cloud Translation API key not configured. Please add GOOGLE_CLOUD_TRANSLATION_API_KEY in your secrets.");
      }

      const textsToTranslate: string[] = [];
      for (const p of englishPieces) {
        textsToTranslate.push(p.title);
        textsToTranslate.push(p.notes);
      }
      if (englishIntro?.content) {
        textsToTranslate.push(englishIntro.content);
      }

      const googleRes = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            q: textsToTranslate,
            target: targetLanguage,
            source: "en",
            format: "html",
          }),
        }
      );

      if (!googleRes.ok) {
        const errBody = await googleRes.text();
        console.error("Google Translate API error:", errBody);
        throw new Error("Google Translation API error. Check your API key and quota.");
      }

      const googleData = await googleRes.json();
      const translations = googleData.data.translations.map((t: any) => t.translatedText);

      let idx = 0;
      const translatedPieces = englishPieces.map(p => ({
        title: `${translations[idx++]} (${p.title})`,
        composer: p.composer,
        notes: translations[idx++],
      }));

      let translatedIntro: string | undefined;
      if (englishIntro?.content) {
        translatedIntro = translations[idx];
      }

      return { intro: translatedIntro, pieces: translatedPieces };
    } else {
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const piecesForTranslation = englishPieces.map(p => ({
        title: p.title,
        composer: p.composer,
        notes: p.notes,
      }));

      const sourceData: any = { pieces: piecesForTranslation };
      if (englishIntro?.content) {
        sourceData.intro = englishIntro.content;
      }

      const response = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content: `You are a professional translator specializing in classical music and concert program notes. Translate the following concert program content from English to ${targetLanguageLabel}.

Guidelines:
- Maintain the formal, elegant tone appropriate for concert programs.
- Translate piece titles into ${targetLanguageLabel}, followed by the original English title in parentheses. For example: "Translated Title (Original English Title)".
- Keep composer names in their original Latin-script form (do not transliterate).
- Preserve opus numbers (e.g., Op. 26, K. 626).
- When a piece title appears within the notes text, use ONLY the translated title without any English parenthetical. The English original should only appear in the "title" field, never repeated inside "notes".
- The notes and intro fields should contain properly formatted HTML with <p> tags for paragraphs.

Return your response as a JSON object with a "pieces" array (each element has "title", "composer", and "notes" fields)${englishIntro?.content ? ' and an "intro" field containing the translated introductory paragraph' : ''}.`,
          },
          {
            role: "user",
            content: JSON.stringify(sourceData),
          },
        ],
        response_format: { type: "json_object" },
      });

      const translatedText = response.choices[0]?.message?.content || "{}";
      const translated = JSON.parse(translatedText);

      return {
        intro: translated.intro || undefined,
        pieces: translated.pieces || piecesForTranslation,
      };
    }
  }

  app.post(api.adminPieces.translateAll.path, requireAdmin, async (req, res) => {
    try {
      const input = api.adminPieces.translateAll.input.parse(req.body);

      const englishPieces = await storage.getPiecesForLanguage("en");
      if (englishPieces.length === 0) {
        return res.status(400).json({ message: "No English pieces found. Please create English content first." });
      }

      const englishIntro = await storage.getIntro("en");
      const allLanguages = await storage.getSupportedLanguages();
      const nonEnglishLangs = allLanguages.filter(l => l.code !== "en" && l.enabled);

      if (nonEnglishLangs.length === 0) {
        return res.status(400).json({ message: "No enabled non-English languages found." });
      }

      const piecesForTranslation = englishPieces.map(p => ({
        title: p.title,
        composer: p.composer,
        notes: p.notes,
      }));

      const results: { language: string; label: string; status: "success" | "error"; message?: string }[] = [];

      for (const lang of nonEnglishLangs) {
        try {
          const translated = await translateContent(
            input.provider,
            lang.code,
            lang.label,
            piecesForTranslation,
            englishIntro,
          );

          if (translated.intro) {
            await storage.saveIntro(lang.code, translated.intro);
          }

          const existingPieces = await storage.getPiecesForLanguage(lang.code);
          const savedIds = new Set<number>();

          for (let i = 0; i < translated.pieces.length; i++) {
            const tp = translated.pieces[i];
            if (existingPieces[i]) {
              await storage.updatePiece(existingPieces[i].id, {
                title: tp.title,
                composer: tp.composer,
                notes: tp.notes,
                pieceOrder: i + 1,
                published: false,
              });
              savedIds.add(existingPieces[i].id);
            } else {
              const created = await storage.createPiece({
                language: lang.code,
                title: tp.title,
                composer: tp.composer,
                notes: tp.notes,
                pieceOrder: i + 1,
                published: false,
              });
              savedIds.add(created.id);
            }
          }

          for (const ep of existingPieces) {
            if (!savedIds.has(ep.id)) {
              await storage.deletePiece(ep.id);
            }
          }

          await storage.publishPieces(lang.code);
          await storage.publishIntro(lang.code);

          results.push({ language: lang.code, label: lang.label, status: "success" });
        } catch (langErr: any) {
          console.error(`Translation error for ${lang.label}:`, langErr);
          results.push({ language: lang.code, label: lang.label, status: "error", message: langErr.message || "Translation failed" });
        }
      }

      res.json({ results });
    } catch (err: any) {
      console.error("Translate all error:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: err.message || "Translation failed" });
    }
  });

  app.post(api.adminPieces.translate.path, requireAdmin, async (req, res) => {
    try {
      const input = api.adminPieces.translate.input.parse(req.body);

      const englishPieces = await storage.getPiecesForLanguage("en");
      if (englishPieces.length === 0) {
        return res.status(400).json({ message: "No English pieces found. Please create English content first." });
      }

      const englishIntro = await storage.getIntro("en");

      const piecesForTranslation = englishPieces.map(p => ({
        title: p.title,
        composer: p.composer,
        notes: p.notes,
      }));

      const result = await translateContent(
        input.provider,
        input.targetLanguage,
        input.targetLanguageLabel,
        piecesForTranslation,
        englishIntro,
      );

      res.json(result);
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

  // Seed pieces
  const enPieces = await storage.getPiecesForLanguage("en");
  if (enPieces.length === 0) {
    console.log("Seeding pieces...");
    await storage.createPiece({ language: "en", title: "Symphony No. 9 in D minor, Op. 125", composer: "Ludwig van Beethoven", notes: "<p>The Ninth Symphony is Beethoven's final complete symphony, composed between 1822 and 1824. Its final movement features a choral setting of Friedrich Schiller's \"Ode to Joy,\" a landmark in orchestral music.</p>", pieceOrder: 1, published: true });
    await storage.createPiece({ language: "en", title: "Requiem in D minor, K. 626", composer: "Wolfgang Amadeus Mozart", notes: "<p>Mozart's Requiem, left incomplete at his death in 1791, remains one of the most powerful and moving choral works ever composed. The work was completed by his student Franz Xaver Sussmayr.</p>", pieceOrder: 2, published: true });

    await storage.createPiece({ language: "es", title: "Sinfonía n.º 9 en re menor, Op. 125", composer: "Ludwig van Beethoven", notes: "<p>La Novena Sinfonía es la última sinfonía completa de Beethoven, compuesta entre 1822 y 1824. Su movimiento final presenta una adaptación coral de la \"Oda a la Alegría\" de Friedrich Schiller.</p>", pieceOrder: 1, published: true });
    await storage.createPiece({ language: "es", title: "Réquiem en re menor, K. 626", composer: "Wolfgang Amadeus Mozart", notes: "<p>El Réquiem de Mozart, dejado incompleto a su muerte en 1791, sigue siendo una de las obras corales más poderosas y conmovedoras jamás compuestas.</p>", pieceOrder: 2, published: true });

    await storage.createPiece({ language: "zh", title: "D小调第九交响曲，作品125", composer: "路德维希·范·贝多芬", notes: "<p>第九交响曲是贝多芬最后一部完整的交响曲，创作于1822年至1824年之间。其最后乐章以席勒的《欢乐颂》为合唱部分，是管弦乐史上的里程碑。</p>", pieceOrder: 1, published: true });
    await storage.createPiece({ language: "zh", title: "D小调安魂曲，K. 626", composer: "沃尔夫冈·阿马德乌斯·莫扎特", notes: "<p>莫扎特的安魂曲在他1791年去世时未完成，至今仍是有史以来最有力、最感人的合唱作品之一。</p>", pieceOrder: 2, published: true });

    await storage.createPiece({ language: "fa", title: "سمفونی شماره ۹ در ر مینور، اپوس ۱۲۵", composer: "لودویگ فان بتهوون", notes: "<p>سمفونی نهم آخرین سمفونی کامل بتهوون است که بین سال‌های ۱۸۲۲ تا ۱۸۲۴ ساخته شده است. حرکت آخر آن شامل تنظیم کرال «سرود شادی» فریدریش شیلر است.</p>", pieceOrder: 1, published: true });
    await storage.createPiece({ language: "fa", title: "رکوئیم در ر مینور، K. 626", composer: "ولفگانگ آمادئوس موتسارت", notes: "<p>رکوئیم موتسارت که در زمان مرگش در سال ۱۷۹۱ ناتمام ماند، همچنان یکی از قدرتمندترین و تأثیرگذارترین آثار کرال تاریخ موسیقی است.</p>", pieceOrder: 2, published: true });
  }

  console.log("Database ready!");
}
