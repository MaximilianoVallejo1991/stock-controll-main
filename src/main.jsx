import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './utils/axiosSetup';

// Capturar el evento de instalación para PWAs
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevenir que el navegador lo muestre automáticamente
  e.preventDefault();
  // Guardar el evento para dispararlo luego desde la UI
  window.deferredPrompt = e;
  // Opcional: Emitir un evento personalizado para que React se entere
  window.dispatchEvent(new Event('pwa-install-ready'));
});

window.addEventListener('appinstalled', () => {
  window.deferredPrompt = null;
  console.log('PWA instalada correctamente');
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
