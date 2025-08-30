// Payment Types
export interface PaymentConfig {
  paddleVendorId?: string;
  paddleApiKey?: string;
  environment: 'sandbox' | 'production';
  currency: 'USD' | 'KRW' | 'EUR';
}

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  popular?: boolean;
  paddleProductId?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  tier: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
}

export interface PaymentResult {
  success: boolean;
  subscriptionId?: string;
  error?: string;
}

export interface UsageLimit {
  tier: string;
  dailyLimit: number;
  monthlyLimit: number;
  features: {
    aiGeneration: boolean;
    voiceSynthesis: boolean;
    characterGeneration: boolean;
    conversationHistory: boolean;
  };
}