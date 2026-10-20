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

// 1. Endpoint Inisialisasi Database
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
    const systemPrompt = `You are an elite YouTube Growth Strategist, YouTube SEO Master, and Visual AI Prompt Engineer for YouTube (Long-form & YouTube Shorts), Flux, Midjourney, Kling AI, and Runway.
This application is strictly designed for YOUTUBE CONTENT CREATION. Every single piece of metadata must strictly adhere to the latest YouTube Algorithm (2026) and YouTube Search SEO guidelines:

1. MASTER VISUAL PROMPT (Flux / Midjourney):
   A rich, highly technical cinematic prompt detailing main subject, composition, artistic medium/style, volumetric lighting, color palette, camera lens, depth of field, and framing optimized for high-CTR YouTube thumbnails and video production.

2. I2V MOTION PROMPT (Image-to-Video Animation):
   Specialized motion prompt for video generation tools (Kling AI, Runway Gen-3, Luma, Minimax).
   MANDATORY DIRECTIVES:
   - CAMERA: Static locked tripod camera, rock-solid horizon, fixed framing, zero camera movement, zero panning, zero zooming.
   - SEAMLESS LOOPING: Perfect seamless looping video. The motion is cyclical and continuous so the first frame matches the final frame identically with zero jump-cuts, zero sudden resets, and infinite smooth playback.
   - ORGANIC MICRO-MOTION: Fluid, subtle micro-movements (e.g. gentle breathing, subtle fabric/hair flutter in the air, drifting ambient mist/dust motes, rhythmic neon pulse), realistic fluid dynamics, 60fps cinematic motion.

3. CONTENT DNA & YOUTUBE NICHE:
   Visual style genre, color palette hex/names, lighting archetype, atmosphere, target YouTube niche, and optimal YouTube format (e.g., "YouTube Shorts (9:16) [Looping Retention Model]" or "YouTube Video (16:9) [High-Retention Deep Dive]").

4. POTENTIAL TARGET COUNTRIES & YOUTUBE RPM/CPM ANALYSIS:
   Identify the top 3 highest-potential countries where this specific YouTube content will achieve viral velocity or maximum YouTube RPM. For each country:
   - Country name, 2-letter ISO code, Flag emoji, Official native language, language code.
   - Fit score (0-100).
   - Strategic reasoning on why this content wins in this regional YouTube ecosystem.
   - YouTube CPM/RPM tier (e.g. "Tier 1 ($18-$38 RPM - US/UK/DE/JP)" or "Tier 2 High Volume").
   - Target demographic & YouTube viewer avatar.
   - Best posting times in local timezone for peak YouTube traffic.
   ${preferredCountry ? `NOTE: The user requested a preference for ${preferredCountry} if suitable as primary.` : ""}

5. YOUTUBE SEO METADATA (English + Target Country Language):
   Strictly formatted to conquer the YouTube algorithm:
   - titleA: High-CTR Curiosity Hook Title (strictly 45-60 characters, front-loaded with power words or curiosity gap, no ellipsis truncation on mobile YouTube app, maximum click-through rate without clickbait penalty).
   - titleA_type: "Viral Hook / CTR"
   - titleA_explanation: Rationale on why this title wins in YouTube Browse Features, Suggested Videos, and mobile feeds.
   - titleB: YouTube Search SEO Title (strictly 50-65 characters, front-loaded with the primary high-search-volume exact keyword query for YouTube Search & Google Video indexing).
   - titleB_type: "Search SEO & Algorithm"
   - titleB_explanation: Target search intent, volume rationale, and algorithm ranking potential.
   - hook: The first 3 seconds retention spike script (spoken hook + visual pattern interrupt) engineered to prevent swipe-aways on YouTube Shorts or immediate drop-off on Long-form.
   - description: Complete YouTube Video Description structured according to official YouTube Search SEO best practices:
     * Line 1-2 (First 100-150 characters above "Show more" fold): Punchy summary naturally embedding the primary target keyword before the cutoff fold.
     * Section 2 (Video Overview & Key Insights): 2 paragraphs detailing what the viewer will learn with secondary semantic (LSI) search terms.
     * Section 3 (Timestamps / Video Chapters):
       00:00 - Intro & Secret Hook
       00:45 - The Core Breakdown
       02:15 - Step-by-Step AI Demonstration
       03:40 - Crucial Tips & Next Steps
     * Section 4 (Engagement & Social Call to Action): Clear CTA to Subscribe, comment answer, and watch playlist.
     * Section 5 (Hashtags): Exactly 3 to 5 hyper-targeted hashtags at the very bottom (YouTube algorithm prioritizes the first 3 hashtags; excessive hashtags get flagged as spam).
   - hashtags: Exactly 3 to 5 hyper-relevant hashtags starting with # (e.g. ["#Shorts", "#YouTubeSEO", "#AICreator", "#ViralShorts"]).
   - tags: 15 to 20 comma-ready SEO keyword tags for YouTube Studio's "Tags" field (mixing exact match, long-tail search phrases like "how to...", "cara membuat...", and niche category tags).
   - category: Official YouTube category (e.g., "Film & Animation", "Science & Technology", "Entertainment", "Education", "Howto & Style").
   - contentPillars: 3 strategic YouTube content pillars for sustainable channel growth.

${extraInstructions ? `USER EXTRA INSTRUCTIONS: ${extraInstructions}` : ""}
${negativePrompt ? `NEGATIVE STYLING (Exclude these): ${negativePrompt}` : ""}

YOU MUST RESPOND STRICTLY IN VALID JSON with this exact structure:
{
  "prompt": "...",
  "i2vPrompt": "Static locked tripod camera, fixed angle with stable horizon. Perfect seamless looping animation, cyclical motion where the beginning and ending connect flawlessly. Micro-motions: ... Smooth 60fps, natural organic motion, zero camera jitter.",
  "contentDna": {
    "visualStyle": "...",
    "colorPalette": ["...", "..."],
    "lighting": "...",
    "atmosphere": "...",
    "targetNiche": "...",
    "formatRecommendation": "..."
  },
  "targetCountries": [
    {
      "country": "...",
      "code": "...",
      "flag": "...",
      "language": "...",
      "langCode": "...",
      "fitScore": 95,
      "reasoning": "...",
      "cpmTier": "...",
      "targetAudience": "...",
      "bestPostingTime": "..."
    }
  ],
  "primaryTargetCountry": "...",
  "primaryLanguage": "...",
  "bilingual": {
    "en": {
      "languageName": "English",
      "titleA": "...",
      "titleA_type": "Viral Hook / CTR",
      "titleA_explanation": "...",
      "titleB": "...",
      "titleB_type": "Search SEO & Algorithm",
      "titleB_explanation": "...",
      "hook": "...",
      "description": "...",
      "hashtags": ["#..."],
      "tags": ["..."],
      "category": "...",
      "contentPillars": ["...", "...", "..."]
    },
    "target": {
      "languageName": "...",
      "titleA": "...",
      "titleA_type": "Viral Hook / CTR",
      "titleA_explanation": "...",
      "titleB": "...",
      "titleB_type": "Search SEO & Algorithm",
      "titleB_explanation": "...",
      "hook": "...",
      "description": "...",
      "hashtags": ["#..."],
      "tags": ["..."],
      "category": "...",
      "contentPillars": ["...", "...", "..."]
    }
  }
}`;

    const rawResponse = await callGeminiWithFallback(ai, {
      contents: [{ role: "user", parts: [{ text: systemPrompt }, { inlineData: { mimeType, data: imageBase64 } }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            prompt: { type: "STRING" },
            i2vPrompt: { type: "STRING" },
            contentDna: {
              type: "OBJECT",
              properties: {
                visualStyle: { type: "STRING" },
                colorPalette: { type: "ARRAY", items: { type: "STRING" } },
                lighting: { type: "STRING" },
                atmosphere: { type: "STRING" },
                targetNiche: { type: "STRING" },
                formatRecommendation: { type: "STRING" },
              },
              required: ["visualStyle", "targetNiche", "formatRecommendation"],
            },
            targetCountries: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  country: { type: "STRING" },
                  code: { type: "STRING" },
                  flag: { type: "STRING" },
                  language: { type: "STRING" },
                  langCode: { type: "STRING" },
                  fitScore: { type: "INTEGER" },
                  reasoning: { type: "STRING" },
                  cpmTier: { type: "STRING" },
                  targetAudience: { type: "STRING" },
                  bestPostingTime: { type: "STRING" },
                },
                required: ["country", "language", "fitScore", "reasoning", "cpmTier", "targetAudience", "bestPostingTime"],
              },
            },
            primaryTargetCountry: { type: "STRING" },
            primaryLanguage: { type: "STRING" },
            bilingual: {
              type: "OBJECT",
              properties: {
                en: {
                  type: "OBJECT",
                  properties: {
                    languageName: { type: "STRING" },
                    titleA: { type: "STRING" },
                    titleA_type: { type: "STRING" },
                    titleA_explanation: { type: "STRING" },
                    titleB: { type: "STRING" },
                    titleB_type: { type: "STRING" },
                    titleB_explanation: { type: "STRING" },
                    hook: { type: "STRING" },
                    description: { type: "STRING" },
                    hashtags: { type: "ARRAY", items: { type: "STRING" } },
                    tags: { type: "ARRAY", items: { type: "STRING" } },
                    category: { type: "STRING" },
                    contentPillars: { type: "ARRAY", items: { type: "STRING" } },
                  },
                  required: ["languageName", "titleA", "titleB", "hook", "description", "hashtags", "tags"],
                },
                target: {
                  type: "OBJECT",
                  properties: {
                    languageName: { type: "STRING" },
                    titleA: { type: "STRING" },
                    titleA_type: { type: "STRING" },
                    titleA_explanation: { type: "STRING" },
                    titleB: { type: "STRING" },
                    titleB_type: { type: "STRING" },
                    titleB_explanation: { type: "STRING" },
                    hook: { type: "STRING" },
                    description: { type: "STRING" },
                    hashtags: { type: "ARRAY", items: { type: "STRING" } },
                    tags: { type: "ARRAY", items: { type: "STRING" } },
                    category: { type: "STRING" },
                    contentPillars: { type: "ARRAY", items: { type: "STRING" } },
                  },
                  required: ["languageName", "titleA", "titleB", "hook", "description", "hashtags", "tags"],
                },
              },
              required: ["en", "target"],
            },
          },
          required: ["prompt", "i2vPrompt", "contentDna", "targetCountries", "primaryTargetCountry", "primaryLanguage", "bilingual"],
        },
      }
    });

    res.json(extractCleanJson(rawResponse));
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Terjadi kesalahan server." });
  }
});

