import type { TTSRequest } from "@shared/schema";

// ElevenLabs voice mapping
const VOICE_MAP = {
  'female_friendly': 'pNInz6obpgDQGcFmaJgB', // Default female voice
  'male_calm': '2EiwWnXFnvU5JabPnv8n',       // Default male voice  
  'business_formal': 'MF3mGyEYCl7XYWbV9V6O',  // Professional voice
  'female_cheerful': 'ThT5KcBeYPX3keUQqHPh'   // Cheerful female voice
};

export async function generateTTS(request: TTSRequest): Promise<{ audioUrl: string }> {
  const { text, voiceId } = request;
  
  const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY_ENV_VAR || "";
  
  if (!elevenLabsApiKey) {
    throw new Error("ElevenLabs API key not configured");
  }

  // Map custom voice ID to ElevenLabs voice ID
  const elevenLabsVoiceId = VOICE_MAP[voiceId as keyof typeof VOICE_MAP] || VOICE_MAP.female_friendly;

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    
    // Convert to base64 for transmission (in production, you'd save to file/cloud storage)
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;
    
    return { audioUrl };
  } catch (error) {
    console.error("ElevenLabs TTS generation failed:", error);
    throw new Error(`TTS generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
