import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, X } from 'lucide-react';

const APP_VERSION = (import.meta as any).env?.VITE_APP_VERSION;
const IS_DEV = (import.meta as any).env?.DEV || APP_VERSION === 'dev';

export function VersionUpdater() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // In development mode, do not run version checks or show popups
    if (IS_DEV) return;

    const checkForUpdate = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.version && APP_VERSION && data.version !== APP_VERSION) {
          // Check if user dismissed update recently (within 1 hour)
          const dismissedAt = localStorage.getItem('app_update_dismissed');
          if (dismissedAt && Date.now() - Number(dismissedAt) < 60 * 60 * 1000) {
            return;
          }
          setHasUpdate(true);
        }
      } catch (e) {
        // Ignore network errors
      }
    };

    // Handler for chunk load errors (happens when a new deploy removes old script chunks)
    const handlePreloadError = (event: Event) => {
      console.warn('Chunk load error detected, prompt for update:', event);
      setHasUpdate(true);
      setIsDismissed(false);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = String(event.reason || '');
      if (
        reason.includes('Failed to fetch dynamically imported module') ||
        reason.includes('Loading chunk') ||
        reason.includes('Importing a module script failed')
      ) {
        setHasUpdate(true);
        setIsDismissed(false);
      }
    };

    // Listeners for chunk errors
    window.addEventListener('vite:preloadError', handlePreloadError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Poll every 10 minutes in production
    const interval = setInterval(checkForUpdate, 10 * 60 * 1000);
    
    // Check when user focuses the tab after long idle
    window.addEventListener('focus', checkForUpdate);

    // Initial check 5 seconds after load
    const timeout = setTimeout(checkForUpdate, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      window.removeEventListener('focus', checkForUpdate);
      window.removeEventListener('vite:preloadError', handlePreloadError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const updateApp = async () => {
    try {
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(key => caches.delete(key)));
      }
    } catch (err) {
      console.error('Error clearing cache:', err);
    }
    
    // Force reload bypassing local cache
    window.location.reload();
  };

  const dismissUpdate = () => {
    setIsDismissed(true);
    localStorage.setItem('app_update_dismissed', Date.now().toString());
  };

  if (IS_DEV || !hasUpdate || isDismissed) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl relative border border-gray-100">
        <button
          onClick={dismissUpdate}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center mx-auto mb-5 relative">
          <RefreshCw className="w-8 h-8 sm:w-10 sm:h-10 animate-spin" style={{ animationDuration: '3s' }} />
          <div className="absolute top-0 right-0 w-6 h-6 bg-white rounded-full flex items-center justify-center border-2 border-white shadow-sm text-brand-red">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">
          Atualização Disponível!
        </h2>
        
        <p className="text-gray-500 mb-6 text-xs sm:text-sm leading-relaxed">
          Uma nova versão do sistema foi lançada para garantir o bom funcionamento da aplicação.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={updateApp}
            className="w-full bg-brand-red hover:bg-red-700 text-white font-black py-3.5 px-6 rounded-xl text-xs sm:text-sm uppercase tracking-widest transition-all shadow-[0_8px_30px_rgb(220,38,38,0.3)] hover:shadow-[0_8px_30px_rgb(220,38,38,0.5)] flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar Agora
          </button>

          <button
            onClick={dismissUpdate}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-wider transition-colors"
          >
            Lembrar mais tarde
          </button>
        </div>
      </div>
    </div>
  );
}
