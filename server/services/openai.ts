import OpenAI from "openai";
import type { GenerateImageRequest, GenerateDialogueRequest } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

export async function generateCharacterImage(request: GenerateImageRequest): Promise<{ imageUrl: string }> {
  const { name, gender, style, audience } = request;
  
  // Define background based on audience
  const backgroundMap = {
    student: "simple classroom setting with desks and chalkboard",
    general: "cozy cafe with warm lighting and books",
    business: "modern office environment with professional setting"
  };

  // Define style characteristics
  const styleMap = {
    cheerful: "bright smile, friendly expression, energetic pose",
    calm: "serene expression, gentle demeanor, relaxed posture", 
    strict: "serious expression, professional appearance, confident stance"
  };

  const prompt = `Create a cartoon-style English tutor character named ${name}. 
    Gender: ${gender}. 
    Personality: ${styleMap[style]}. 
    Background: ${backgroundMap[audience]}. 
    The character should look approachable and professional, suitable for English language teaching. 
    Style should be clean, modern cartoon illustration with friendly colors.
    High quality, detailed illustration.`;

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error("No image URL returned from OpenAI");
    }

    return { imageUrl };
  } catch (error) {
    console.error("OpenAI image generation failed:", error);
    throw new Error(`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateDialogue(request: GenerateDialogueRequest): Promise<{
  lines: string[];
  focus_phrases: string[];
}> {
  const { audience, character, scenario } = request;

  // Define CEFR levels and characteristics
  const audienceConfig = {
    student: {
      cefr: "A2-B1",
      vocabulary: "basic to intermediate vocabulary, simple sentence structures",
      topics: "school life, daily activities, hobbies"
    },
    general: {
      cefr: "B1-B2", 
      vocabulary: "intermediate vocabulary, varied sentence structures",
      topics: "travel, work, social situations, daily life"
    },
    business: {
      cefr: "B2-C1",
      vocabulary: "advanced vocabulary, professional terminology, complex structures", 
      topics: "professional communication, meetings, negotiations, presentations"
    }
  };

  // Define style characteristics for dialogue
  const styleConfig = {
    cheerful: "enthusiastic, encouraging, uses positive language and exclamation marks",
    calm: "patient, gentle, uses measured pace and reassuring language",
    strict: "focused, direct, uses formal language and clear instructions"
  };

  const config = audienceConfig[audience];
  const scenarioText = scenario.freeText || scenario.presetKey || "general conversation";

  const systemPrompt = `You are ${character.name}, a ${character.style} English tutor for ${audience} level students.

AUDIENCE: ${audience} (${config.cefr} level)
VOCABULARY: Use ${config.vocabulary}
STYLE: Be ${styleConfig[character.style]}
SCENARIO: ${scenarioText}

Generate exactly 3 lines that ${character.name} would say as an English tutor in this scenario. 
Also provide 3 native-like focus phrases that are appropriate for this audience level.

Respond in JSON format:
{
  "lines": ["...", "...", "..."],
  "focus_phrases": ["...", "...", "..."]
}`;

  const userPrompt = `Create a conversation for this scenario: ${scenarioText}
Make sure the dialogue is appropriate for ${config.cefr} level and focuses on ${config.topics}.
The tutor should demonstrate ${character.style} teaching style.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 500
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content returned from OpenAI");
    }

    const result = JSON.parse(content);
    
    // Validate the response structure
    if (!result.lines || !Array.isArray(result.lines) || result.lines.length !== 3) {
      throw new Error("Invalid lines format in OpenAI response");
    }
    
    if (!result.focus_phrases || !Array.isArray(result.focus_phrases) || result.focus_phrases.length !== 3) {
      throw new Error("Invalid focus_phrases format in OpenAI response");
    }

    return {
      lines: result.lines,
      focus_phrases: result.focus_phrases
    };
  } catch (error) {
    console.error("OpenAI dialogue generation failed:", error);
    throw new Error(`Dialogue generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
