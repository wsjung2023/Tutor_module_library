import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/store/useAppStore';

export default function ModuleShowcase() {
  const { setCurrentPage } = useAppStore();
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  const modules = [
    {
      id: 'sb_payment',
      name: 'SB Payment Module',
      description: 'Complete payment and subscription management system',
      version: '1.0.0',
      features: [
        'Paddle Integration',
        'Subscription Management',
        'Usage Limits',
        'Korean Won Support',
        'Pricing Tiers'
      ],
      components: [
        'SBPricingPlans',
        'useSBPayment',
        'createDefaultPricingTiers',
        'checkUsageLimit'
      ],
      codeExample: `import { SBPricingPlans, useSBPayment } from '@modules/sb_payment';

const paymentConfig = {
  paddleVendorId: 'your-vendor-id',
  environment: 'production',
  currency: 'KRW',
  appName: 'Your App'
};

function PaymentPage() {
  const { initiatePayment } = useSBPayment(paymentConfig);
  return <SBPricingPlans onSubscribe={initiatePayment} />;
}`
    },
    {
      id: 'sb_auth',
      name: 'SB Auth Module',
      description: 'Authentication system with Google OAuth and email/password',
      version: '1.0.0',
      features: [
        'Google OAuth',
        'Email/Password Auth',
        'Session Management',
        'User Profile',
        'Protected Routes'
      ],
      components: [
        'SBAuthProvider',
        'useSBAuth',
        'SBGoogleAuth',
        'SBEmailPasswordAuth'
      ],
      codeExample: `import { SBAuthProvider, useSBAuth } from '@modules/sb_auth';

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
}`
    },
    {
      id: 'sb_ai',
      name: 'SB AI Module', 
      description: 'AI-powered features including TTS, image generation, and conversations',
      version: '1.0.0',
      features: [
        'OpenAI TTS Integration',
        'DALL-E Image Generation',
        'Character Creation',
        'Conversation Management',
        'Multi-tier Fallback'
      ],
      components: [
        'useSBTTS',
        'useSBImageGeneration',
        'generateCharacterPrompt',
        'optimizeImagePrompt'
      ],
      codeExample: `import { useSBTTS, useSBImageGeneration } from '@modules/sb_ai';

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
  
  // Use AI features
}`
    }
  ];

  const useCases = [
    {
      title: '영어 학습 앱',
      description: '현재 프로젝트 - AI 캐릭터와 대화하며 영어 학습',
      modules: ['sb_auth', 'sb_payment', 'sb_ai'],
      features: ['Google 로그인', '구독 결제', 'AI 대화', '음성 합성', '캐릭터 생성']
    },
    {
      title: '일본어 학습 앱',
      description: '동일한 모듈로 일본어 학습 앱 개발',
      modules: ['sb_auth', 'sb_payment', 'sb_ai'],
      features: ['동일한 인증', '커스텀 가격', '일본어 TTS', '일본 캐릭터']
    },
    {
      title: 'AI 소셜 네트워크',
      description: 'AI 아바타와 소셜 기능을 결합',
      modules: ['sb_auth', 'sb_payment', 'sb_ai'],
      features: ['소셜 로그인', '프리미엄 구독', 'AI 아바타', '이미지 생성']
    },
    {
      title: '전자상거래 플랫폼',
      description: 'AI로 상품 이미지와 설명 생성',
      modules: ['sb_auth', 'sb_payment', 'sb_ai'],
      features: ['판매자 인증', '수수료 결제', 'AI 상품 이미지', '자동 설명']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🏗️ SocialBeing Module Library
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            재사용 가능한 모듈 컬렉션으로 빠른 앱 개발을 실현하세요. 
            각 모듈은 독립적으로 사용하거나 조합하여 완전한 애플리케이션을 구축할 수 있습니다.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Button onClick={() => setCurrentPage('user-home')}>
              홈으로 돌아가기
            </Button>
            <Button variant="outline" onClick={() => window.open('https://github.com/your-repo/sb-modules', '_blank')}>
              GitHub에서 보기
            </Button>
          </div>
        </div>

        <Tabs defaultValue="modules" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="modules">모듈 라이브러리</TabsTrigger>
            <TabsTrigger value="examples">사용 예시</TabsTrigger>
            <TabsTrigger value="integration">통합 가이드</TabsTrigger>
          </TabsList>

          <TabsContent value="modules" className="space-y-8">
            <div className="grid md:grid-cols-1 lg:grid-cols-1 gap-8">
              {modules.map((module) => (
                <Card key={module.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-2xl flex items-center gap-2">
                          {module.name}
                          <Badge variant="outline">v{module.version}</Badge>
                        </CardTitle>
                        <p className="text-gray-600 mt-2">{module.description}</p>
                      </div>
                      <Button 
                        variant="outline"
                        onClick={() => setActiveDemo(activeDemo === module.id ? null : module.id)}
                      >
                        {activeDemo === module.id ? '코드 숨기기' : '코드 보기'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">주요 기능</h4>
                        <ul className="space-y-2">
                          {module.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <i className="fas fa-check text-green-500 text-sm"></i>
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">컴포넌트 & 훅</h4>
                        <div className="flex flex-wrap gap-2">
                          {module.components.map((component, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {component}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {activeDemo === module.id && (
                      <div className="mt-6">
                        <h4 className="font-semibold mb-3">사용 예시</h4>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{module.codeExample}</code>
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="examples" className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              {useCases.map((useCase, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{useCase.title}</CardTitle>
                    <p className="text-gray-600">{useCase.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">사용된 모듈</h4>
                        <div className="flex flex-wrap gap-2">
                          {useCase.modules.map((moduleName, idx) => (
                            <Badge key={idx} variant="default" className="text-xs">
                              {moduleName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">주요 기능</h4>
                        <ul className="space-y-1">
                          {useCase.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm">
                              <i className="fas fa-star text-yellow-500 text-xs"></i>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="integration" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>빠른 시작 가이드</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">1. 모듈 설치</h3>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <code>{`# 프로젝트에 SB 모듈 추가
cp -r /path/to/sb-modules/modules ./modules

# 또는 Git Submodule 사용
git submodule add https://github.com/your-repo/sb-modules.git modules`}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">2. 타입스크립트 설정</h3>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <code>{`// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@modules/*": ["./modules/*"]
    }
  }
}`}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">3. 환경 변수 설정</h3>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <code>{`# .env
DATABASE_URL=your_postgresql_url
GOOGLE_CLIENT_ID=your_google_client_id
OPENAI_API_KEY=your_openai_api_key
PADDLE_VENDOR_ID=your_paddle_vendor_id
SESSION_SECRET=your_session_secret`}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">4. 기본 앱 구조</h3>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <code>{`import { SBAuthProvider } from '@modules/sb_auth';
import { SBPricingPlans } from '@modules/sb_payment';

function App() {
  return (
    <SBAuthProvider config={authConfig}>
      <YourAppContent />
    </SBAuthProvider>
  );
}`}</code>
                  </pre>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">💡 팁</h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• 필요한 모듈만 import하여 번들 크기 최적화</li>
                    <li>• 각 모듈의 README.md에서 상세 가이드 확인</li>
                    <li>• 설정은 환경별로 분리하여 관리</li>
                    <li>• TypeScript 타입 안전성 활용</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>모듈 조합 예시</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">기본 웹앱</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>sb_auth</div>
                      <div>sb_payment</div>
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">AI 서비스</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>sb_auth</div>
                      <div>sb_payment</div>
                      <div>sb_ai</div>
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">완전한 플랫폼</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>모든 모듈</div>
                      <div>+ 커스텀 모듈</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}