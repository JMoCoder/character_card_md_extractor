
import { GoogleGenAI, Type } from "@google/genai";
import { CharacterMetadata } from "../types";

export async function generateEnhancedMarkdown(char: CharacterMetadata): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("Missing VITE_GEMINI_API_KEY");
    throw new Error("API Key missing");
  }
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Extract and format the following character card information into a clean, professional, and well-structured Markdown document.
    Include sections for Name, Personality, Description, Scenario, First Message, and Message Examples.
    If there are tags or creator notes, include them as well.
    Make it look visually appealing for a roleplay documentation.
    
    Character Data:
    ${JSON.stringify(char, null, 2)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini enhancement failed", error);
    // Fallback basic markdown
    return `
# ${char.name}

## Personality
${char.personality}

## Description
${char.description}

## Scenario
${char.scenario}

## First Message
${char.first_mes}

## Examples
\`\`\`
${char.mes_example}
\`\`\`
    `.trim();
  }
}
