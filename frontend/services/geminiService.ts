
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export async function getUnavailableItemHelp(itemName: string, reason: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The menu item "${itemName}" is currently unavailable because of: "${reason}". 
      As a friendly restaurant host, give a 1-sentence empathetic apology and suggest that the customer checks out other delicious options on the menu.`,
      config: {
        temperature: 0.7,
        maxOutputTokens: 100,
      }
    });

    return response.text || "We're sorry, this item is currently unavailable. Please explore our other delicious options!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "This item is currently out of stock. Please check back later!";
  }
}
