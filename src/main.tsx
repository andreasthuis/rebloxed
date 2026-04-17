import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

const globalImageBlocker = () => {
  if (typeof window === 'undefined') return;

  const handleEvent = (e: MouseEvent | DragEvent) => {
    const target = e.target as HTMLElement;
    if (target && target.tagName === 'IMG') {
      e.preventDefault();
    }
  };

  document.addEventListener('contextmenu', handleEvent as EventListener);
  document.addEventListener('dragstart', handleEvent as EventListener);
};

globalImageBlocker();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)