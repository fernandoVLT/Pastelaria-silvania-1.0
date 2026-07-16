import { memo } from 'react';
import { Plus, Heart, Minus } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../utils/formatCurrency';

interface Props {
  product: Product;
  onClick: (product: Product) => void;
  quantityInCart?: number;
  onIncrement?: () => void;
  onDecrement?: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export const ProductCard = memo(function ProductCard({ 
  product, 
  onClick, 
  quantityInCart = 0, 
  onIncrement, 
  onDecrement,
  isFavorite,
  onToggleFavorite
}: Props) {
  const isUnavailable = (product.stock !== undefined && product.stock <= 0) || product.isAvailable === false;

  return (
    <div 
      className={`relative group overflow-hidden rounded-2xl bg-white border border-gray-100 p-3 sm:p-6 flex flex-row sm:flex-col justify-between cursor-pointer hover:border-brand-red/30 hover:shadow-xl hover:-translate-y-1 shadow-sm transition-all duration-300 h-full gap-3 sm:gap-0 ${isUnavailable ? 'opacity-70 grayscale-[0.8] hover:-translate-y-0 hover:shadow-sm' : ''}`}
      onClick={() => {
        if (!isUnavailable) onClick(product);
      }}
    >
      <div className="absolute -right-12 -top-12 w-32 h-32 sm:w-48 sm:h-48 bg-brand-yellow/10 group-hover:bg-brand-yellow/20 transition-colors rounded-full blur-3xl"></div>
      
      <button 
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
        className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 p-2 sm:bg-white/80 backdrop-blur-sm rounded-full sm:shadow-sm hover:scale-110 transition-transform"
      >
        <Heart className={`w-4 h-4 ${isFavorite ? 'text-brand-red fill-current' : 'text-gray-300 sm:text-gray-400'}`} />
      </button>

      {/* Image container changes for mobile vs desktop */}
      {product.imageUrl && (
        <div className="w-24 h-24 sm:w-full sm:h-40 shrink-0 relative z-10">
          <img src={product.imageUrl} alt={product.name} loading="lazy" decoding="async" className="w-full h-full object-cover rounded-xl border border-gray-100 transition-all group-hover:scale-[1.02]" />
          {isUnavailable && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
              <span className="bg-white/90 text-red-600 font-black text-[10px] uppercase tracking-widest px-2 py-1 rounded">Indisponível</span>
            </div>
          )}
        </div>
      )}

      {!product.imageUrl && isUnavailable && (
        <div className="absolute top-2 left-2 z-20 bg-red-100 text-red-600 font-black text-[10px] uppercase tracking-widest px-2 py-1 rounded shadow-sm">
          Indisponível
        </div>
      )}

      <div className="z-10 flex-1 flex flex-col justify-between">
        <div className={!product.imageUrl && isUnavailable ? 'pt-6' : ''}>
          <div className="flex w-full justify-between items-start mb-1 sm:mb-3 gap-2 pr-6 sm:pr-10">
            <h3 className="text-base sm:text-2xl font-black tracking-tight text-gray-900 leading-tight group-hover:text-brand-red transition-colors line-clamp-2">{product.name}</h3>
          </div>
          
          {product.description && (
            <p className="text-gray-500 text-[10px] sm:text-xs uppercase leading-relaxed line-clamp-2 mt-1 sm:mt-2 mb-2 sm:mb-4 font-medium tracking-wide">{product.description}</p>
          )}
        </div>

        <div className="flex sm:flex-col items-center sm:items-start justify-between w-full mt-auto">
          <span className="font-mono text-base sm:text-xl text-brand-red font-black whitespace-nowrap">
            {product.price === 0 ? 'Sem Valor' : formatCurrency(product.price)}
          </span>
          
          <div className="z-10 mt-0 sm:mt-4 w-auto sm:w-full" onClick={(e) => e.stopPropagation()}>
            {isUnavailable ? (
               <div className="px-3 py-1.5 sm:w-full sm:py-4 border border-gray-200 bg-gray-100 text-gray-400 uppercase text-[9px] sm:text-[10px] font-black tracking-widest rounded-lg sm:rounded-xl text-center cursor-not-allowed">
                 Indisponível
               </div>
            ) : quantityInCart > 0 ? (
               <div className="flex items-center justify-between bg-brand-red text-white rounded-lg sm:rounded-xl overflow-hidden h-8 sm:h-12 shadow-sm">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDecrement?.(); }}
                    className="w-8 sm:w-12 h-full flex items-center justify-center hover:bg-black/10 transition-colors"
                  >
                    <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                  <span className="font-bold text-xs sm:text-sm">{quantityInCart}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onIncrement?.(); }}
                    className="w-8 sm:w-12 h-full flex items-center justify-center hover:bg-black/10 transition-colors"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
               </div>
            ) : (
              <button 
                onClick={(e) => { e.stopPropagation(); onIncrement?.(); }}
                className="w-full px-3 py-1.5 sm:py-4 border border-brand-red/20 sm:border-gray-200 bg-red-50 sm:bg-gray-50 text-brand-red hover:bg-brand-red hover:border-brand-red hover:text-white transition-all uppercase text-[9px] sm:text-[10px] font-black tracking-widest sm:text-gray-600 rounded-lg sm:rounded-xl"
              >
                <span className="hidden sm:inline">Adicionar à Sacola</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
