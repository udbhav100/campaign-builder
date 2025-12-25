import { GoogleGenAI, Type } from "@google/genai";
import { generateSuggestionsFromUrl } from '../utils';

export interface AiResponse {
  keywordThemes: string[];
  adCopies: { headline: string; description: string }[];
  competitorTerms: string[];
  differentiateTerms: string[];
}

export async function generateRealCampaignSuggestions(url: string, objective: string, tone: string): Promise<AiResponse> {
  const apiKey = process.env.API_KEY;

  // Fallback helper
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

  if (!apiKey) {
    console.warn("No API Key found. Using Mock Data.");
    return getFallback();
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const promptText = `
      You are an expert AdTech copywriter.
      Business URL: ${url}
      Objective: ${objective}
      Tone: ${tone}
      
      CRITICAL: The first headline MUST include the first keyword theme verbatim to ensure a high relevance score.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            keywordThemes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "5 short keywords"
            },
            adCopies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  headline: { type: Type.STRING, description: "30 chars max" },
                  description: { type: Type.STRING, description: "90 chars max" }
                }
              }
            },
            competitorTerms: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 brand names"
            },
            differentiateTerms: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 niche terms"
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AiResponse;
    }
    throw new Error("Empty response from Gemini");

  } catch (error) {
    console.error("Gemini Failed, switching to Mock:", error);
    return getFallback();
  }
}