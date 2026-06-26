import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded GenAI helper to prevent server crash on startup if key is missing
let genAiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required but missing. Please set it in Settings > Secrets.");
    }
    genAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAiClient;
}

// Helper for exponential backoff retries on transient errors
async function runWithRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errString = typeof error === 'object' ? JSON.stringify(error) : String(error);
    const isTransient = errString.includes("503") || 
                        errString.includes("high demand") || 
                        errString.includes("UNAVAILABLE") || 
                        errString.includes("temporary") || 
                        errString.includes("Resource exhausted") ||
                        errString.includes("429");
                        
    if (retries > 0 && isTransient) {
      console.warn(`Gemini API returned transient error. Retrying in ${delayMs}ms... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return runWithRetry(fn, retries - 1, delayMs * 2);
    }
    throw error;
  }
}

// API endpoint for explaining the community issue in detail
app.post("/api/explain", async (req, res) => {
  try {
    const { description, category } = req.body;
    if (!description || typeof description !== "string") {
      return res.status(400).json({ error: "Description is required" });
    }

    const aiClient = getGenAI();
    
    const systemPrompt = `You are a helpful assistant that rephrases short community-reported civic issues (like potholes, broken streetlights, or public littering) into clear, concise, and professional descriptions for city hazard logs.
Given an issue description, rephrase it to be professional, descriptive, and polite (for example, rephrasing "very deep pothole" to "A deep and hazardous pothole on the road surface posing an immediate risk to vehicles and pedestrians").
Do NOT write any introduction, commentary, or explanation. Do NOT add markdown headers or bullet points. Return ONLY the single rephrased sentence or short paragraph (maximum 20-25 words).`;

    const userPrompt = `Issue Category: ${category || "General Community Issue"}
Reported Description: "${description}"`;

    const response = await runWithRetry(() => 
      aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        },
      })
    );

    res.json({ analysis: response.text });
  } catch (error: any) {
    console.error("Error in /api/explain:", error);
    
    let userFriendlyMessage = "The AI service encountered an unexpected error. Please try again.";
    const errString = typeof error === 'object' ? JSON.stringify(error) : String(error);
    
    // Check for high-demand / unavailable / quota / server rate errors
    if (
      errString.includes("503") || 
      errString.includes("high demand") || 
      errString.includes("UNAVAILABLE") || 
      errString.includes("temporary") || 
      errString.includes("Resource exhausted") ||
      errString.includes("429")
    ) {
      userFriendlyMessage = "The Gemini AI service is currently experiencing very high demand or is temporarily unavailable. This spike is usually temporary. Please wait a moment and try again shortly.";
    } else if (errString.includes("API_KEY") || errString.includes("API key")) {
      userFriendlyMessage = "The Gemini AI configuration is incomplete. Please check your project's developer settings.";
    } else if (error?.message) {
      userFriendlyMessage = error.message;
    }

    res.status(500).json({ error: userFriendlyMessage });
  }
});

// Vite middleware setup
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

setupVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error("Vite setup failure:", err);
});
