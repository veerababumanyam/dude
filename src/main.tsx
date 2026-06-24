import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-neutral-50 p-6 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-100">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Something went wrong</h2>
        <p className="text-sm text-neutral-500 mb-6 bg-neutral-50 p-3 rounded-lg overflow-auto max-h-32 font-mono">
          {error.message}
        </p>
        <button
          onClick={resetErrorBoundary}
          className="w-full py-3 px-4 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/25"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <App />
      <Toaster position="top-center" richColors />
    </ErrorBoundary>
  </StrictMode>,
);
