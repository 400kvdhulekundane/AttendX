import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

window.onerror = function(msg, src, line, col, err) {
  document.body.innerHTML = `<pre style="color:red;padding:20px;font-size:12px;white-space:pre-wrap;">${msg}\n${src}:${line}\n${err?.stack}</pre>`;
};

window.onunhandledrejection = function(e) {
  document.body.innerHTML = `<pre style="color:red;padding:20px;font-size:12px;white-space:pre-wrap;">Unhandled Promise:\n${e.reason}</pre>`;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);