import { useState, useCallback } from 'react';
import { SBTTSRequest, SBTTSResponse, SBAIConfig } from '../types/ai';

export function useSBTTS(config: SBAIConfig) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateTTS = useCallback(async (request: SBTTSRequest): Promise<SBTTSResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          config,
        }),
      });

      if (!response.ok) {
        throw new Error('TTS generation failed');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'TTS generation failed';
      setError(errorMessage);
      return { success: false, error: errorMessage, provider: 'browser' };
    } finally {
      setLoading(false);
    }
  }, [config]);

  return {
    generateTTS,
    loading,
    error,
  };
}