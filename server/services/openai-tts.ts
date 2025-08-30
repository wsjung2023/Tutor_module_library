import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export async function generateOpenAITTS(
  text: string, 
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova',
  emotion: 'neutral' | 'happy' | 'concerned' | 'professional' | 'excited' | 'calm' = 'neutral',
  speed: number = 1.0
): Promise<string> {
  try {
    console.log(`Generating OpenAI TTS for text: "${text.substring(0, 50)}..." with emotion: ${emotion}`);
    
    // Adjust speed based on emotion
    const emotionSpeeds = {
      excited: 1.1,
      happy: 1.05,
      neutral: 1.0,
      professional: 0.95,
      concerned: 0.9,
      calm: 0.85
    };
    
    const adjustedSpeed = emotionSpeeds[emotion] || speed;
    
    // Add emotional context to text when appropriate
    const emotionalText = addEmotionalContext(text, emotion);
    
    const response = await openai.audio.speech.create({
      model: "tts-1-hd", // High quality model
      voice: voice,
      input: emotionalText,
      response_format: "mp3",
      speed: adjustedSpeed
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

// Add emotional context to text for better TTS expression
function addEmotionalContext(text: string, emotion: string): string {
  const emotionalPrefixes = {
    excited: text, // Keep natural for excitement
    happy: text, // Keep natural for happiness  
    neutral: text,
    professional: text,
    concerned: text,
    calm: text
  };
  
  return emotionalPrefixes[emotion as keyof typeof emotionalPrefixes] || text;
}

// Voice mapping for different character roles and scenarios
export function getOpenAIVoiceForCharacter(
  style: string, 
  gender: string, 
  role: string = ''
): 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' {
  
  // Role-based voice selection
  const roleVoices: Record<string, 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'> = {
    'Professional Server': gender === 'female' ? 'nova' : 'onyx',
    'Flight Attendant': gender === 'female' ? 'shimmer' : 'echo',
    'Friendly Barista': gender === 'female' ? 'alloy' : 'fable',
    'Senior Executive': gender === 'female' ? 'nova' : 'onyx',
    'Concierge': gender === 'female' ? 'shimmer' : 'echo',
    'Check-in Staff': gender === 'female' ? 'nova' : 'onyx'
  };
  
  // Check if we have a specific voice for this role
  if (role && roleVoices[role]) {
    return roleVoices[role];
  }
  
  // Female voices
  if (gender.toLowerCase() === 'female') {
    switch (style.toLowerCase()) {
      case 'professional':
      case 'strict':
        return 'nova'; // Professional, clear female voice
      case 'cheerful':
      case 'friendly':
        return 'shimmer'; // Warm, friendly female voice
      case 'calm':
        return 'alloy'; // Gentle, versatile voice
      default:
        return 'nova';
    }
  } 
  
  // Male voices
  if (gender.toLowerCase() === 'male') {
    switch (style.toLowerCase()) {
      case 'professional':
      case 'strict':
        return 'onyx'; // Deep, professional male voice
      case 'cheerful':
      case 'friendly':
        return 'echo'; // Warm, friendly male voice
      case 'calm':
        return 'fable'; // Gentle, storytelling voice
      default:
        return 'onyx';
    }
  }
  
  // Default fallback
  return 'nova';
}