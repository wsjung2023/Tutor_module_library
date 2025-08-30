# 모듈화/API화 계획서

## 목적
- 재사용 가능한 모듈 생성으로 빠른 앱 개발
- 각 모듈을 조합하여 새로운 앱 생성
- 코드 중복 최소화 및 개발 효율성 극대화

## 1. 결제 프로세스 모듈 (Payment Module)
**파일 위치**: `modules/payment/`
- `PaddlePaymentProvider.tsx` - Paddle 결제 통합
- `SubscriptionManager.ts` - 구독 관리 로직  
- `PricingPlans.tsx` - 가격 플랜 컴포넌트
- `PaymentAPI.ts` - 결제 API 엔드포인트
- `types.ts` - 결제 관련 타입 정의

**재사용 방법**: 
```typescript
import { PaddlePaymentProvider, PricingPlans } from '@modules/payment'
```

## 2. 인증 모듈 (Auth Module)
**파일 위치**: `modules/auth/`
- `GoogleAuthProvider.tsx` - 구글 로그인
- `EmailPasswordAuth.tsx` - 이메일/비밀번호 로그인
- `AuthAPI.ts` - 인증 API 엔드포인트
- `AuthContext.tsx` - 인증 상태 관리
- `ProtectedRoute.tsx` - 라우트 보호
- `types.ts` - 인증 관련 타입

**재사용 방법**:
```typescript
import { GoogleAuthProvider, AuthContext } from '@modules/auth'
```

## 3. AI 모듈 (AI Module)
**파일 위치**: `modules/ai/`
- `TTSProvider.tsx` - 음성 합성 (OpenAI, Supertone, 브라우저 TTS)
- `ImageGenerator.ts` - DALL-E 이미지 생성
- `ConversationManager.ts` - AI 대화 관리
- `CharacterGenerator.ts` - AI 캐릭터 생성
- `AIAPI.ts` - AI 관련 API 엔드포인트
- `types.ts` - AI 관련 타입

**재사용 방법**:
```typescript
import { TTSProvider, ImageGenerator, ConversationManager } from '@modules/ai'
```

## 4. UI 컴포넌트 모듈 (UI Module)
**파일 위치**: `modules/ui/`
- `ResponsiveNavigation.tsx` - 반응형 네비게이션
- `ThemeProvider.tsx` - 다크/라이트 테마
- `LoadingStates.tsx` - 로딩 상태 컴포넌트
- `ErrorHandling.tsx` - 에러 처리 컴포넌트
- `FormComponents.tsx` - 재사용 가능한 폼 컴포넌트

## 5. 데이터베이스 모듈 (Database Module)
**파일 위치**: `modules/database/`
- `PostgresProvider.ts` - PostgreSQL 연결
- `UserRepository.ts` - 사용자 데이터 CRUD
- `SessionRepository.ts` - 세션 관리
- `migrations/` - 데이터베이스 마이그레이션

## 6. 알림 모듈 (Notification Module)
**파일 위치**: `modules/notification/`
- `ToastProvider.tsx` - 토스트 알림
- `EmailNotification.ts` - 이메일 알림
- `PushNotification.ts` - 푸시 알림

## 추가 API화 가능 모듈들

### 7. 파일 업로드 모듈
- 이미지/파일 업로드
- 클라우드 스토리지 연동
- 파일 처리 및 최적화

### 8. 실시간 통신 모듈
- WebSocket 연결
- 실시간 채팅
- 라이브 업데이트

### 9. 분석/모니터링 모듈
- 사용자 행동 분석
- 성능 모니터링
- 에러 트래킹

### 10. 다국어 모듈
- i18n 국제화
- 언어 전환
- 지역화된 콘텐츠

## 구현 순서 (진행중)
1. ✅ **sb_payment** 모듈 (결제 시스템) - 완료
2. ✅ **sb_auth** 모듈 (인증 시스템) - 완료  
3. ✅ **sb_ai** 모듈 (AI 기능) - 진행중
4. **sb_ui** 모듈 (공통 UI 컴포넌트)
5. **sb_database** 모듈 (데이터베이스 연동)

## 모듈 구조 예시
```
modules/
├── payment/
│   ├── index.ts (export all)
│   ├── components/
│   ├── hooks/
│   ├── types/
│   ├── api/
│   └── utils/
├── auth/
│   ├── index.ts
│   └── ...
└── ai/
    ├── index.ts
    └── ...
```

## 사용 예시
```typescript
// 새 앱에서 모듈 사용
import { PaddlePaymentProvider } from '@modules/payment'
import { GoogleAuthProvider } from '@modules/auth'
import { TTSProvider } from '@modules/ai'

function NewApp() {
  return (
    <GoogleAuthProvider config={authConfig}>
      <PaddlePaymentProvider config={paymentConfig}>
        <TTSProvider config={ttsConfig}>
          <YourAppContent />
        </TTSProvider>
      </PaddlePaymentProvider>
    </GoogleAuthProvider>
  )
}
```