import { X, Clock, ShoppingBag, Plus } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { useStore } from '../contexts/StoreContext';
import { useEffect, useState } from 'react';
import { Order } from '../types';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface Props {
  onClose: () => void;
  onReorder: (items: any[]) => void;
}

export function CustomerOrdersModal({ onClose, onReorder }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [trackingOrder, setTrackingOrder] = useState<string | null>(null);

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

  const handleReorder = (order: Order) => {
    onReorder(order.items);
    onClose();
  };

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
                      <div key={i} className="flex justify-between items-start text-sm">
                        <span className="text-gray-700 flex flex-col">
                          <span className="flex items-center gap-2">
                            <span className="font-bold text-brand-red">{item.quantity}x</span>
                            {item.productName}
                          </span>
                          {item.category && (
                            <span className="text-[10px] text-gray-400 font-bold tracking-widest pl-6">{item.category}</span>
                          )}
                          {item.description && (
                            <span className="text-[10px] text-gray-500 font-medium pl-6 leading-tight">{item.description}</span>
                          )}
                          {item.observation && (
                            <span className="text-[10px] text-gray-400 italic font-medium pl-6">"{item.observation}"</span>
                          )}
                        </span>
                        <span className="font-medium text-gray-900 font-mono pl-2 shrink-0 pt-0.5">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                        {order.orderType}
                      </span>
                      <span className="font-black text-gray-900 text-lg font-mono leading-none">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setTrackingOrder(trackingOrder === order.id ? null : (order.id || null))}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                    >
                      {trackingOrder === order.id ? 'Fechar' : 'Acompanhar'}
                    </button>
                    <button 
                      onClick={() => handleReorder(order)}
                      className="px-4 py-2 bg-brand-red hover:bg-brand-red-dark text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2 shadow-md shadow-red-500/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Refazer Pedido
                    </button>
                    </div>
                  </div>
                    {trackingOrder === order.id && (
                      <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
                        <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Status do Pedido</h5>
                        <div className="space-y-4 pl-2 border-l-2 border-gray-100 ml-2 relative">
                          {['Feito', 'Em Preparo', order.orderType === 'Delivery' ? 'A caminho' : 'Pronto', 'Entregue'].map((step, stepIdx) => {
                            const statuses = ['Feito', 'Em Preparo', 'Pronto', 'A caminho', 'Entregue'];
                            const currentIdx = statuses.indexOf(order.status);
                            let stepStatusIdx = statuses.indexOf(step);
                            if (step === 'A caminho' || step === 'Pronto') {
                              stepStatusIdx = Math.max(statuses.indexOf('Pronto'), statuses.indexOf('A caminho'));
                            }
                            
                            const isCompleted = currentIdx >= stepStatusIdx || order.status === 'Entregue';
                            const isCurrent = currentIdx === stepStatusIdx && order.status !== 'Entregue';
                            
                            if (order.status === 'Cancelado') {
                              return null;
                            }
                            
                            return (
                              <div key={step} className="relative pl-6">
                                <div className={`absolute -left-[29px] top-0 w-4 h-4 rounded-full border-2 ${isCompleted || isCurrent ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'} ${isCurrent ? 'animate-pulse ring-4 ring-green-100' : ''}`}>
                                  {(isCompleted) && <svg className="w-full h-full text-white p-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                <div className={`text-xs font-bold ${isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                                  {step}
                                </div>
                              </div>
                            );
                          })}
                          {order.status === 'Cancelado' && (
                            <div className="relative pl-6">
                              <div className="absolute -left-[29px] top-0 w-4 h-4 rounded-full border-2 bg-red-500 border-red-500">
                                <svg className="w-full h-full text-white p-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                              </div>
                              <div className="text-xs font-bold text-red-600">
                                Pedido Cancelado
                              </div>
                            </div>
                          )}
                          {order.status === 'Aguardando Confirmação Pix' && (
                            <div className="relative pl-6">
                              <div className="absolute -left-[29px] top-0 w-4 h-4 rounded-full border-2 bg-teal-500 border-teal-500 animate-pulse">
                                <Clock className="w-full h-full text-white p-0.5" />
                              </div>
                              <div className="text-xs font-bold text-teal-600">
                                Aguardando Pix
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
