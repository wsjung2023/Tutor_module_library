# Google OAuth 설정 가이드

## Google Cloud Console에 추가해야 할 리디렉션 URI

**개발 환경:**
```
https://931d55f5-3f55-44e6-89ae-37573a92ed86-00-3gwxisvip8rvv.spock.replit.dev/api/google/callback
```

**배포 환경:**
```
https://fluent-drama-mainstop3.replit.app/api/google/callback
```

## 설정 방법

1. Google Cloud Console → API 및 서비스 → 사용자 인증 정보
2. OAuth 2.0 클라이언트 ID 클릭
3. "승인된 리디렉션 URI"에 위 두 URI 모두 추가
4. 저장

## 참고사항

- 개발 환경 URI는 Replit에서 자동 생성되는 동적 도메인
- 배포 환경 URI는 고정된 .replit.app 도메인  
- Google OAuth는 와일드카드를 허용하지 않으므로 정확한 URI를 등록해야 함