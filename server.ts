import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import crypto from "crypto";
import { jsonrepair } from "jsonrepair";
import { sql } from "@vercel/postgres";

dotenv.config();

const app = express();

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// 1. Endpoint Inisialisasi Database (Jalankan sekali di browser: URL_ANDA/api/init-db)
app.get("/api/init-db", async (req, res) => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS presets (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        thumbnail TEXT,
        target_country VARCHAR(255),
        target_language VARCHAR(255),
        visual_prompt TEXT,
        i2v_prompt TEXT,
        content_dna TEXT,
        bilingual_metadata TEXT,
        created_at TIMESTAMP
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS calendars (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        preset_id VARCHAR(255),
        preset_name VARCHAR(255),
        days_count INTEGER,
        target_country VARCHAR(255),
        target_language VARCHAR(255),
        plan_data TEXT,
        created_at TIMESTAMP
      );
    `;
    res.json({ success: true, message: "Tabel database berhasil dibuat di Vercel Postgres!" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Gemini Initialization & Helper
let genAiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY tidak ditemukan di environment server.");
    genAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });
  }
  return genAiClient;
}

async function callGeminiWithFallback(ai: GoogleGenAI, requestPayload: any, retries = 2): Promise<string> {
  const candidateModels = ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.1-flash-lite-preview"];
  let lastError: any = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({ model, ...requestPayload });
        if (response.text) return response.text;
      } catch (err: any) {
        lastError = err;
      }
    }
    if (attempt < retries) await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
  }
  throw new Error(lastError?.message || "Semua model Gemini sedang sibuk.");
}

function extractCleanJson(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.replace(/^```json\s*/, "").replace(/```\s*$/, "");
  else if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```\s*/, "").replace(/```\s*$/, "");
  cleaned = cleaned.trim();
  try { return JSON.parse(cleaned); } catch (err1) {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try { return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)); } 
      catch (err2) { try { return JSON.parse(jsonrepair(cleaned.slice(firstBrace, lastBrace + 1))); } catch (err3) {} }
    }
    try { return JSON.parse(jsonrepair(cleaned)); } 
    catch (errFinal: any) { throw new Error("Gagal membaca respons JSON."); }
  }
}

// 3. API Endpoints
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", hasApiKey: Boolean(process.env.GEMINI_API_KEY) });
});

app.post("/api/generate-prompt", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", extraInstructions, negativePrompt, preferredCountry } = req.body;
    if (!imageBase64) return res.status(400).json({ error: "Gambar tidak ditemukan." });

    const ai = getGenAI();
    const systemPrompt = `You are an elite YouTube Growth Strategist... (Sistem fokus pada visual prompt, motion, metadata, dan target SEO). YOU MUST RESPOND STRICTLY IN VALID JSON.`;

    const rawResponse = await callGeminiWithFallback(ai, {
      contents: [{ role: "user", parts: [{ text: systemPrompt }, { inlineData: { mimeType, data: imageBase64 } }] }],
      config: { responseMimeType: "application/json" }
    });

    res.json(extractCleanJson(rawResponse));
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Terjadi kesalahan server." });
  }
});

app.post("/api/generate-calendar", async (req, res) => {
  try {
    const { contentDna, visualPrompt, targetCountry = "Global", targetLanguage = "English", days = 7, extraFocus } = req.body;
    const ai = getGenAI();
    const calendarPrompt = `Create a ${days}-Day YouTube Content Calendar Plan. RESPOND STRICTLY IN VALID JSON.`;

    const rawResponse = await callGeminiWithFallback(ai, {
      contents: [{ role: "user", parts: [{ text: calendarPrompt }] }],
      config: { responseMimeType: "application/json" }
    });
    res.json(extractCleanJson(rawResponse));
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Gagal menghasilkan kalender konten." });
  }
});

// 4. CRUD Database Endpoints
app.get("/api/presets", async (req, res) => {
  try {
    const { rows } = await sql`SELECT * FROM presets ORDER BY created_at DESC`;
    res.json(rows.map((r: any) => ({
      ...r,
      content_dna: typeof r.content_dna === 'string' ? JSON.parse(r.content_dna || "{}") : r.content_dna,
      bilingual_metadata: typeof r.bilingual_metadata === 'string' ? JSON.parse(r.bilingual_metadata || "{}") : r.bilingual_metadata,
    })));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/presets", async (req, res) => {
  try {
    const { name, description, thumbnail, target_country, target_language, visual_prompt, i2v_prompt, content_dna, bilingual_metadata } = req.body;
    const id = "dna_" + crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await sql`INSERT INTO presets (id, name, description, thumbnail, target_country, target_language, visual_prompt, i2v_prompt, content_dna, bilingual_metadata, created_at) VALUES (${id}, ${name || "Untitled"}, ${description || ""}, ${thumbnail || ""}, ${target_country || ""}, ${target_language || ""}, ${visual_prompt || ""}, ${i2v_prompt || ""}, ${JSON.stringify(content_dna || {})}, ${JSON.stringify(bilingual_metadata || {})}, ${createdAt})`;
    res.json({ id, name, created_at: createdAt });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/presets/:id", async (req, res) => {
  try {
    await sql`DELETE FROM presets WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/calendars", async (req, res) => {
  try {
    const { rows } = await sql`SELECT * FROM calendars ORDER BY created_at DESC`;
    res.json(rows.map((r: any) => ({
      ...r,
      days: typeof r.plan_data === 'string' ? JSON.parse(r.plan_data || "[]") : r.plan_data,
    })));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/calendars", async (req, res) => {
  try {
    const { name, preset_id, preset_name, days_count, target_country, target_language, days } = req.body;
    const id = "cal_" + crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await sql`INSERT INTO calendars (id, name, preset_id, preset_name, days_count, target_country, target_language, plan_data, created_at) VALUES (${id}, ${name || "Calendar"}, ${preset_id || ""}, ${preset_name || ""}, ${days_count || 7}, ${target_country || ""}, ${target_language || ""}, ${JSON.stringify(days || [])}, ${createdAt})`;
    res.json({ id, name, created_at: createdAt, days_count });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.patch("/api/calendars/:id", async (req, res) => {
  try {
    const { days, name } = req.body;
    if (days) await sql`UPDATE calendars SET plan_data = ${JSON.stringify(days)} WHERE id = ${req.params.id}`;
    if (name) await sql`UPDATE calendars SET name = ${name} WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/calendars/:id", async (req, res) => {
  try {
    await sql`DELETE FROM calendars WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Wajib untuk Vercel: Jangan ada app.listen()
export default app;
