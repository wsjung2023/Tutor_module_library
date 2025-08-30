import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            🎭 AI English Tutor
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            드라마틱한 시나리오로 영어를 배우세요! AI 캐릭터와 실제 상황을 연습하며 자연스럽게 영어 실력을 향상시킬 수 있습니다.
          </p>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            size="lg"
            className="text-lg px-8 py-3"
            data-testid="button-login"
          >
            🚀 무료로 시작하기
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎬 실감나는 시나리오
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                비즈니스 미팅, 카페 주문, 여행 등 실제 상황을 바탕으로 한 드라마틱한 시나리오로 영어를 연습하세요.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎯 실시간 피드백
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                발음, 문법, 어휘를 실시간으로 분석하여 정확한 한국어 피드백을 제공합니다.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🤖 개성 있는 AI 캐릭터
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                다양한 성격과 배경을 가진 AI 캐릭터들과 자연스러운 대화를 나누며 영어를 배우세요.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Pricing */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            요금제
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>무료 플랜</CardTitle>
                <CardDescription className="text-2xl font-bold">₩0/월</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✅ 일일 3회 대화 세션</li>
                  <li>✅ 기본 시나리오 제공</li>
                  <li>✅ 발음 피드백</li>
                  <li>❌ 캐릭터 1개 제한</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-500 shadow-lg">
              <CardHeader>
                <CardTitle>프리미엄 플랜</CardTitle>
                <CardDescription className="text-2xl font-bold text-blue-600">₩9,900/월</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✅ 무제한 대화 세션</li>
                  <li>✅ 모든 시나리오 이용</li>
                  <li>✅ 캐릭터 무제한 생성</li>
                  <li>✅ 상세 학습 리포트</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-purple-500">
              <CardHeader>
                <CardTitle>프로 플랜</CardTitle>
                <CardDescription className="text-2xl font-bold text-purple-600">₩19,900/월</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✅ 프리미엄 모든 기능</li>
                  <li>✅ 개인 맞춤 시나리오</li>
                  <li>✅ 1:1 튜터링 예약</li>
                  <li>✅ API 액세스</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            지금 바로 시작하여 영어 실력을 한 단계 업그레이드하세요! 🌟
          </p>
        </div>
      </div>
    </div>
  );
}