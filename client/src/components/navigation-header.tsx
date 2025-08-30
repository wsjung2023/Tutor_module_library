import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function NavigationHeader() {
  const { currentPage, setCurrentPage, resetState, audience, character } = useAppStore();
  const { user } = useAuth();

  const handleLogoClick = () => {
    resetState();
    setCurrentPage('home');
  };

  const isActive = (page: string) => currentPage === page;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <button onClick={handleLogoClick} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-graduation-cap text-white text-sm"></i>
            </div>
            <h1 className="text-xl font-poppins font-semibold text-gray-900">AI English Tutor</h1>
          </button>

          <nav className="flex items-center space-x-4">
            <button 
              onClick={() => setCurrentPage('user-home')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('user-home') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              data-testid="nav-user-home"
            >
              <i className="fas fa-home mr-1"></i> 홈
            </button>
            
            <button 
              onClick={() => setCurrentPage('home')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('home') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              data-testid="nav-audience"
            >
              <i className="fas fa-users mr-1"></i> 학습
            </button>
            
            <button 
              onClick={() => setCurrentPage('character')}
              disabled={!audience}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('character') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed'
              }`}
              data-testid="nav-character"
            >
              <i className="fas fa-user mr-1"></i> 캐릭터
            </button>

            <button 
              onClick={() => setCurrentPage('subscription')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                isActive('subscription') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              data-testid="nav-subscription"
            >
              <i className="fas fa-crown mr-1"></i> 구독
              {user?.subscriptionTier === 'premium' && <Badge className="bg-blue-500 text-xs">프리미엄</Badge>}
              {user?.subscriptionTier === 'pro' && <Badge className="bg-purple-500 text-xs">프로</Badge>}
            </button>

            <Button 
              onClick={() => setCurrentPage('playground')}
              disabled={!character.name}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              data-testid="nav-start-learning"
            >
              <i className="fas fa-play mr-1"></i> 학습 시작
            </Button>

            <Button 
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/api/logout'}
              data-testid="nav-logout"
            >
              로그아웃
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
