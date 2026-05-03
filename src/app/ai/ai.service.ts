import { getGeminiModel } from '../../lib/gemini';

export const generateSmartRecommendations = async (
  userHistory: { relatedCategories: string[], relatedThemes: string[] },
  upcomingEvents: any[]
): Promise<string[]> => {
  const model = getGeminiModel("gemini-1.5-flash");

  const prompt = `
    You are an AI Event Recommender.
    User's preferred categories: ${userHistory.relatedCategories.join(', ')}.
    User's preferred themes: ${userHistory.relatedThemes.join(', ')}.
    
    Here is a list of upcoming events in JSON format:
    ${JSON.stringify(upcomingEvents)}
    
    Based on the user's preferences, select up to 10 event IDs from the upcoming events list that are the most relevant recommendations.
    Return the result strictly as a valid JSON array of strings containing only the selected event IDs. Do not include markdown formatting or explanations. Format: ["id1", "id2"]
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanedText);
  } catch (err) {
    console.error("AI Recommendation failed.", err);
    return [];
  }
};

export const generateSearchSuggestions = async (
  searchTerm: string,
  eventPool: any[]
): Promise<string[]> => {
  const model = getGeminiModel("gemini-1.5-flash");

  const prompt = `
    You are a semantic search AI.
    The user is searching for: "${searchTerm}"
    
    Here is a pool of events:
    ${JSON.stringify(eventPool)}
    
    Find the top 5 most relevant events based on the search term. Match semantically even if words don't exactly match (e.g., "learning" matches "Bootcamp").
    Return strictly a valid JSON array of strings containing only the selected event IDs. Do not include markdown formatting. Format: ["id1", "id2", "id3"]
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanedText);
  } catch (err) {
    console.error("AI Search failed.", err);
    return [];
  }
};
