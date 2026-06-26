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
    
    const systemPrompt = `You are an expert civic hazard analyst. Your job is to analyze a community-reported civic issue (like potholes, water leakage, or broken streetlights) and return a JSON object with:
1. "rephrased": A highly professional, clear, and polite single-sentence or short paragraph rephrasing of the issue for city hazard logs (maximum 25 words).
2. "severity": One of ["Low", "Medium", "High", "Critical"]. Assign based on immediate safety hazards, traffic flow disruption, water/resource waste, or infrastructure damage.
3. "severityExplanation": A short, clear, 1-sentence explanation of why you selected this severity.
4. "suggestedCategory": One of ["Pothole", "Waste Management", "Water Leakage", "Damaged Streetlight", "Other"]. Choose the best fit.

You MUST respond ONLY with a raw JSON object matching this schema, without markdown formatting or other comments.`;

    const userPrompt = `Issue Category: ${category || "General Community Issue"}\nReported Description: "${description}"`;

    const response = await runWithRetry(() => 
      aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.2,
          responseMimeType: "application/json"
        },
      })
    );

    const jsonText = response.text || "{}";
    let parsed = {
      rephrased: description,
      severity: "Medium",
      severityExplanation: "Assigned default severity.",
      suggestedCategory: category || "Other"
    };

    try {
      let cleaned = jsonText.trim();
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```/, "").replace(/```$/, "").trim();
      }
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("Failed to parse Gemini JSON output, raw text was:", jsonText, parseErr);
    }

    res.json({ 
      analysis: parsed.rephrased || description,
      severity: parsed.severity || "Medium",
      severityExplanation: parsed.severityExplanation || "Assigned standard severity classification.",
      suggestedCategory: parsed.suggestedCategory || category || "Other"
    });
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

// API endpoint for semantic duplicate detection
app.post("/api/detect-duplicates", async (req, res) => {
  try {
    const { description, address, category, existingIssues } = req.body;
    if (!description || typeof description !== "string") {
      return res.status(400).json({ error: "Description is required" });
    }

    if (!existingIssues || !Array.isArray(existingIssues) || existingIssues.length === 0) {
      return res.json({ isDuplicate: false, duplicateOfId: null, explanation: null });
    }

    const aiClient = getGenAI();

    const systemPrompt = `You are an expert civic system optimizer. Your job is to analyze a new community issue report and compare it to a list of existing issue reports to identify if it is a duplicate.
An issue is a duplicate if it describes the same event, damage, or hazard at the exact same location/street or within extremely close proximity (e.g. "large pothole near pharmacy" is a duplicate of "pothole on Main Street near pharmacy").
Return a JSON object with:
1. "isDuplicate": true if the new report is a clear duplicate of one of the existing issues, false otherwise.
2. "duplicateOfId": The issueId of the duplicated issue from the list, or null if isDuplicate is false.
3. "explanation": A friendly, clear 1-sentence explanation of why it is a duplicate (pointing to similarities) or why it is unique.

You MUST respond ONLY with a raw JSON object matching this schema, without markdown formatting or other comments.`;

    const userPrompt = `New Issue to analyze:
- Description: "${description}"
- Address/Location: "${address || "Unknown"}"
- Category: "${category || "Other"}"

List of existing issue reports in the system:
${JSON.stringify(existingIssues.map((issue: any) => ({
  issueId: issue.issueId,
  description: issue.description,
  address: issue.address,
  category: issue.category
})), null, 2)}
`;

    const response = await runWithRetry(() => 
      aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.1,
          responseMimeType: "application/json"
        },
      })
    );

    const jsonText = response.text || "{}";
    let parsed = {
      isDuplicate: false,
      duplicateOfId: null as string | null,
      explanation: null as string | null
    };

    try {
      let cleaned = jsonText.trim();
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```/, "").replace(/```$/, "").trim();
      }
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("Failed to parse duplicates JSON:", jsonText, parseErr);
    }

    res.json(parsed);
  } catch (error: any) {
    console.error("Error in /api/detect-duplicates:", error);
    res.status(500).json({ error: error?.message || "Failed to analyze duplicates" });
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
