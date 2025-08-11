import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export async function generateOpenAITTS(text: string, voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova'): Promise<string> {
  try {
    console.log(`Generating OpenAI TTS for text: "${text.substring(0, 50)}..."`);
    
    const response = await openai.audio.speech.create({
      model: "tts-1-hd", // High quality model
      voice: voice,
      input: text,
      response_format: "mp3",
      speed: 1.0
    });

    // Convert response to base64
    const buffer = Buffer.from(await response.arrayBuffer());
    const base64Audio = buffer.toString('base64');
    const audioUrl = `data:audio/mp3;base64,${base64Audio}`;
    
    console.log(`OpenAI TTS generated successfully, size: ${buffer.length} bytes`);
    return audioUrl;
    
  } catch (error: any) {
    console.error('OpenAI TTS generation failed:', error);
    throw new Error(`OpenAI TTS generation failed: ${error.message}`);
  }
}

// Voice mapping for different character styles
export function getOpenAIVoiceForCharacter(style: string, gender: string): 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' {
  // Female voices
  if (gender.toLowerCase() === 'female') {
    switch (style.toLowerCase()) {
      case 'professional':
      case 'business':
        return 'nova'; // Professional female voice
      case 'friendly':
      case 'warm':
        return 'shimmer'; // Warm, friendly female voice
      case 'casual':
      case 'young':
        return 'alloy'; // Casual, versatile voice
      default:
        return 'nova';
    }
  } 
  
  // Male voices
  if (gender.toLowerCase() === 'male') {
    switch (style.toLowerCase()) {
      case 'professional':
      case 'business':
        return 'onyx'; // Deep, professional male voice
      case 'friendly':
      case 'warm':
        return 'echo'; // Warm, friendly male voice
      case 'casual':
      case 'young':
        return 'fable'; // Expressive, storytelling voice
      default:
        return 'onyx';
    }
  }
  
  // Default fallback
  return 'nova';
}