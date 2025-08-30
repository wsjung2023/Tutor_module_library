# SB 모듈 사용 예시

## 1. 영어 학습 앱 (현재 프로젝트)

```typescript
// App.tsx
import { SBAuthProvider } from '@modules/sb_auth';
import { useSBTTS, useSBImageGeneration } from '@modules/sb_ai';
import { SBPricingPlans } from '@modules/sb_payment';

const authConfig = {
  googleClientId: process.env.GOOGLE_CLIENT_ID!,
  sessionSecret: process.env.SESSION_SECRET!,
  database: { url: process.env.DATABASE_URL!, type: 'postgresql' },
  redirectUrls: { success: '/', failure: '/auth' },
  appName: 'AI English Tutor'
};

function App() {
  return (
    <SBAuthProvider config={authConfig}>
      <EnglishTutorApp />
    </SBAuthProvider>
  );
}
```

## 2. 일본어 학습 앱 (새 프로젝트)

```typescript
// JapaneseTutorApp.tsx
import { SBAuthProvider } from '@modules/sb_auth';
import { useSBTTS, useSBImageGeneration } from '@modules/sb_ai';
import { SBPricingPlans, createDefaultPricingTiers } from '@modules/sb_payment';

const authConfig = {
  googleClientId: process.env.GOOGLE_CLIENT_ID!,
  sessionSecret: process.env.SESSION_SECRET!,
  database: { url: process.env.DATABASE_URL!, type: 'postgresql' },
  redirectUrls: { success: '/', failure: '/auth' },
  appName: 'AI Japanese Tutor'
};

const aiConfig = {
  openaiApiKey: process.env.OPENAI_API_KEY!,
  ttsModel: 'tts-1',
  imageGenerationModel: 'dall-e-3',
  chatModel: 'gpt-4o',
  appName: 'AI Japanese Tutor'
};

// 일본어 학습에 맞는 가격 플랜
const japanesePricingTiers = createDefaultPricingTiers('AI Japanese Tutor').map(tier => ({
  ...tier,
  features: tier.features.map(feature => 
    feature.replace('영어', '일본어').replace('English', 'Japanese')
  )
}));

function JapaneseTutorApp() {
  const { generateTTS } = useSBTTS(aiConfig);
  const { generateImage } = useSBImageGeneration(aiConfig);

  return (
    <SBAuthProvider config={authConfig}>
      <main>
        <SBPricingPlans 
          tiers={japanesePricingTiers}
          onSubscribe={handleSubscribe}
        />
        {/* 일본어 학습 컴포넌트들 */}
      </main>
    </SBAuthProvider>
  );
}
```

## 3. AI 소셜 네트워킹 앱

```typescript
// SocialApp.tsx
import { SBAuthProvider } from '@modules/sb_auth';
import { useSBImageGeneration } from '@modules/sb_ai';
import { SBPricingPlans } from '@modules/sb_payment';

const authConfig = {
  googleClientId: process.env.GOOGLE_CLIENT_ID!,
  sessionSecret: process.env.SESSION_SECRET!,
  database: { url: process.env.DATABASE_URL!, type: 'postgresql' },
  redirectUrls: { success: '/feed', failure: '/login' },
  appName: 'AI Social Network'
};

// 소셜 앱에 맞는 가격 플랜
const socialPricingTiers = [
  {
    id: 'free',
    name: '무료',
    price: 0,
    currency: 'KRW',
    features: ['일일 5개 포스트', '기본 AI 아바타', '친구 100명 제한'],
    usageLimit: { tier: 'free', dailyLimit: 5, monthlyLimit: 50, features: { aiGeneration: true, voiceSynthesis: false, characterGeneration: false, conversationHistory: true } }
  },
  {
    id: 'pro',
    name: '프로',
    price: 9900,
    currency: 'KRW',
    features: ['무제한 포스트', '커스텀 AI 아바타', '무제한 친구', '프리미엄 필터'],
    popular: true,
    usageLimit: { tier: 'pro', dailyLimit: -1, monthlyLimit: -1, features: { aiGeneration: true, voiceSynthesis: true, characterGeneration: true, conversationHistory: true } }
  }
];

function SocialApp() {
  const { generateImage } = useSBImageGeneration({
    openaiApiKey: process.env.OPENAI_API_KEY!,
    imageGenerationModel: 'dall-e-3',
    chatModel: 'gpt-4o',
    appName: 'AI Social Network'
  });

  return (
    <SBAuthProvider config={authConfig}>
      <SocialFeed />
      <SBPricingPlans 
        tiers={socialPricingTiers}
        onSubscribe={handleSocialSubscribe}
      />
    </SBAuthProvider>
  );
}
```

