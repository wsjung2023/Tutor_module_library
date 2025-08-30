import { SBPricingTier, SBUsageLimit } from '../types/payment';

// 기본 가격 플랜 템플릿
export const createDefaultPricingTiers = (appName: string): SBPricingTier[] => [
  {
    id: 'free',
    name: '무료',
    price: 0,
    currency: 'KRW',
    features: [
      '일일 3회 AI 대화',
      '기본 캐릭터 1개',
      '표준 음성 합성',
      '7일 대화 기록'
    ],
    usageLimit: {
      tier: 'free',
      dailyLimit: 3,
      monthlyLimit: 30,
      features: {
        aiGeneration: true,
        voiceSynthesis: true,
        characterGeneration: false,
        conversationHistory: true,
      }
    }
  },
  {
    id: 'starter',
    name: '스타터',
    price: 4900,
    currency: 'KRW',
    features: [
      '일일 20회 AI 대화',
      '커스텀 캐릭터 5개',
      '프리미엄 음성 합성',
      '30일 대화 기록',
      '우선 지원'
    ],
    popular: true,
    usageLimit: {
      tier: 'starter',
      dailyLimit: 20,
      monthlyLimit: 200,
      features: {
        aiGeneration: true,
        voiceSynthesis: true,
        characterGeneration: true,
        conversationHistory: true,
      }
    }
  },
  {
    id: 'pro',
    name: '프로',
    price: 9900,
    currency: 'KRW',
    features: [
      '일일 50회 AI 대화',
      '무제한 커스텀 캐릭터',
      '고품질 음성 합성',
      '무제한 대화 기록',
      '고급 AI 모델',
      '24/7 지원'
    ],
    usageLimit: {
      tier: 'pro',
      dailyLimit: 50,
      monthlyLimit: 500,
      features: {
        aiGeneration: true,
        voiceSynthesis: true,
        characterGeneration: true,
        conversationHistory: true,
      }
    }
  },
  {
    id: 'premium',
    name: '프리미엄',
    price: 19900,
    currency: 'KRW',
    features: [
      '무제한 AI 대화',
      '모든 프리미엄 기능',
      '최고급 음성 합성',
      '완전한 데이터 내보내기',
      '화이트라벨 솔루션',
      '전용 지원팀'
    ],
    usageLimit: {
      tier: 'premium',
      dailyLimit: -1, // -1 means unlimited
      monthlyLimit: -1,
      features: {
        aiGeneration: true,
        voiceSynthesis: true,
        characterGeneration: true,
        conversationHistory: true,
      }
    }
  }
];

// 사용량 제한 확인
export const checkUsageLimit = (
  currentUsage: number,
  limit: SBUsageLimit,
  type: 'daily' | 'monthly'
): { canUse: boolean; remaining: number } => {
  const maxLimit = type === 'daily' ? limit.dailyLimit : limit.monthlyLimit;
  
  if (maxLimit === -1) {
    return { canUse: true, remaining: -1 };
  }
  
  const remaining = Math.max(0, maxLimit - currentUsage);
  return {
    canUse: remaining > 0,
    remaining
  };
};

// 기능 접근 권한 확인
export const hasFeatureAccess = (
  tier: string,
  feature: keyof SBUsageLimit['features'],
  tiers: SBPricingTier[]
): boolean => {
  const tierData = tiers.find(t => t.id === tier);
  if (!tierData) return false;
  
  return tierData.usageLimit.features[feature] || false;
};

// 업그레이드 추천
export const getUpgradeRecommendation = (
  currentTier: string,
  requiredFeature: keyof SBUsageLimit['features'],
  tiers: SBPricingTier[]
): SBPricingTier | null => {
  const currentTierData = tiers.find(t => t.id === currentTier);
  if (!currentTierData) return null;
  
  // 현재 티어에서 기능이 이미 사용 가능하면 null 반환
  if (currentTierData.usageLimit.features[requiredFeature]) {
    return null;
  }
  
  // 기능을 제공하는 가장 저렴한 티어 찾기
  const availableTiers = tiers
    .filter(t => t.usageLimit.features[requiredFeature])
    .sort((a, b) => a.price - b.price);
    
  return availableTiers[0] || null;
};