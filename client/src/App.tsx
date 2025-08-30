import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAppStore } from "@/store/useAppStore";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

import NavigationHeader from "@/components/navigation-header";
import LoadingModal from "@/components/loading-modal";
import ErrorModal from "@/components/error-modal";

import Home from "@/pages/home";
import Character from "@/pages/character";
import Scenario from "@/pages/scenario";
import Playground from "@/pages/playground";
import NotFound from "@/pages/not-found";

function Router() {
  const { currentPage } = useAppStore();

  // Direct component rendering based on currentPage state
  switch (currentPage) {
    case 'home':
      return <Home />;
    case 'character':
      return <Character />;
    case 'scenario':
      return <Scenario />;
    case 'playground':
      return <Playground />;
    default:
      return <Home />;
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50">
          <NavigationHeader />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Router />
          </main>
        </div>
        <LoadingModal />
        <ErrorModal />
        <PWAInstallPrompt />
        <Toaster />
        <PWAInstallPrompt />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

// Add PWA install prompt to the page
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    let deferredPrompt: any;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // Show install prompt after 3 seconds
      setTimeout(() => {
        const installDiv = document.createElement('div');
        installDiv.className = 'fixed bottom-4 left-4 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm mx-auto';
        installDiv.innerHTML = `
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-6 h-6">📱</div>
              <div>
                <p class="text-sm font-medium">앱으로 설치하기</p>
                <p class="text-xs opacity-90">홈 화면에 추가하여 빠르게 접근하세요</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button id="install-btn" class="bg-white text-blue-600 hover:bg-gray-100 text-xs px-3 py-1 rounded">설치</button>
              <button id="close-btn" class="text-white hover:bg-white/20 p-1 rounded">✕</button>
            </div>
          </div>
        `;
        
        document.body.appendChild(installDiv);
        
        document.getElementById('install-btn')?.addEventListener('click', async () => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
              installDiv.remove();
            }
            deferredPrompt = null;
          }
        });
        
        document.getElementById('close-btn')?.addEventListener('click', () => {
          installDiv.remove();
        });
      }, 3000);
    });
  });
}
