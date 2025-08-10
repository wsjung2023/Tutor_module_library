import type { TTSRequest } from "@shared/schema";

// Supertone voice mapping for English learning
const VOICE_MAP = {
  'female_friendly': 'en-US-jenny',     // Friendly female voice
  'male_calm': 'en-US-davis',           // Calm male voice  
  'business_formal': 'en-US-sara',      // Professional female voice
  'female_cheerful': 'en-US-aria'       // Cheerful female voice
};

export async function generateTTS(request: TTSRequest): Promise<{ audioUrl: string }> {
  const { text, voiceId } = request;
  
  const supertoneApiKey = process.env.SUPERTONE_API_KEY;
  
  if (!supertoneApiKey) {
    throw new Error("Supertone API key not configured");
  }

  // Map custom voice ID to Supertone voice ID
  const supertoneVoiceId = VOICE_MAP[voiceId as keyof typeof VOICE_MAP] || VOICE_MAP.female_friendly;

  try {
    const response = await fetch('https://api.supertone.ai/v1/tts', {
      method: 'POST',
      headers: {
        'Accept': 'audio/wav',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supertoneApiKey}`
      },
      body: JSON.stringify({
        text: text,
        voice: supertoneVoiceId,
        format: 'wav',
        sample_rate: 22050,
        speed: 1.0,
        pitch: 1.0,
        volume: 1.0
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supertone API error: ${response.status} - ${errorText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    
    // Convert to base64 for transmission
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    const audioUrl = `data:audio/wav;base64,${audioBase64}`;
    
    return { audioUrl };
  } catch (error) {
    console.error("Supertone TTS generation failed:", error);
    throw new Error(`TTS generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
