import { SBCharacter, SBConversationContext } from '../types/ai';

// 캐릭터 프롬프트 생성
export const generateCharacterPrompt = (character: SBCharacter, scenario: string): string => {
  return `You are ${character.name}, a ${character.gender} character with a ${character.personality} personality. 
Background: ${character.background || 'No specific background provided'}
Scenario: ${scenario}

Please respond naturally as this character would, maintaining consistency with their personality and background.
Keep responses conversational and engaging for English learning purposes.`;
};

// 이미지 생성 프롬프트 최적화
export const optimizeImagePrompt = (character: SBCharacter): string => {
  const basePrompt = `Professional portrait of a ${character.gender} person, ${character.description || 'friendly appearance'}`;
  
  const styleAdditions = {
    cheerful: 'bright smile, welcoming expression, warm lighting',
    calm: 'serene expression, soft lighting, peaceful demeanor',
    strict: 'professional appearance, serious expression, formal attire'
  };
  
  const cameraSettings = 'shot with Canon EOS R5, 85mm lens, shallow depth of field, studio lighting, high resolution';
  
  return `${basePrompt}, ${styleAdditions[character.personality] || styleAdditions.cheerful}, ${cameraSettings}, photorealistic, no anime or 3D render`;
};

// 음성 매핑
export const getVoiceForCharacter = (character: SBCharacter): string => {
  const voiceMap = {
    male: {
      cheerful: 'onyx',
      calm: 'echo',
      strict: 'fable'
    },
    female: {
      cheerful: 'nova',
      calm: 'shimmer',
      strict: 'alloy'
    }
  };
  
  return voiceMap[character.gender]?.[character.personality] || voiceMap.female.cheerful;
};

// 대화 컨텍스트 생성
export const createConversationContext = (
  character: SBCharacter, 
  scenario: string, 
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
): SBConversationContext => {
  return {
    character,
    scenario,
    language: 'en',
    difficulty
  };
};

// 발음 평가 시뮬레이션 (실제로는 외부 API 사용)
export const simulateAccuracyScore = (text: string): number => {
  // 간단한 시뮬레이션 로직 (실제로는 음성 인식 API 결과 사용)
  const baseScore = 85;
  const textComplexity = Math.min(text.length / 10, 10);
  const randomVariation = (Math.random() - 0.5) * 10;
  
  return Math.max(70, Math.min(98, baseScore - textComplexity + randomVariation));
};

// 학습 난이도별 문장 복잡도 조정
export const adjustComplexityForLevel = (text: string, difficulty: string): string => {
  const complexityMap = {
    beginner: 'Use simple words and short sentences.',
    intermediate: 'Use moderate vocabulary and sentence structure.',
    advanced: 'Use complex vocabulary and varied sentence structures.'
  };
  
  return complexityMap[difficulty] || complexityMap.intermediate;
};