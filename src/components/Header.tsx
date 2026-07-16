import { ShoppingBag, Search, Heart, ClipboardList } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useState, useRef } from 'react';

interface Props {
  cartItemCount: number;
  onOpenMobileCart: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showFavorites: boolean;
  setShowFavorites: (show: boolean) => void;
  onOpenCustomerOrders: () => void;
}

export function Header({ cartItemCount, onOpenMobileCart, searchQuery, setSearchQuery, showFavorites, setShowFavorites, onOpenCustomerOrders }: Props) {
  const { config, computedIsOpen } = useStore();
  const initials = config.logoText.substring(0, 2).toUpperCase();

  return (
    <header className="bg-brand-red border-b border-brand-red-dark text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 flex-shrink-0 cursor-pointer select-none" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center font-black text-brand-red text-xl sm:text-2xl font-display pt-1 shadow-inner relative overflow-hidden shrink-0">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
            <div className="absolute inset-0 bg-black/10 opacity-0 active:opacity-100 transition-opacity"></div>
          </div>
          <div className="hidden md:flex flex-col justify-center">
            <span className="font-display text-2xl tracking-wide pt-1 truncate max-w-[250px] flex items-center gap-2">
              {config.logoText}
              {computedIsOpen ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500 text-[10px] font-bold text-white uppercase tracking-widest shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> Aberto
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 border border-white/20 text-[10px] font-bold text-white uppercase tracking-widest shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span> Fechado
                </span>
              )}
            </span>
            <span className="text-[10px] text-white/80 font-bold uppercase tracking-widest">{config.openingHours} | {config.whatsappNumber}</span>
          </div>
        </div>
        
        <div className="flex-1 max-w-md ml-1 sm:ml-4 mr-0 sm:mx-4">
          <div className="relative">
            <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full bg-black/10 border border-white/20 rounded-full py-1.5 sm:py-2 pl-8 sm:pl-10 pr-3 sm:pr-4 text-xs sm:text-sm text-white placeholder:text-white/60 focus:outline-none focus:bg-black/20 focus:border-white/40 transition-colors"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-6">
          <nav className="hidden lg:flex items-center gap-6 font-bold text-sm tracking-wide">
            <a href="#" className="text-white hover:text-brand-yellow transition-colors">Início</a>
            <a href="#cardapio" className="text-white hover:text-brand-yellow transition-colors">Cardápio</a>
          </nav>
          
          <button 
            onClick={onOpenCustomerOrders}
            className="p-1.5 sm:p-2 transition-colors text-white hover:text-brand-yellow relative"
            title="Meus Pedidos"
          >
            <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          
          <button 
            onClick={() => setShowFavorites(!showFavorites)}
            className={`p-1.5 sm:p-2 transition-colors relative ${showFavorites ? 'text-brand-yellow' : 'text-white hover:text-brand-yellow'}`}
            title="Favoritos"
          >
            <Heart className="w-5 h-5 sm:w-6 sm:h-6" fill={showFavorites ? "currentColor" : "none"} />
          </button>

          <button 
            onClick={onOpenMobileCart}
            className="md:hidden relative p-1.5 sm:p-2 text-white hover:text-brand-yellow transition-colors flex items-center gap-4"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 sm:w-5 sm:h-5 bg-brand-yellow text-brand-red font-bold text-[9px] sm:text-[10px] rounded-full flex items-center justify-center transform translate-x-1 -translate-y-1 shadow-sm">
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
