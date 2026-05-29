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

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewName, setReviewName] = useState('');
  const [reviewComment, setReviewComment] = useState('');

  const handleAdd = () => {
    onAdd({
      product,
      quantity,
      observation: ''
    });
    onClose();
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName || !reviewComment) return;

    addReview(product.id, {
      id: crypto.randomUUID(),
      author: reviewName,
      rating: reviewRating,
      comment: reviewComment,
      date: new Date().toLocaleDateString('pt-BR')
    });
    setReviewName('');
    setReviewComment('');
    setReviewRating(5);
  };

  const increment = () => setQuantity(q => q + 1);
  const decrement = () => setQuantity(q => Math.max(1, q - 1));

  const avgRating = product.reviews?.length 
    ? (product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length).toFixed(1)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 min-h-[50vh] max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
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
          
          {avgRating && (
            <div className="flex items-center gap-2 mb-2 text-sm font-bold text-gray-700">
              <Star className="w-4 h-4 text-brand-yellow fill-current" />
              <span>{avgRating}</span>
              <span className="text-gray-400 font-normal">({product.reviews?.length} avaliações)</span>
            </div>
          )}

          <div className="font-mono text-2xl text-brand-red mb-4">{formatCurrency(product.price)}</div>
          
          {product.description && (
            <p className="text-gray-600 text-xs uppercase leading-loose mb-8 font-medium">{product.description}</p>
          )}

          <hr className="border-gray-100 mb-8" />

          {/* Comentários / Avaliações */}
          <div className="mb-4">
            <h4 className="font-black text-sm uppercase tracking-widest text-gray-900 mb-6 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              Avaliações
            </h4>
            
            <div className="space-y-4 mb-8">
              {(!product.reviews || product.reviews.length === 0) ? (
                <p className="text-sm text-gray-500 italic flex items-center justify-center p-6 bg-gray-50 rounded-xl">Nenhuma avaliação ainda. Seja o primeiro!</p>
              ) : (
                product.reviews.map(review => (
                  <div key={review.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm text-gray-900">{review.author}</span>
                      <span className="text-[10px] text-gray-500">{review.date}</span>
                    </div>
                    <div className="flex gap-1 mb-2">
                      {Array.from({length: 5}).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-brand-yellow fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{review.comment}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSubmitReview} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <h5 className="font-bold text-xs uppercase tracking-widest text-gray-500 mb-4">Deixe sua avaliação</h5>
              <div className="flex gap-1 mb-4">
                {Array.from({length: 5}).map((_, i) => (
                  <button type="button" key={i} onClick={() => setReviewRating(i + 1)}>
                    <Star className={`w-6 h-6 hover:scale-110 transition-transform ${i < reviewRating ? 'text-brand-yellow fill-current' : 'text-gray-200'}`} />
                  </button>
                ))}
              </div>
              <input 
                required
                type="text" 
                placeholder="Seu nome"
                value={reviewName}
                onChange={e => setReviewName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm mb-3 focus:outline-none focus:border-brand-yellow placeholder:text-gray-400"
              />
              <textarea 
                required
                placeholder="Seu comentário"
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm h-20 resize-none mb-3 focus:outline-none focus:border-brand-yellow placeholder:text-gray-400"
              />
              <button 
                type="submit"
                className="w-full bg-brand-red text-white font-bold text-[10px] uppercase tracking-widest py-3 rounded-xl hover:bg-brand-red-dark transition-colors"
              >
                Enviar Avaliação
              </button>
            </form>
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
