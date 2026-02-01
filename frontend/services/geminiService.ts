/**
 * Gemini Service (Secure Proxy Version)
 * 
 * This service no longer communicates with Google directly.
 * Instead, it calls our FastAPI backend which securely holds the API key.
 */

const API_BASE_URL = '/api/v1';

export async function getUnavailableItemHelp(itemName: string, reason: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/apology`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        item_name: itemName,
        reason: reason
      }),
    });

    if (!response.ok) {
      throw new Error('AI Proxy request failed');
    }

    const data = await response.json();
    return data.apology || "We're sorry, this item is currently unavailable.";
  } catch (error) {
    console.error("Gemini Proxy Error:", error);
    return `We're sorry, ${itemName} is currently out of stock due to ${reason}. Please check back later!`;
  }
}