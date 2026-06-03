import { X, Clock, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { useStore } from '../contexts/StoreContext';
import { useEffect, useState } from 'react';
import { Order } from '../types';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface Props {
  onClose: () => void;
  onReorder?: (orderItems: any[]) => void;
}

export function CustomerOrdersModal({ onClose, onReorder }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const saved = localStorage.getItem('customer_orders');
        if (saved) {
          const localOrders: Order[] = JSON.parse(saved);
          
          // Update orders with latest values from Firestore
          const updatedOrders = await Promise.all(localOrders.map(async (order) => {
            if (order.id) {
              try {
                const orderDoc = await getDoc(doc(db, 'orders', order.id));
                if (orderDoc.exists()) {
                  const data = orderDoc.data() as Partial<Order>;
                  return { ...order, status: data.status || order.status };
                }
              } catch (err) {
                console.error("Failed to fetch order", err);
              }
            }
            return order;
          }));
          
          setOrders(updatedOrders);
          localStorage.setItem('customer_orders', JSON.stringify(updatedOrders));
        }
      } catch(e) {}
      setIsLoading(false);
    }
    
    loadOrders();
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white border border-gray-100 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col h-[85vh] animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-black text-xl tracking-tight uppercase text-gray-900">Meus Pedidos</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-brand-red animate-spin mb-4"></div>
              <p className="font-bold uppercase tracking-widest text-sm">Carregando...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingBag className="w-16 h-16 mb-4 opacity-50" />
              <p className="font-bold uppercase tracking-widest text-sm">Nenhum pedido recente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-gray-900">
                        Pedido #{order.id || 'NOVO'}
                      </h4>
                      <p className="text-xs text-gray-500 font-medium">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {order.status || 'Enviado'}
                    </span>
                  </div>
                  <div className="space-y-2 mb-3">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">
                          <span className="font-bold text-brand-red mr-2">{item.quantity}x</span>
                          {item.productName}
                        </span>
                        <span className="font-medium text-gray-900 font-mono">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {order.orderType}
                    </span>
                    <span className="font-black text-gray-900 text-lg font-mono flex items-center gap-4">
                      {formatCurrency(order.total)}
                      {onReorder && (
                        <button 
                          onClick={() => onReorder(order.items)}
                          className="bg-brand-red text-white text-xs px-3 py-1.5 rounded-full uppercase tracking-widest font-black hover:bg-brand-red-dark transition-colors"
                        >
                          Refazer Pedido
                        </button>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
