import './polyfills';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { WalletContextProvider } from './components/WalletProvider.tsx';
import { ToastProvider } from './contexts/ToastContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <WalletContextProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </WalletContextProvider>
    </ErrorBoundary>
  </StrictMode>
);
