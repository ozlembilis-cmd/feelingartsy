import '@fontsource-variable/inter-tight/wght.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/newsreader/400.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './immersive.css';
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
