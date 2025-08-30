# SB 모듈 배포 가이드

## GitHub Repository 백업 설정

### 1. GitHub Repository 생성
```bash
# GitHub에서 새 repository 생성 후
git init
git add .
git commit -m "Initial commit: SB Modules with AI English Tutor"
git branch -M main
git remote add origin https://github.com/yourusername/sb-modules.git
git push -u origin main
```

### 2. 모듈별 분리 (선택사항)
```bash
# 각 모듈을 별도 repository로 관리하려면
git subtree push --prefix=modules/sb_payment origin sb-payment
git subtree push --prefix=modules/sb_auth origin sb-auth
git subtree push --prefix=modules/sb_ai origin sb-ai
```

## 모듈 사용을 위한 프로젝트 설정

### 1. 새 프로젝트에서 모듈 사용
```bash
# 방법 1: Git Submodule
git submodule add https://github.com/yourusername/sb-modules.git modules

# 방법 2: 직접 복사
cp -r /path/to/sb-modules/modules ./modules
```

### 2. 타입스크립트 설정
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@modules/*": ["./modules/*"]
    }
  }
}
```

### 3. Vite 설정 (React 프로젝트)
```typescript
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@modules': path.resolve(__dirname, 'modules')
    }
  }
});
```

## 환경 변수 템플릿

### .env 파일 설정
```env
# 필수: 데이터베이스
DATABASE_URL=your_postgresql_url

# sb_auth 모듈
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_random_session_secret

# sb_ai 모듈
OPENAI_API_KEY=your_openai_api_key
SUPERTONE_API_KEY=your_supertone_api_key

# sb_payment 모듈
PADDLE_VENDOR_ID=your_paddle_vendor_id
PADDLE_API_KEY=your_paddle_api_key

# 앱별 설정
VITE_APP_NAME=Your App Name
VITE_GOOGLE_CLIENT_ID=your_google_client_id_for_frontend
```

## 배포 체크리스트

### 개발 환경
- [ ] 모든 모듈이 올바르게 import되는지 확인
- [ ] 환경 변수가 모두 설정되었는지 확인
- [ ] TypeScript 에러가 없는지 확인
- [ ] API 엔드포인트가 작동하는지 확인

### 프로덕션 배포
- [ ] 환경 변수가 프로덕션 값으로 설정됨
- [ ] Google OAuth 리다이렉트 URL 업데이트
- [ ] Paddle webhook URL 설정
- [ ] 데이터베이스 마이그레이션 실행
- [ ] SSL 인증서 확인

### 보안 설정
- [ ] API 키들이 안전하게 저장됨
- [ ] 세션 시크릿이 강력함
- [ ] CORS 설정이 올바름
- [ ] CSP 헤더 설정

## 모듈 업데이트 가이드

### 1. 기존 프로젝트에서 모듈 업데이트
```bash
# Git submodule 사용 시
git submodule update --remote

# 직접 복사 사용 시
rsync -av --delete /path/to/updated-modules/ ./modules/
```

### 2. 호환성 확인
```typescript
// 모듈 버전 확인
import { SB_MODULE_VERSION } from '@modules/sb_payment';
console.log('Payment module version:', SB_MODULE_VERSION);
```

## 모니터링 및 로깅

### 1. 에러 추적 설정
```typescript
// 각 모듈에서 에러 리포팅
import { reportError } from '@modules/sb_monitoring';

try {
  await generateTTS(request);
} catch (error) {
  reportError('TTS_GENERATION_FAILED', error);
  throw error;
}
```

### 2. 사용량 모니터링
```typescript
// API 사용량 추적
import { trackUsage } from '@modules/sb_analytics';

trackUsage('image_generation', userId, {
  model: 'dall-e-3',
  timestamp: new Date()
});
```

## 백업 및 복구

### 1. 코드 백업
```bash
# 정기적인 백업
git add .
git commit -m "Backup: $(date)"
git push origin main
```

### 2. 데이터베이스 백업
```bash
# PostgreSQL 백업
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### 3. 환경 설정 백업
```bash
# 환경 변수 템플릿 생성 (실제 값 제외)
cp .env .env.template
sed -i 's/=.*/=YOUR_VALUE_HERE/g' .env.template
```