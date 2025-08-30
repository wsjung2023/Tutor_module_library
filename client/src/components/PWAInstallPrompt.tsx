import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      }
    }
  };

  if (!showInstallPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Smartphone className="w-6 h-6" />
          <div>
            <p className="text-sm font-medium">앱으로 설치하기</p>
            <p className="text-xs opacity-90">홈 화면에 추가하여 빠르게 접근하세요</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            onClick={handleInstall}
            className="bg-white text-blue-600 hover:bg-gray-100 text-xs px-3 py-1"
          >
            설치
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowInstallPrompt(false)}
            className="text-white hover:bg-white/20 p-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}