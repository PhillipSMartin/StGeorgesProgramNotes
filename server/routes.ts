import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // === Content Routes ===
  app.get(api.content.list.path, async (req, res) => {
    const language = req.query.language as string;
    if (!language) {
      return res.status(400).json({ message: "Language parameter is required" });
    }
    const content = await storage.getProgramContent(language);
    res.json(content);
  });

  // === Tracking Routes ===
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

  // Seed Data (if empty)
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const enContent = await storage.getProgramContent("en");
  if (enContent.length === 0) {
    console.log("Seeding database...");
    
    // English
    await storage.createProgramContent({ section: "title", language: "en", content: "Winter Concert 2025", order: 1 });
    await storage.createProgramContent({ section: "composer", language: "en", content: "Ludwig van Beethoven", order: 2 });
    await storage.createProgramContent({ section: "notes", language: "en", content: "Symphony No. 9 in D minor, Op. 125, is a choral symphony, the final complete symphony by Ludwig van Beethoven, composed between 1822 and 1824.", order: 3 });

    // Spanish
    await storage.createProgramContent({ section: "title", language: "es", content: "Concierto de Invierno 2025", order: 1 });
    await storage.createProgramContent({ section: "composer", language: "es", content: "Ludwig van Beethoven", order: 2 });
    await storage.createProgramContent({ section: "notes", language: "es", content: "La Sinfonía n.º 9 en re menor, op. 125, es una sinfonía coral, la última sinfonía completa de Ludwig van Beethoven, compuesta entre 1822 y 1824.", order: 3 });

    // Chinese
    await storage.createProgramContent({ section: "title", language: "zh", content: "2025年冬季音乐会", order: 1 });
    await storage.createProgramContent({ section: "composer", language: "zh", content: "路德维希·范·贝多芬", order: 2 });
    await storage.createProgramContent({ section: "notes", language: "zh", content: "D小调第九交响曲，作品125，是路德维希·范·贝多芬的最后一部完整交响曲，创作于1822年至1824年之间。", order: 3 });

    // Farsi
    await storage.createProgramContent({ section: "title", language: "fa", content: "کنسرت زمستانی ۲۰۲۵", order: 1 });
    await storage.createProgramContent({ section: "composer", language: "fa", content: "لودویگ فان بتهوون", order: 2 });
    await storage.createProgramContent({ section: "notes", language: "fa", content: "سمفونی شماره ۹ در ر مینور، اپوس ۱۲۵، آخرین سمفونی کامل لودویگ فان بتهوون است که بین سال‌های ۱822 تا ۱824 ساخته شده است.", order: 3 });
    
    console.log("Database seeded!");
  }
}
