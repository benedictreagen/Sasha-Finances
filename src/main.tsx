import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

console.log('Sasha Finance production app loaded');

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Fatal: Failed to find root element #root in document');
} else {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
  } catch (renderError) {
    console.error('Fatal error during createRoot render:', renderError);
    rootElement.innerHTML = `
      <div style="min-height: 100vh; background: #191919; color: #ef4444; padding: 32px; font-family: system-ui, sans-serif;">
        <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">Fatal Mounting Error</h2>
        <p style="font-size: 13px; font-family: monospace; color: #fca5a5;">${String(renderError)}</p>
      </div>
    `;
  }
}
