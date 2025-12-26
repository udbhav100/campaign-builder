
import { generateSuggestionsFromUrl } from '../utils';

export interface AiResponse {
  keywordThemes: string[];
  adCopies: { headline: string; description: string }[];
  competitorTerms: string[];
  differentiateTerms: string[];
}

export async function generateRealCampaignSuggestions(url: string, objective: string, tone: string): Promise<AiResponse> {
  // Guideline: API key must be obtained exclusively from process.env.API_KEY
  const apiKey = process.env.API_KEY;

  // Helper to map mock data to expected AiResponse format
  const getFallback = () => {
     // Cast tone to any because utils expects ToneType but we are passing string, usually compatible
     const mock = generateSuggestionsFromUrl(url, undefined, undefined, tone as any);
     return {
         keywordThemes: mock.keywords,
         adCopies: mock.adCopies,
         competitorTerms: mock.competitorTerms,
         differentiateTerms: mock.differentiateTerms
     };
  };

  // 1. Immediate Fail-safe: No Key? Use Mock Data.
  if (!apiKey) {
    console.warn("No API Key found. Using Mock Data.");
    return getFallback();
  }

  // 2. Direct REST Call (No SDK, No Server Route)
  // Fixed: Switched from 'gemini-1.5-flash' (which caused 404) to 'gemini-3-flash-preview'
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

  const promptText = `
    You are an expert AdTech copywriter.
    Business URL: ${url}
    Objective: ${objective}
    Tone: ${tone}
    
    Return a pure JSON object (no markdown) with this schema:
    {
      "keywordThemes": ["5 short keywords"],
      "adCopies": [{"headline": "30 chars max", "description": "90 chars max"}],
      "competitorTerms": ["3 brand names"],
      "differentiateTerms": ["3 niche terms"]
    }
  `;

  try {
    // 3. Set a strict 5-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`Gemini API Error: ${response.status}`);

    const data = await response.json();
    
    // 4. Safe Parsing
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return parsed;

  } catch (error) {
    console.error("Gemini Failed, switching to Mock:", error);
    // 5. THE ULTIMATE FALLBACK
    return getFallback();
  }
}
