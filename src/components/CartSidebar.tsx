import { ShoppingBag, Trash2 } from 'lucide-react';
import { CartItem } from '../types';
import { formatCurrency } from '../utils/formatCurrency';

interface Props {
  items: CartItem[];
  onRemove: (id: string) => void;
  onCheckout: () => void;
}

export function CartSidebar({ items, onRemove, onCheckout }: Props) {
  const total = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  if (items.length === 0) {
    return (
      <aside className="bg-white border border-gray-100 shadow-sm rounded-2xl p-8 flex flex-col h-full md:h-[calc(100vh-160px)] md:sticky top-28 items-center justify-center text-center mt-auto mb-auto">
        <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-400 shadow-inner">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h3 className="font-black text-xl text-gray-900 tracking-tight uppercase mb-2">Sacola Vazia</h3>
        <p className="text-gray-500 text-xs font-medium uppercase tracking-widest leading-relaxed">Adicione itens para começar o seu pedido.</p>
      </aside>
    );
  }

  return (
    <aside className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 md:p-8 flex flex-col h-full min-h-[50vh] md:h-[calc(100vh-160px)] md:sticky top-20 md:top-28">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black tracking-tight uppercase text-gray-900 flex items-center gap-3">
          <ShoppingBag className="w-6 h-6 text-brand-red" />
          Sacola
        </h2>
        <span className="text-[10px] bg-gray-100 text-gray-600 font-bold px-2 py-1 rounded-full border border-gray-200">
          {items.length} {items.length === 1 ? 'ITEM' : 'ITENS'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-6 pr-2 custom-scrollbar">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-start group">
            <div className="flex-1 mr-4">
              <h5 className="text-sm font-bold uppercase tracking-tight text-gray-900 flex flex-col items-start gap-1 leading-tight mb-1">
                 <div className="flex items-center gap-2">
                   <span className="text-brand-red font-mono text-xs pt-0.5 bg-red-50 px-1.5 py-0.5 rounded shadow-sm">{item.quantity}x</span>
                   <span>{item.product.name}</span>
                 </div>
                 {item.product.category && (
                   <span className="text-[10px] text-gray-500 font-bold tracking-widest pl-9">{item.product.category}</span>
                 )}
                 {item.product.description && (
                   <span className="text-[10px] text-gray-400 font-medium pl-9 leading-tight">{item.product.description}</span>
                 )}
              </h5>
              {item.observation && (
                <p className="text-[10px] text-gray-500 italic font-medium pl-9">"{item.observation}"</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
               <span className="font-mono text-xs text-brand-red font-bold">
                 {item.product.price === 0 ? 'Sem Valor' : formatCurrency(item.product.price * item.quantity)}
               </span>
               <button 
                 onClick={() => onRemove(item.id)}
                 className="text-gray-400 hover:text-brand-red transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1"
               >
                 <Trash2 className="w-4 h-4" />
               </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-6 border-t border-gray-100">
        <div className="flex justify-between items-end mb-6">
          <span className="text-xs text-gray-500 uppercase font-bold tracking-widest">Total</span>
          <span className="text-3xl font-black tracking-tight text-gray-900">{formatCurrency(total)}</span>
        </div>
        <button 
          onClick={onCheckout}
          className="w-full py-4 bg-brand-red hover:bg-brand-red-dark text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl transition-all shadow-md flex items-center justify-center gap-3"
        >
          Finalizar Pedido
        </button>
      </div>
    </aside>
  );
}
