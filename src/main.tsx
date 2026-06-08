import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './lib/AuthContext';
import { ThemeProvider } from './components/theme-provider';
import { ErrorBoundary } from './components/ErrorBoundary';

console.log("Cognitive main.tsx is starting execution...");
try {
  const sub = document.getElementById('tfs-boot-substatus');
  if (sub) {
    sub.textContent = 'Initializing React app modules...';
    sub.style.color = '#10b981'; // green color indicator
  }
} catch (err) {
  console.error("Failed to update boot substatus", err);
}

const rootEl = document.getElementById('root');
if (!rootEl) {
  console.error("CRITICAL: root element not found in DOM!");
} else {
  console.log("Found root element, mounting React...");
}

import { NetworkService } from './services/networkService';

NetworkService.getInstance().initialize().then(() => {
  createRoot(rootEl!).render(
    <StrictMode>
      <ThemeProvider defaultTheme="system" storageKey="tera-flow-theme">
        <AuthProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </StrictMode>,
  );
});

