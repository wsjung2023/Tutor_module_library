// Production error logging utility
export function logProductionError(error: any, context: string) {
  if (import.meta.env.PROD) {
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message || String(error),
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        stack: error.stack,
        context
      })
    }).catch(console.warn);
  }
}

// Global error handler for unhandled errors
window.addEventListener('error', (event) => {
  logProductionError(event.error, 'Global error handler');
});

window.addEventListener('unhandledrejection', (event) => {
  logProductionError(event.reason, 'Unhandled promise rejection');
});