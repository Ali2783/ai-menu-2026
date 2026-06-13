import { MenuData } from "../types";

export const extractMenuFromImage = async (base64Image: string): Promise<MenuData> => {
  try {
    const response = await fetch('/api/extract-menu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base64Image }),
    });

    if (!response.ok) {
      const errMsg = await response.text();
      throw new Error(errMsg || `Extraction request failed with status code ${response.status}`);
    }

    return await response.json() as MenuData;
  } catch (error: any) {
    console.error("Error invoking backend Gemini extraction:", error);
    throw error;
  }
};
