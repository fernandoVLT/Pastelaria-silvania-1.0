import { X, Minus, Plus, Star, MessageSquare } from 'lucide-react';
import React, { useState } from 'react';
import { CartItem, Product } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { useStore } from '../contexts/StoreContext';

interface Props {
  product: Product;
  onClose: () => void;
  onAdd: (item: Omit<CartItem, 'id'>) => void;
}

export function ProductModal({ product, onClose, onAdd }: Props) {
  const { addReview } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [observation, setObservation] = useState('');

  const handleAdd = () => {
    onAdd({
      product,
      quantity,
      observation: observation.trim()
    });
    onClose();
  };

  const increment = () => setQuantity(q => q + 1);
  const decrement = () => setQuantity(q => Math.max(1, q - 1));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border-t sm:border border-gray-100 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300 min-h-[50vh] max-h-[90vh]">
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 shrink-0">
          <h2 className="font-black text-xl tracking-tight uppercase text-gray-900">Detalhes</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {product.imageUrl && (
            <img src={product.imageUrl} alt={product.name} loading="lazy" decoding="async" className="w-full h-48 object-cover rounded-xl mb-6 border border-gray-100 shadow-sm" />
          )}
          
          <h3 className="text-3xl font-black text-gray-900 mb-2 tracking-tight uppercase leading-none">{product.name}</h3>

          <div className="font-mono text-2xl text-brand-red mb-4 mt-2">{formatCurrency(product.price)}</div>
          
          {product.description && (
            <p className="text-gray-600 text-xs uppercase leading-loose mb-8 font-medium">{product.description}</p>
          )}

          <hr className="border-gray-100 mb-8" />

          {/* Observações / Adicionais */}
          <div className="mb-8">
            <h4 className="font-black text-sm uppercase tracking-widest text-gray-900 mb-4 flex items-center gap-2">
              Observações / Adicionais
            </h4>
            {product.category.toLowerCase().includes('past') ? (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-xs text-red-600 font-bold uppercase tracking-widest text-center">Pastéis não podem ser feitos com acréscimos ou adicionais.</p>
              </div>
            ) : (
              <textarea 
                placeholder="Ex: Tirar cebola, adicional de bacon..."
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent placeholder:text-gray-400 font-medium"
              />
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center gap-4 shrink-0">
          <div className="flex items-center bg-white border border-gray-200 rounded-xl h-14 shadow-sm">
            <button
              onClick={decrement}
              className="w-14 h-14 flex items-center justify-center text-gray-500 hover:text-brand-red transition-colors"
            >
              <Minus className="w-5 h-5" />
            </button>
            <span className="w-8 text-center font-mono text-lg font-bold text-gray-900">{quantity}</span>
            <button
              onClick={increment}
              className="w-14 h-14 flex items-center justify-center text-gray-500 hover:text-brand-red transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          <button 
            onClick={handleAdd}
            className="flex-1 bg-brand-red hover:bg-brand-red-dark text-white font-black h-14 rounded-xl transition-colors uppercase text-[10px] tracking-[0.2em] shadow-md"
          >
            Adicionar {formatCurrency(product.price * quantity)}
          </button>
        </div>
      </div>
    </div>
  );
}
