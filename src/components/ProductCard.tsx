import { memo } from 'react';
import { Plus, Heart } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { useStore } from '../contexts/StoreContext';

interface Props {
  product: Product;
  onClick: (product: Product) => void;
}

export const ProductCard = memo(function ProductCard({ product, onClick }: Props) {
  const { favorites, toggleFavorite } = useStore();
  const isFavorite = favorites.includes(product.id);

  return (
    <div 
      className="relative group overflow-hidden rounded-2xl bg-white border border-gray-100 p-3 sm:p-6 flex flex-row sm:flex-col justify-between cursor-pointer hover:border-brand-red/30 hover:shadow-xl hover:-translate-y-1 shadow-sm transition-all duration-300 h-full gap-3 sm:gap-0"
      onClick={() => onClick(product)}
    >
      <div className="absolute -right-12 -top-12 w-32 h-32 sm:w-48 sm:h-48 bg-brand-yellow/10 group-hover:bg-brand-yellow/20 transition-colors rounded-full blur-3xl"></div>
      
      <button 
        onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
        className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 p-2 sm:bg-white/80 backdrop-blur-sm rounded-full sm:shadow-sm hover:scale-110 transition-transform"
      >
        <Heart className={`w-4 h-4 ${isFavorite ? 'text-brand-red fill-current' : 'text-gray-300 sm:text-gray-400'}`} />
      </button>

      {/* Image container changes for mobile vs desktop */}
      {product.imageUrl && (
        <div className="w-24 h-24 sm:w-full sm:h-40 shrink-0 relative z-10">
          <img src={product.imageUrl} alt={product.name} loading="lazy" decoding="async" className="w-full h-full object-cover rounded-xl border border-gray-100 transition-all group-hover:scale-[1.02]" />
        </div>
      )}

      <div className="z-10 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex w-full justify-between items-start mb-1 sm:mb-3 gap-2 pr-6 sm:pr-10">
            <h3 className="text-base sm:text-2xl font-black tracking-tight text-gray-900 leading-tight group-hover:text-brand-red transition-colors line-clamp-2">{product.name}</h3>
          </div>
          
          {product.description && (
            <p className="text-gray-500 text-[10px] sm:text-xs uppercase leading-relaxed line-clamp-2 mt-1 sm:mt-2 mb-2 sm:mb-4 font-medium tracking-wide">{product.description}</p>
          )}
        </div>

        <div className="flex sm:flex-col items-center sm:items-start justify-between w-full mt-auto">
          <span className="font-mono text-base sm:text-xl text-brand-red font-black whitespace-nowrap">{formatCurrency(product.price)}</span>
          <button className="z-10 mt-0 sm:mt-4 px-3 py-1.5 sm:w-full sm:py-4 border border-brand-red/20 sm:border-gray-200 bg-red-50 sm:bg-gray-50 text-brand-red group-hover:bg-brand-red group-hover:border-brand-red group-hover:text-white transition-all uppercase text-[9px] sm:text-[10px] font-black tracking-widest sm:text-gray-600 rounded-lg sm:rounded-xl">
            <span className="hidden sm:inline">Adicionar à Sacola</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
});
