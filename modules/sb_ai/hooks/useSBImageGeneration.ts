import { useState, useCallback } from 'react';
import { SBImageGenerationRequest, SBImageGenerationResponse, SBAIConfig } from '../types/ai';

export function useSBImageGeneration(config: SBAIConfig) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateImage = useCallback(async (request: SBImageGenerationRequest): Promise<SBImageGenerationResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-image', {
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
        throw new Error('Image generation failed');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Image generation failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [config]);

  return {
    generateImage,
    loading,
    error,
  };
}