app.post("/api/generate-calendar", async (req, res) => {
  try {
    const { contentDna, visualPrompt, targetCountry = "Global", targetLanguage = "English", days = 7, extraFocus } = req.body;
    const daysCount = days === 30 ? 30 : 7;
    const ai = getGenAI();

    const calendarPrompt = `You are an elite YouTube Content Director & Growth Strategist.
Create a comprehensive, production-ready ${daysCount}-Day YouTube Content Calendar Plan based on this Content DNA and Visual Concept.
Every single day must be optimized for YouTube Algorithm performance (Browse, Suggested & YouTube Search SEO):

CONTENT DNA CONTEXT:
- Visual Style: ${contentDna?.visualStyle || "Cinematic Visuals"}
- Target YouTube Niche: ${contentDna?.targetNiche || "Digital Creator"}
- Target Country: ${targetCountry}
- Target Native Language: ${targetLanguage}
- Base Master Visual Prompt: ${visualPrompt || ""}
${extraFocus ? `- Extra Creator Focus: ${extraFocus}` : ""}

Plan exactly ${daysCount} days of strategic YouTube content.
Balance the content pillars strategically across the ${daysCount} days:
- Viral Curiosity Hook / Trending Topic (Browse Feature Velocity)
- Deep Lore / Visual Storytelling (High Retention)
- How-To / Educational Insight (YouTube Search Evergreen)
- Controversial Question / Community Debate (High Comment Ratio)
- Pure Visual ASMR / Aesthetic Cinema (Infinite Loop Shorts)
- Trend Variation / Sound Surfing
- Authority & Subscriber Conversion CTA

For EACH day (Day 1 to Day ${daysCount}), provide:
- day: (number 1 to ${daysCount})
- dayTitle: Short theme punchline (e.g. "The Neon Cybernetic Origin", "Secrets Behind the Glow")
- pillar: Content Pillar name
- title_en: YouTube-optimized Title in English (strictly 50-60 characters, front-loaded keyword, high CTR)
- title_target: YouTube-optimized Title in ${targetLanguage} (strictly 50-60 characters, high CTR)
- hook_en: Opening 3-second retention spike hook script in English (voiceover or text on screen)
- hook_target: Opening 3-second retention spike hook in ${targetLanguage}
- visualPrompt: Specific Midjourney/Flux generation prompt for Day's visual asset / YouTube Thumbnail
- i2vPrompt: Image-to-Video motion prompt (MANDATORY: static locked tripod camera, rock-solid horizon, perfect seamless looping animation where start and end frame loop without jump-cuts, subtle cyclical micro-motions)
- format: YouTube Format ("YouTube Shorts (9:16)" or "YouTube Video (16:9)")
- cta: YouTube-native call to action (e.g., "Subscribe & Simpan Playlist", "Komentari Pendapatmu", "Tonton Part 2 di Deskripsi")
- status: "todo"

RESPOND STRICTLY IN VALID JSON:
{
  "calendar": [
    {
      "day": 1,
      "dayTitle": "...",
      "pillar": "...",
      "title_en": "...",
      "title_target": "...",
      "hook_en": "...",
      "hook_target": "...",
      "visualPrompt": "...",
      "i2vPrompt": "Static locked tripod camera, zero camera movement, stable horizon. Perfect seamless looping video, fluid cyclical micro-movement ... 60fps.",
      "format": "...",
      "cta": "...",
      "status": "todo"
    }
  ]
}`;

    const rawResponse = await callGeminiWithFallback(ai, {
      contents: [{ role: "user", parts: [{ text: calendarPrompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            calendar: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  day: { type: "INTEGER" },
                  dayTitle: { type: "STRING" },
                  pillar: { type: "STRING" },
                  title_en: { type: "STRING" },
                  title_target: { type: "STRING" },
                  hook_en: { type: "STRING" },
                  hook_target: { type: "STRING" },
                  visualPrompt: { type: "STRING" },
                  i2vPrompt: { type: "STRING" },
                  format: { type: "STRING" },
                  cta: { type: "STRING" },
                  status: { type: "STRING" },
                },
                required: ["day", "dayTitle", "pillar", "title_en", "title_target", "hook_en", "hook_target", "visualPrompt", "format", "cta", "status"],
              },
            },
          },
          required: ["calendar"],
        },
      }
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
