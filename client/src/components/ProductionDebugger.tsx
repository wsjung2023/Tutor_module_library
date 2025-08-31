import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ProductionDebugger() {
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkSession = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/session', {
        credentials: 'include'
      });
      const data = await response.json();
      setSessionInfo(data);
    } catch (error) {
      console.error('Debug fetch error:', error);
      setSessionInfo({ error: error.message });
    }
    setLoading(false);
  };

  // Only show in development or when needed
  if (import.meta.env.PROD && !window.location.search.includes('debug=true')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg z-50 max-w-md">
      <h3 className="text-sm font-bold mb-2">Session Debugger</h3>
      <Button 
        onClick={checkSession} 
        disabled={loading}
        className="mb-2 text-xs"
      >
        {loading ? 'Checking...' : 'Check Session'}
      </Button>
      
      {sessionInfo && (
        <pre className="text-xs overflow-auto max-h-40 bg-gray-900 p-2 rounded">
          {JSON.stringify(sessionInfo, null, 2)}
        </pre>
      )}
    </div>
  );
}