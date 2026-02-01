
import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI(apiKey) : null;

export async function getUnavailableItemHelp(itemName: string, reason: string): Promise<string> {
  if (!ai) {
    return "We're sorry, this item is currently unavailable. Please explore our other delicious options!";
  }
  try {
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(`The menu item "${itemName}" is currently unavailable because of: "${reason}". 
      As a friendly restaurant host, give a 1-sentence empathetic apology and suggest that the customer checks out other delicious options on the menu.`);
    const response = await result.response;
    return response.text() || "We're sorry, this item is currently unavailable.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "This item is currently out of stock. Please check back later!";
  }
}
