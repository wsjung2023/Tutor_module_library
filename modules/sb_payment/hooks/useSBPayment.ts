import { useState, useCallback } from 'react';
import { SBPaymentConfig, SBPaymentResult, SBSubscription } from '../types/payment';

interface UseSBPaymentReturn {
  initiatePayment: (tierId: string) => Promise<SBPaymentResult>;
  loading: boolean;
  error: string | null;
  subscription: SBSubscription | null;
  checkSubscriptionStatus: () => Promise<void>;
}

export function useSBPayment(config: SBPaymentConfig): UseSBPaymentReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SBSubscription | null>(null);

  const initiatePayment = useCallback(async (tierId: string): Promise<SBPaymentResult> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tierId,
          config,
        }),
      });

      if (!response.ok) {
        throw new Error('Payment initiation failed');
      }

      const result = await response.json();
      
      // 결제 성공 시 구독 상태 업데이트
      if (result.success) {
        await checkSubscriptionStatus();
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [config]);

  const checkSubscriptionStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/payment/subscription');
      if (response.ok) {
        const subscriptionData = await response.json();
        setSubscription(subscriptionData);
      }
    } catch (err) {
      console.error('Failed to check subscription status:', err);
    }
  }, []);

  return {
    initiatePayment,
    loading,
    error,
    subscription,
    checkSubscriptionStatus,
  };
}