import { GoogleGenAI } from "@google/genai";

export async function generateInsights(tasks: any[], mode: string, history: { role: string, content: string }[] = []): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const systemInstruction = `
    You are an advanced AI productivity, fitness, and nutrition optimization assistant.
    Current mindset/mode: ${mode}.
    Provide concise, highly actionable responses formatted cleanly. Use a futuristic cyber tone.
    If the user asks about workouts they did, provide specific diet and recovery recommendations.
    If they ask about work, suggest cognitive load optimization.
  `;

  if (history.length === 0) {
    if (!tasks || tasks.length === 0) {
      return "Your neural schedule is currently empty. Add some tasks first so the Aether Core can analyze your patterns and optimize your day.";
    }

    const prompt = `
      Analyze the following tasks for the user.
      
      Tasks:
      ${JSON.stringify(tasks.map((t: any) => ({ title: t.title, category: t.category, group: t.muscleGroup || t.category, intensity: t.intensity, time: new Date(t.startTime).toLocaleTimeString() })), null, 2)}
      
      Provide a concise 3-bullet point summary of optimization insights.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
      }
    });

    return response.text || "Neural Analysis didn't return any readable text. Try again.";
  } else {
    // Handling chat mode
    // Map history to the format required by GenAI: { role: 'user' | 'model', parts: [{ text: '...' }] }
    // User history expects 'user' or 'model' roles.
    const contents: any[] = history.map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction,
      }
    });

    return response.text || "Neural Analysis failed to respond.";
  }
}
