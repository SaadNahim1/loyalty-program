import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { logErrorToPersistentStore } from './utils/errorLogger';
import './index.css';

// Global error handlers to capture any uncaught script or promise failure
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logErrorToPersistentStore(
      event.error || event.message,
      undefined,
      'window_error'
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    logErrorToPersistentStore(
      event.reason || 'Unhandled Promise Rejection',
      undefined,
      'unhandled_rejection'
    );
  });
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
