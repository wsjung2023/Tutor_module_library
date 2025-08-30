import OpenAI from "openai";
import type { GenerateImageRequest, GenerateDialogueRequest } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

export async function generateCharacterImage(request: GenerateImageRequest): Promise<{ imageUrl: string }> {
  const { name, gender, style, audience, scenario } = request;
  
  // Define professional backgrounds based on scenario context
  const getScenarioBackground = (scenario: string) => {
    const backgrounds = {
      restaurant: "elegant restaurant interior with dining tables and ambient lighting",
      airport: "modern airport terminal with check-in counters and departure boards",
      coffee_shop: "trendy coffee shop with espresso machines and cozy seating",
      office: "professional corporate office with modern furniture",
      school: "bright classroom with educational materials and whiteboards",
      hotel: "luxurious hotel lobby with reception desk and elegant decor"
    };
    return backgrounds[scenario as keyof typeof backgrounds] || "professional indoor setting";
  };

  // Define style characteristics
  const styleMap = {
    cheerful: "bright smile, friendly expression, energetic pose",
    calm: "serene expression, gentle demeanor, relaxed posture", 
    strict: "serious expression, professional appearance, confident stance"
  };

  // Get scenario-specific background
  const background = scenario ? getScenarioBackground(scenario) : `professional setting suitable for ${audience} level English learning`;
  
  // Get appropriate outfit and pose based on scenario and style
  const getOutfitForScenario = (scenario: string, style: string) => {
    const outfits = {
      restaurant: style === 'strict' ? 'formal server uniform, black apron' : 'casual restaurant uniform, friendly smile',
      airport: 'professional flight attendant uniform, name badge',
      coffee_shop: 'casual barista apron over comfortable clothing',
      business_meeting: 'professional business attire, suit or blazer',
      hotel: 'elegant concierge uniform, professional appearance',
      cafeteria: 'casual food service uniform, hair net, friendly demeanor',
      club: 'casual student clothing, club t-shirt or hoodie'
    };
    return outfits[scenario as keyof typeof outfits] || 'professional casual attire';
  };

  const getPoseForStyle = (style: string) => {
    const poses: Record<string, string> = {
      cheerful: 'standing confidently with warm welcoming gesture',
      calm: 'standing peacefully with relaxed, approachable posture',
      strict: 'standing professionally with confident, authoritative stance'
    };
    return poses[style] || 'standing naturally with friendly posture';
  };

  const outfit = getOutfitForScenario(scenario || 'restaurant', style);
  const pose = getPoseForStyle(style);
  
  const prompt = `FULL LENGTH BODY SHOT: Professional photograph of a real human ${gender} person, ENTIRE BODY visible from head to feet, standing ${pose}, wearing ${outfit}, at ${background}. 

MANDATORY FRAMING: Complete figure visible - head at top 20% of image, feet at bottom 10% of image, showing shoes/footwear. Person should occupy 60-70% of image height to ensure full body is captured without cropping any limbs.

CAMERA SETUP: Positioned 8-10 feet back from subject, wide angle lens (24-35mm equivalent), vertical orientation, adequate space above head and below feet.

Ultra photorealistic, natural skin texture, realistic human proportions, professional portrait lighting.
High quality DSLR shot, f/2.8, soft natural light, balanced exposure.

STRICTLY NO: head-and-shoulders only, waist-up shots, cropped legs, cropped feet, tight framing that cuts off any body parts.`;

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1792", // Maximum vertical ratio for full body shots
      quality: "hd", // High quality for realistic images
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
