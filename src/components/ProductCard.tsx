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
      className="relative group overflow-hidden rounded-2xl bg-white border border-gray-100 p-4 sm:p-6 flex flex-col justify-between cursor-pointer hover:border-brand-red/30 hover:shadow-xl hover:-translate-y-1 shadow-sm transition-all duration-300 h-full"
      onClick={() => onClick(product)}
    >
      <div className="absolute -right-12 -top-12 w-32 h-32 sm:w-48 sm:h-48 bg-brand-yellow/10 group-hover:bg-brand-yellow/20 transition-colors rounded-full blur-3xl"></div>
      
      <button 
        onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
        className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 transition-transform"
      >
        <Heart className={`w-4 h-4 ${isFavorite ? 'text-brand-red fill-current' : 'text-gray-400'}`} />
      </button>

      <div className="z-10 flex-1 flex flex-col">
        {product.imageUrl && (
           <img src={product.imageUrl} alt={product.name} loading="lazy" decoding="async" className="relative z-10 w-full h-32 sm:h-40 object-cover rounded-xl mb-4 border border-gray-100 transition-all group-hover:scale-[1.02]" />
        )}
        <div className="flex w-full justify-between items-start mb-3 gap-2 pr-10">
          {product.category === 'Grandes de Calabresa' ? (
             <span className="px-2 py-1 bg-brand-red text-white text-[9px] sm:text-[10px] font-bold tracking-widest uppercase rounded-md shrink-0 shadow-sm">DESTAQUE</span>
          ) : (
             <span className="px-2 py-1 border border-gray-200 bg-gray-50 text-gray-500 text-[9px] sm:text-[10px] font-bold tracking-widest uppercase rounded-md shrink-0">CLÁSSICO</span>
          )}
          <span className="font-mono text-lg sm:text-xl text-gray-900 font-black whitespace-nowrap">{formatCurrency(product.price)}</span>
        </div>
        
        <h3 className="text-xl sm:text-2xl font-black tracking-tight mb-2 text-gray-900 leading-none group-hover:text-brand-red transition-colors">{product.name}</h3>
        {product.description && (
          <p className="text-gray-500 text-[10px] sm:text-xs uppercase leading-relaxed line-clamp-2 sm:line-clamp-3 mt-1 sm:mt-2 mb-4 font-medium tracking-wide flex-1">{product.description}</p>
        )}
      </div>
      
      <button className="z-10 mt-4 w-full py-3 sm:py-4 border border-gray-200 bg-gray-50 group-hover:bg-brand-red group-hover:border-brand-red group-hover:text-white transition-all uppercase text-[10px] sm:text-[10px] font-black tracking-widest text-gray-600 group-hover:text-white rounded-xl">
        Adicionar à Sacola
      </button>
    </div>
  );
});
