import React from 'react';
import { SBPricingTier } from '../types/payment';

interface SBPricingPlansProps {
  tiers: SBPricingTier[];
  currentTier?: string;
  onSubscribe: (tierId: string) => Promise<void>;
  loading?: boolean;
  currency?: string;
}

export function SBPricingPlans(props: SBPricingPlansProps) {
  const { tiers, currentTier, onSubscribe, loading = false, currency = 'KRW' } = props;
  const formatPrice = (price: number, currency: string) => {
    if (currency === 'KRW') {
      return `₩${price.toLocaleString()}`;
    }
    return `$${price}`;
  };

  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {tiers.map((tier) => (
        <div 
          key={tier.id}
          className={`relative border rounded-lg p-6 ${tier.popular ? 'border-blue-500 shadow-lg' : 'border-gray-200'}`}
        >
          {tier.popular && (
            <span className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
              인기
            </span>
          )}
          
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold">{tier.name}</h3>
            <div className="text-3xl font-bold mt-2">
              {formatPrice(tier.price, tier.currency)}
              <span className="text-sm font-normal text-gray-500">/월</span>
            </div>
          </div>
          
          <div>
            <ul className="space-y-2 mb-6">
              {tier.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            
            <button 
              onClick={() => onSubscribe(tier.id)}
              disabled={loading || currentTier === tier.id}
              className={`w-full py-2 px-4 rounded transition-colors ${
                tier.popular 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'border border-gray-300 hover:bg-gray-50'
              } ${loading || currentTier === tier.id ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {currentTier === tier.id ? '현재 플랜' : '구독하기'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}