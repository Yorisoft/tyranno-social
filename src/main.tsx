import { createRoot } from 'react-dom/client';

// Import polyfills first
import './lib/polyfills.ts';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import App from './App.tsx';
import './index.css';

// Import handwriting fonts
import '@fontsource/caveat';
import '@fontsource/dancing-script';
import '@fontsource/pacifico';
import '@fontsource/kalam';
import '@fontsource/indie-flower';
import '@fontsource/permanent-marker';

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
