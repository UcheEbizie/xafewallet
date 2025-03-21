import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { pdfjs } from 'react-pdf';
import App from './App.tsx';
import './index.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);