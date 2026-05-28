import { ShoppingBag, Search, Heart } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useState, useRef } from 'react';

interface Props {
  cartItemCount: number;
  onOpenMobileCart: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showFavorites: boolean;
  setShowFavorites: (show: boolean) => void;
}

export function Header({ cartItemCount, onOpenMobileCart, searchQuery, setSearchQuery, showFavorites, setShowFavorites }: Props) {
  const { config } = useStore();
  const initials = config.logoText.substring(0, 2).toUpperCase();

  return (
    <header className="bg-brand-red border-b border-brand-red-dark text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 cursor-pointer select-none shrink-0" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-black text-brand-red text-2xl font-display pt-1 shadow-inner relative overflow-hidden shrink-0">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
            <div className="absolute inset-0 bg-black/10 opacity-0 active:opacity-100 transition-opacity"></div>
          </div>
          <div className="hidden md:flex flex-col justify-center">
            <span className="font-display text-2xl tracking-wide pt-1 truncate max-w-[250px]">{config.logoText}</span>
            <span className="text-[10px] text-white/80 font-bold uppercase tracking-widest">{config.openingHours} | {config.whatsappNumber}</span>
          </div>
        </div>
        
        <div className="flex-1 max-w-md ml-4 mr-0 sm:mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full bg-black/10 border border-white/20 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/60 focus:outline-none focus:bg-black/20 focus:border-white/40 transition-colors"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-6">
          <nav className="hidden lg:flex items-center gap-6 font-bold text-sm tracking-wide">
            <a href="#" className="text-white hover:text-brand-yellow transition-colors">Início</a>
            <a href="#cardapio" className="text-white hover:text-brand-yellow transition-colors">Cardápio</a>
          </nav>
          
          <button 
            onClick={() => setShowFavorites(!showFavorites)}
            className={`p-2 transition-colors relative ${showFavorites ? 'text-brand-yellow' : 'text-white hover:text-brand-yellow'}`}
            title="Favoritos"
          >
            <Heart className="w-6 h-6" fill={showFavorites ? "currentColor" : "none"} />
          </button>

          <button 
            onClick={onOpenMobileCart}
            className="md:hidden relative p-2 text-white hover:text-brand-yellow transition-colors flex items-center gap-4"
          >
            <div className="relative">
              <ShoppingBag className="w-6 h-6" />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-brand-yellow text-brand-red font-bold text-[10px] rounded-full flex items-center justify-center transform translate-x-1 -translate-y-1 shadow-sm">
                  {cartItemCount}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