## 4. AI 전자상거래 앱

```typescript
// EcommerceApp.tsx
import { SBAuthProvider } from '@modules/sb_auth';
import { useSBImageGeneration } from '@modules/sb_ai';
import { SBPricingPlans } from '@modules/sb_payment';

const ecommercePricingTiers = [
  {
    id: 'basic',
    name: '기본',
    price: 29000,
    currency: 'KRW',
    features: ['상품 50개', '기본 AI 상품 이미지', '월 100건 주문'],
    usageLimit: { tier: 'basic', dailyLimit: 10, monthlyLimit: 100, features: { aiGeneration: true, voiceSynthesis: false, characterGeneration: false, conversationHistory: true } }
  },
  {
    id: 'premium',
    name: '프리미엄',
    price: 99000,
    currency: 'KRW',
    features: ['무제한 상품', '고품질 AI 이미지', '무제한 주문', 'AI 상품 설명'],
    popular: true,
    usageLimit: { tier: 'premium', dailyLimit: -1, monthlyLimit: -1, features: { aiGeneration: true, voiceSynthesis: true, characterGeneration: true, conversationHistory: true } }
  }
];

function EcommerceApp() {
  return (
    <SBAuthProvider config={authConfig}>
      <ProductCatalog />
      <SBPricingPlans 
        tiers={ecommercePricingTiers}
        onSubscribe={handleEcommerceSubscribe}
      />
    </SBAuthProvider>
  );
}
```

## 5. 빠른 시작 템플릿

```typescript
// QuickStartTemplate.tsx - 새 프로젝트용
import { SBAuthProvider, useSBAuth } from '@modules/sb_auth';
import { useSBTTS, useSBImageGeneration } from '@modules/sb_ai';
import { SBPricingPlans, createDefaultPricingTiers } from '@modules/sb_payment';

// 1. 설정
const config = {
  auth: {
    googleClientId: process.env.GOOGLE_CLIENT_ID!,
    sessionSecret: process.env.SESSION_SECRET!,
    database: { url: process.env.DATABASE_URL!, type: 'postgresql' },
    redirectUrls: { success: '/', failure: '/auth' },
    appName: 'Your App Name'
  },
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY!,
    ttsModel: 'tts-1',
    imageGenerationModel: 'dall-e-3',
    chatModel: 'gpt-4o',
    appName: 'Your App Name'
  }
};

// 2. 메인 앱
function QuickStartApp() {
  const { user, login, logout } = useSBAuth();
  const { generateTTS } = useSBTTS(config.ai);
  const { generateImage } = useSBImageGeneration(config.ai);

  const pricingTiers = createDefaultPricingTiers('Your App Name');

  return (
    <div>
      {user ? (
        <div>
          <h1>Welcome, {user.firstName}!</h1>
          <button onClick={logout}>Logout</button>
          {/* 여기에 앱 기능 추가 */}
        </div>
      ) : (
        <div>
          <h1>Please login</h1>
          {/* 로그인 폼 */}
        </div>
      )}
      
      <SBPricingPlans 
        tiers={pricingTiers}
        onSubscribe={handleSubscribe}
      />
    </div>
  );
}

// 3. 앱 래퍼
function App() {
  return (
    <SBAuthProvider config={config.auth}>
      <QuickStartApp />
    </SBAuthProvider>
  );
}

export default App;
```

## 개발 가이드

### 1. 새 프로젝트 설정
1. SB 모듈 폴더를 새 프로젝트에 복사
2. 필요한 모듈만 import
3. 환경 변수 설정
4. 컴포넌트 래핑

### 2. 모듈 커스터마이징
```typescript
// 가격 플랜 커스터마이징
const customTiers = createDefaultPricingTiers('Your App').map(tier => ({
  ...tier,
  features: [...tier.features, '추가 기능'],
  price: tier.price * 1.2 // 20% 할증
}));

// AI 설정 커스터마이징
const customAIConfig = {
  ...defaultAIConfig,
  chatModel: 'gpt-4',
  fallbackTTS: true
};
```