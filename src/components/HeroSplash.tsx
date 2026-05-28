import { ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useRef, useEffect } from 'react';

export function HeroSplash() {
  const { config } = useStore();
  
  const handleScrollDown = () => {
    window.scrollTo({
      top: window.innerHeight * 3, // Scroll past the 3 sections
      behavior: 'smooth'
    });
  };

  return (
    <div className="w-full flex flex-col bg-brand-red text-white">
      {/* Section 1 */}
      <div className="relative w-full h-[100dvh] flex flex-col items-center justify-center p-6 text-center border-b border-white/10 shrink-0">
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
          
          <div className="absolute bottom-12 animate-bounce cursor-pointer flex flex-col items-center" onClick={() => window.scrollTo({top: window.innerHeight, behavior: 'smooth'})}>
             <span className="text-[10px] font-bold uppercase tracking-widest mb-2 opacity-80">Role para continuar</span>
             <ChevronDown className="w-8 h-8 text-brand-yellow" />
          </div>
        </div>
      </div>

      {/* Section 2 */}
      <div className="relative w-full h-[100dvh] flex flex-col items-center justify-center p-6 text-center border-b border-white/10 shrink-0 bg-brand-yellow text-gray-900">
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-black leading-tight tracking-tight mb-8">
            Você quer ter uma <span className="text-brand-red drop-shadow-sm">explosão de sabores</span> com a {config.logoText}?
          </h2>
          <p className="text-lg sm:text-2xl font-bold opacity-80 max-w-2xl">
            Ingredientes selecionados, massa sempre crocante e aquele recheio irresistível que você só encontra aqui.
          </p>
          
          <div className="absolute bottom-12 animate-bounce cursor-pointer flex flex-col items-center" onClick={() => window.scrollTo({top: window.innerHeight * 2, behavior: 'smooth'})}>
             <span className="text-[10px] font-bold uppercase tracking-widest mb-2 text-brand-red">Role mais um pouco</span>
             <ChevronDown className="w-8 h-8 text-brand-red" />
          </div>
        </div>
      </div>

      {/* Section 3 */}
      <div className="relative w-full h-[100dvh] flex flex-col items-center justify-center p-6 text-center shrink-0">
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
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-tight tracking-tight mb-8">
            Então role só mais uma vez e <span className="text-brand-yellow">faça seu pedido!</span>
          </h2>
          
          <button 
            onClick={handleScrollDown}
            className="group mt-8 flex px-8 py-4 bg-brand-yellow hover:bg-yellow-400 text-gray-900 rounded-full items-center gap-3 transition-all duration-300 transform hover:scale-105 shadow-xl"
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
