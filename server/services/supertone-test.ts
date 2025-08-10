// Quick test to get available voice IDs from Supertone API
export async function getSupertoneVoices() {
  const supertoneApiKey = process.env.SUPERTONE_API_KEY;
  
  if (!supertoneApiKey) {
    throw new Error("Supertone API key not configured");
  }

  try {
    const response = await fetch('https://supertoneapi.com/v1/voices?page_size=10', {
      method: 'GET',
      headers: {
        'x-sup-api-key': supertoneApiKey
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supertone API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Available voices:', JSON.stringify(data, null, 2));
    
    // Extract first few voice IDs
    if (data.items && data.items.length > 0) {
      const voiceIds = data.items.slice(0, 5).map((voice: any) => ({
        id: voice.voice_id,
        name: voice.name,
        gender: voice.gender,
        language: voice.language,
        styles: voice.styles
      }));
      console.log('Voice IDs to use:', voiceIds);
      return voiceIds;
    }
    
    return [];
  } catch (error) {
    console.error("Failed to get voices:", error);
    throw error;
  }
}