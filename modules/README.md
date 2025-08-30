# SocialBeing (SB) 모듈 컬렉션

## 개요
SocialBeing 모듈은 재사용 가능한 컴포넌트들로 구성되어 빠른 앱 개발을 가능하게 합니다.

## 사용 가능한 모듈

### 1. sb_payment (결제 모듈)
- **기능**: Paddle 결제 시스템, 구독 관리, 사용량 제한
- **주요 컴포넌트**: 
  - `SBPricingPlans` - 가격 플랜 표시
  - `useSBPayment` - 결제 훅
- **사용법**:
```typescript
import { SBPricingPlans, useSBPayment } from '@modules/sb_payment';

const paymentConfig = {
  paddleVendorId: 'your-vendor-id',
  environment: 'production',
  currency: 'KRW',
  appName: 'Your App'
};

function PaymentPage() {
  const { initiatePayment } = useSBPayment(paymentConfig);
  return <SBPricingPlans onSubscribe={initiatePayment} />;
}
```

### 2. sb_auth (인증 모듈)
- **기능**: 이메일/비밀번호 로그인, 구글 로그인, 세션 관리
- **주요 컴포넌트**:
  - `SBAuthProvider` - 인증 상태 관리
  - `useSBAuth` - 인증 훅
- **사용법**:
```typescript
import { SBAuthProvider, useSBAuth } from '@modules/sb_auth';

const authConfig = {
  googleClientId: 'your-client-id',
  sessionSecret: 'your-secret',
  database: { url: 'your-db-url', type: 'postgresql' },
  redirectUrls: { success: '/', failure: '/login' },
  appName: 'Your App'
};

function App() {
  return (
    <SBAuthProvider config={authConfig}>
      <YourAppContent />
    </SBAuthProvider>
  );
}
```

### 3. sb_ai (AI 모듈)
- **기능**: TTS, 이미지 생성, AI 대화, 캐릭터 생성
- **주요 컴포넌트**:
  - `useSBTTS` - 음성 합성 훅
  - `useSBImageGeneration` - 이미지 생성 훅
  - AI 헬퍼 함수들
- **사용법**:
```typescript
import { useSBTTS, useSBImageGeneration } from '@modules/sb_ai';

const aiConfig = {
  openaiApiKey: 'your-api-key',
  ttsModel: 'tts-1',
  imageGenerationModel: 'dall-e-3',
  chatModel: 'gpt-4o',
  appName: 'Your App'
};

function AIFeatures() {
  const { generateTTS } = useSBTTS(aiConfig);
  const { generateImage } = useSBImageGeneration(aiConfig);
  
  // 사용 예시
}
```

## 빠른 시작

### 1. 새 앱에 모듈 통합
```typescript
import { SBAuthProvider } from '@modules/sb_auth';
import { SBPricingPlans } from '@modules/sb_payment';
import { useSBTTS } from '@modules/sb_ai';

function NewApp() {
  return (
    <SBAuthProvider config={authConfig}>
      {/* 앱 내용 */}
    </SBAuthProvider>
  );
}
```

### 2. 모듈 조합 예시
```typescript
// 학습 앱
import { SBAuthProvider } from '@modules/sb_auth';
import { useSBTTS, useSBImageGeneration } from '@modules/sb_ai';
import { SBPricingPlans } from '@modules/sb_payment';

// 소셜 앱
import { SBAuthProvider } from '@modules/sb_auth';
import { useSBImageGeneration } from '@modules/sb_ai';

// 전자상거래 앱
import { SBAuthProvider } from '@modules/sb_auth';
import { SBPricingPlans } from '@modules/sb_payment';
```

## 설정 가이드

### 환경 변수
```env
# sb_auth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_session_secret

# sb_ai
OPENAI_API_KEY=your_openai_api_key
SUPERTONE_API_KEY=your_supertone_api_key

# sb_payment
PADDLE_VENDOR_ID=your_paddle_vendor_id
PADDLE_API_KEY=your_paddle_api_key
```

## 모듈 확장

각 모듈은 확장 가능하도록 설계되었습니다:
- 새로운 인증 제공자 추가
- 새로운 결제 게이트웨이 통합
- AI 모델 및 서비스 추가

## 지원

각 모듈의 상세한 문서는 해당 모듈 폴더의 README.md를 참조하세요.