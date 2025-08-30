import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/hooks/useAuth";

import { DebugPanel } from "@/components/debug-panel";

import NavigationHeader from "@/components/navigation-header";
import LoadingModal from "@/components/loading-modal";
import ErrorModal from "@/components/error-modal";

import Auth from "@/pages/Auth";
import Landing from "@/pages/Landing";
import UserHome from "@/pages/Home";
import Subscription from "@/pages/Subscription";
import Character from "@/pages/character";
import Scenario from "@/pages/scenario";
import Playground from "@/pages/playground";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const { currentPage } = useAppStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  // Show landing page or auth page if not authenticated
  if (!isAuthenticated) {
    if (currentPage === 'auth') {
      return <Auth />;
    }
    return <Landing />;
  }

  // Show subscription page if accessing subscription route
  if (currentPage === 'subscription') {
    return <Subscription />;
  }

  // Show user home page if accessing user home route
  if (currentPage === 'user-home') {
    return <UserHome />;
  }

  // Original app routing for authenticated users
  switch (currentPage) {
    case 'home':
      return <UserHome />;
    case 'character':
      return <Character />;
    case 'scenario':
      return <Scenario />;
    case 'playground':
      return <Playground />;
    default:
      return <UserHome />;
  }
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        {isAuthenticated && <NavigationHeader />}
        <main className={isAuthenticated ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" : ""}>
          <Router />
        </main>
      </div>
      <LoadingModal />
      <ErrorModal />
      <Toaster />
      <DebugPanel />
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
