import { ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useRef, useEffect } from 'react';

export function HeroSplash() {
  const { config } = useStore();
  
  const handleScrollDown = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };

  return (
    <div className="w-full flex flex-col bg-brand-red text-white h-[100dvh]">
      {/* Section 1 */}
      <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center shrink-0">
         {config.bannerUrl && (
          <div className="absolute inset-0 z-0 opacity-20">
            <img 
              src={config.bannerUrl} 
              alt="Banner" 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <div className="mb-8">
            <span className="inline-block py-1.5 px-4 rounded-full bg-brand-yellow text-gray-900 text-xs font-black tracking-widest uppercase mb-6 shadow-md">
              Bem-vindo(a) à {config.logoText}
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-tight tracking-tight mb-8 drop-shadow-md">
            Você está preparado para se deliciar com o <span className="text-brand-yellow">melhor pastel</span> da região?
          </h1>
          
          <button 
            onClick={handleScrollDown}
            className="group mt-4 flex px-8 py-4 bg-brand-yellow hover:bg-yellow-400 text-gray-900 rounded-full items-center gap-3 transition-all duration-300 transform hover:scale-105 shadow-xl"
          >
            <span className="text-sm font-black tracking-widest uppercase">
              Ver Cardápio
            </span>
            <ChevronDown className="w-6 h-6 animate-bounce" />
          </button>
        </div>
      </div>
    </div>
  );
}
