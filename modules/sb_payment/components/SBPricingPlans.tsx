import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SBPricingTier } from '../types/payment';

interface SBPricingPlansProps {
  tiers: SBPricingTier[];
  currentTier?: string;
  onSubscribe: (tierId: string) => Promise<void>;
  loading?: boolean;
  currency?: string;
}

export function SBPricingPlans({ 
  tiers, 
  currentTier, 
  onSubscribe, 
  loading = false,
  currency = 'KRW'
}: SBPricingPlansProps) {
  const formatPrice = (price: number, currency: string) => {
    if (currency === 'KRW') {
      return `₩${price.toLocaleString()}`;
    }
    return `$${price}`;
  };

  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {tiers.map((tier) => (
        <Card 
          key={tier.id}
          className={`relative ${tier.popular ? 'border-blue-500 shadow-lg' : ''}`}
        >
          {tier.popular && (
            <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">
              인기
            </Badge>
          )}
          
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{tier.name}</CardTitle>
            <div className="text-3xl font-bold">
              {formatPrice(tier.price, tier.currency)}
              <span className="text-sm font-normal text-gray-500">/월</span>
            </div>
          </CardHeader>
          
          <CardContent>
            <ul className="space-y-2 mb-6">
              {tier.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <i className="fas fa-check text-green-500 text-sm"></i>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            
            <Button 
              onClick={() => onSubscribe(tier.id)}
              disabled={loading || currentTier === tier.id}
              className="w-full"
              variant={tier.popular ? 'default' : 'outline'}
            >
              {currentTier === tier.id ? '현재 플랜' : '구독하기'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}