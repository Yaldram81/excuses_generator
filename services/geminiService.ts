
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedExcuseResponse, Category, UserProfile, UsageRecord, CustomTemplate } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateExcuse = async (
  context: string,
  audience: string,
  tone: 'formal' | 'casual',
  riskTolerance: 'low' | 'medium' | 'high',
  profile: UserProfile,
  history: UsageRecord[],
  customTemplates: CustomTemplate[]
): Promise<GeneratedExcuseResponse> => {
  const historySummary = history.slice(-5).map(h => `${h.category}: ${h.context}`).join(', ');
  const templatesSummary = customTemplates.length > 0 
    ? `User Preferred Templates: ${customTemplates.map(t => `[${t.category}] ${t.text}`).join('; ')}`
    : "No custom templates provided.";
  
  const prompt = `
    Context: ${context}
    Audience: ${audience}
    Tone: ${tone}
    Risk Tolerance: ${riskTolerance}
    User Credibility: ${profile.overallCredibility}
    Overused Categories: ${profile.overusedCategories.join(', ')}
    Recent History: ${historySummary}
    ${templatesSummary}

    Generate a plausible excuse or an honest alternative. 
    If risk tolerance is 'low', lean towards honesty.
    If credibility is low, suggest a more vulnerable, honest approach.
    Incorporate the user's preferred phrasing or templates if they are relevant to the category.
    
    The response must include:
    1. The excuse text.
    2. A base plausibility score (0.0 to 1.0).
    3. The most fitting category.
    4. A brief reasoning of why this was chosen.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          excuse: { type: Type.STRING },
          basePlausibility: { type: Type.NUMBER },
          category: { type: Type.STRING },
          reasoning: { type: Type.STRING },
        },
        required: ["excuse", "basePlausibility", "category", "reasoning"],
      }
    }
  });

  return JSON.parse(response.text) as GeneratedExcuseResponse;
};

export const analyzeReflections = async (usage: UsageRecord): Promise<string> => {
  const prompt = `
    Analyze this reflection on a used excuse:
    Excuse: ${usage.context}
    Result: ${usage.outcome}
    Was it true? ${usage.wasTrue ? 'Yes' : 'No'}
    User notes: ${usage.reflectionNotes}

    Provide a short (2 sentence) piece of ethical insight about the cost of this choice.
  `;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt
  });
  return response.text;
};
