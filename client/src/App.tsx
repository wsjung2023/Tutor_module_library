import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAppStore } from "@/store/useAppStore";

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

  // Render current page based on state
  const renderCurrentPage = () => {
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
  };

  return (
    <Switch>
      <Route path="/" component={() => renderCurrentPage()} />
      <Route path="/character" component={() => renderCurrentPage()} />
      <Route path="/scenario" component={() => renderCurrentPage()} />
      <Route path="/playground" component={() => renderCurrentPage()} />
      <Route component={NotFound} />
    </Switch>
  );
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
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
