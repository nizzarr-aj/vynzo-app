import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

function showStartupError(detail) {
  const root = document.getElementById('root');
  if (!root) return;
  let panel = document.getElementById('boot-error');
  if (!panel) {
    panel = document.createElement('section');
    panel.id = 'boot-error';
    panel.style.cssText = 'position:fixed;z-index:99999;inset:12px;overflow:auto;background:#171827;color:#fff;border:1px solid #8b6bce;border-radius:18px;padding:24px;font:15px/1.8 Tahoma,Arial,sans-serif;direction:rtl;';
    document.body.appendChild(panel);
  }
  panel.innerHTML = '<h2 style="color:#c4adff">VYNZO — صار خطأ في تشغيل الواجهة</h2><p>ابعثلي التصويرة هاذي باش نصلّح السبب.</p><pre style="white-space:pre-wrap;overflow-wrap:anywhere;direction:ltr;text-align:left;color:#ffd9d9"></pre><button id="boot-reload" style="padding:12px 18px;border:0;border-radius:10px;background:#c4adff;color:#171323;font-weight:bold">عاود حمّل الصفحة</button>';
  panel.querySelector('pre').textContent = String(detail || 'Unknown startup error');
  panel.querySelector('#boot-reload').onclick = () => window.location.reload();
}

window.addEventListener('error', (event) => showStartupError(event.message || event.error || 'JavaScript error'));
window.addEventListener('unhandledrejection', (event) => showStartupError(event.reason?.message || event.reason || 'Unhandled promise rejection'));

try {
  const element = document.getElementById('root');
  if (!element) throw new Error('Missing #root element in index.html');
  createRoot(element).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  window.setTimeout(() => {
    const status = document.getElementById('boot-status');
    if (status) {
      const message = status.querySelector('p');
      if (message) message.textContent = 'التطبيق ما كملش التشغيل. عاود حمّل الصفحة؛ وإذا استمرت المشكلة ابعثلي تصويرة.';
    }
  }, 8000);
} catch (error) {
  showStartupError(error?.stack || error?.message || error);
}
