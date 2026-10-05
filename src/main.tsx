import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  document.body.innerHTML = `
    <div style="font-family: sans-serif; padding: 2rem; text-align: center; color: #1e293b;">
      <h2>Erro Crítico</h2>
      <p>Elemento #root não foi encontrado no documento HTML.</p>
    </div>
  `;
} else {
  try {
    createRoot(rootElement).render(<App />);
  } catch (error: any) {
    console.error('Falha fatal ao renderizar aplicação:', error);
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f172a; color: #f8fafc; font-family: sans-serif; padding: 1.5rem;">
        <div style="max-width: 450px; background: #1e293b; border: 1px solid #334155; border-radius: 1rem; padding: 1.5rem; text-align: center;">
          <h2 style="font-size: 1.1rem; font-weight: bold; margin-bottom: 0.5rem; color: #f87171;">Falha ao Carregar o Sistema</h2>
          <p style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 1rem;">Ocorreu um erro ao carregar os componentes no navegador.</p>
          <pre style="text-align: left; background: #020617; padding: 0.75rem; border-radius: 0.5rem; font-size: 0.75rem; color: #fca5a5; overflow-x: auto; max-height: 120px;">${error?.message || error}</pre>
          <button onclick="localStorage.clear(); window.location.reload();" style="margin-top: 1rem; width: 100%; padding: 0.6rem; background: #2563eb; color: white; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer;">Limpar Cache e Recarregar</button>
        </div>
      </div>
    `;
  }
}
