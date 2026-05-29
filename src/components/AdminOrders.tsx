import { useState, useEffect, useRef } from 'react';
import { useOrders } from '../hooks/useOrders';
import { Order, OrderStatus } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { Printer, MapPin, Phone, MessageSquare, Clock, Calendar, Store, Check, Bike, Timer as TimerIcon } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { motion, AnimatePresence } from 'motion/react';
import { useReactToPrint } from 'react-to-print';
import { ReceiptPrint } from './ReceiptPrint';
import toast from 'react-hot-toast';

function ElapsedTimer({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(Date.now() - startTime);
  useEffect(() => {
    const timer = setInterval(() => setElapsed(Date.now() - startTime), 60000);
    return () => clearInterval(timer);
  }, [startTime]);
  const mins = Math.floor(elapsed / 60000);
  return <span>{mins} min</span>;
}

const STATUS_COLORS = {
  'Feito': 'bg-yellow-100 border-yellow-300 text-yellow-800',
  'Em Preparo': 'bg-purple-100 border-purple-300 text-purple-800',
  'Pronto': 'bg-orange-100 border-orange-300 text-orange-800',
  'A caminho': 'bg-blue-100 border-blue-300 text-blue-800',
  'Entregue': 'bg-green-100 border-green-300 text-green-800',
  'Cancelado': 'bg-red-100 border-red-300 text-red-800'
};

const STATUS_INDICATOR = {
  'Feito': 'bg-yellow-500',
  'Em Preparo': 'bg-purple-500',
  'Pronto': 'bg-orange-500',
  'A caminho': 'bg-blue-500',
  'Entregue': 'bg-green-500',
  'Cancelado': 'bg-red-500'
};

export function AdminOrders() {
  const { orders, loading, updateOrderStatus } = useOrders();
  const { config } = useStore();

  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<'ativos' | 'historico'>('ativos');

  const [cancelingOrder, setCancelingOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('Produto Indisponível');

  const [historyFilterType, setHistoryFilterType] = useState<string>('');
  const [historyFilterPayment, setHistoryFilterPayment] = useState<string>('');
  const [historySearch, setHistorySearch] = useState<string>('');

  const printedOrdersRef = useRef<Set<string>>(new Set());
  
  const printRef = useRef<HTMLDivElement>(null);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [printQueue, setPrintQueue] = useState<Order[]>([]);

  const executePrint = useReactToPrint({ 
    contentRef: printRef,
    onAfterPrint: () => {
      setPrintingOrder(null);
      setPrintQueue(prev => prev.slice(1));
      toast.success('Impressão concluída.');
    },
    onPrintError: () => {
      toast.error('Erro na impressão. Tente novamente.');
      setPrintingOrder(null);
      setPrintQueue(prev => prev.slice(1));
    }
  });

  useEffect(() => {
    // Process the print queue
    if (printQueue.length > 0 && !printingOrder) {
      setPrintingOrder(printQueue[0]);
      setTimeout(() => {
        executePrint();
      }, 500); // Give it time to render the invisible component
    }
  }, [printQueue, printingOrder, executePrint]);

  useEffect(() => {
    // Only process when orders are loaded
    if (loading) return;
    
    const autoPrintEnabled = config.printConfig?.autoPrint ?? true;
    const autoPrintDelivery = config.printConfig?.autoPrintDelivery ?? true;
    const autoPrintPickup = config.printConfig?.autoPrintPickup ?? true;
    
    // Check for new orders in 'Feito' status that haven't been printed yet
    const unprintedNewOrders = orders.filter(
      (o) => o.status === 'Feito' && !printedOrdersRef.current.has(o.id!)
    );
    
    if (unprintedNewOrders.length > 0) {
      setTimeout(() => {
        unprintedNewOrders.forEach((order) => {
          if (!printedOrdersRef.current.has(order.id!)) {
            printedOrdersRef.current.add(order.id!);
            if (autoPrintEnabled) {
              const isDelivery = order.orderType === 'Delivery';
              if ((isDelivery && autoPrintDelivery) || (!isDelivery && autoPrintPickup)) {
                handlePrint(order);
              }
            }
          }
        });
      }, 500);
    }
    
    // Also add to set if they are already past 'Feito' so we don't accidentally print them later
    orders.forEach(o => {
       if (o.status !== 'Feito' && !printedOrdersRef.current.has(o.id!)) {
          printedOrdersRef.current.add(o.id!);
       }
    });

  }, [orders, loading, config.printConfig?.autoPrint, config.printConfig?.autoPrintDelivery, config.printConfig?.autoPrintPickup]);

  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    const now = new Date();
    
    if (dateFilter === 'today') {
      return orderDate.getDate() === now.getDate() &&
             orderDate.getMonth() === now.getMonth() &&
             orderDate.getFullYear() === now.getFullYear();
    }
    if (dateFilter === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return orderDate.getDate() === yesterday.getDate() &&
             orderDate.getMonth() === yesterday.getMonth() &&
             orderDate.getFullYear() === yesterday.getFullYear();
    }
    if (dateFilter === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
      return orderDate >= start && orderDate <= end;
    }
    if (dateFilter === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
      if (orderDate < start || orderDate > end) return false;
    }

    if (activeTab === 'historico') {
      if (historyFilterType && order.orderType !== historyFilterType) return false;
      if (historyFilterPayment && order.paymentMethod !== historyFilterPayment) return false;
      if (historySearch) {
        const q = historySearch.toLowerCase();
        if (!order.customerName.toLowerCase().includes(q) && !(order.id || '').toLowerCase().includes(q)) return false;
      }
    }

    return true; // IF custom but no dates selected, show all or default logic? Better to just show all in that case.
  });

  const getWhatsAppMessage = (order: Order, overrideStatus?: OrderStatus) => {
    const st = overrideStatus || order.status;
    let baseMsg = `Olá ${order.customerName}, sobre o seu pedido...`;
    
    if (st === 'Feito') baseMsg = config.whatsappMessages?.orderDone?.replace('{customerName}', order.customerName) || `Olá ${order.customerName}, recebemos o seu pedido!`;
    else if (st === 'Em Preparo') baseMsg = `Olá ${order.customerName}, seu pedido já foi para a cozinha e está sendo preparado!`;
    else if (st === 'Pronto') {
      if (order.orderType === 'Delivery') {
        baseMsg = `Olá ${order.customerName}, seu pedido está pronto e saiu para entrega!`;
      } else {
        baseMsg = `Olá ${order.customerName}, seu pedido está pronto e já pode vir retirar!`;
      }
    }
    else if (st === 'A caminho') baseMsg = config.whatsappMessages?.orderDispatched?.replace('{customerName}', order.customerName) || `Olá ${order.customerName}, seu pedido já saiu para entrega e está a caminho! 🛵💨`;
    else if (st === 'Entregue') baseMsg = config.whatsappMessages?.orderDelivered?.replace('{customerName}', order.customerName) || `Olá ${order.customerName}, seu pedido foi entregue. Muito obrigado pela preferência!`;
    
    // Build items summary
    let itemsTxt = '\\n\\n*Resumo do Pedido:*\\n';
    order.items.forEach(item => {
      itemsTxt += `• ${item.quantity}x ${item.productName}\\n`;
    });
    
    if (order.orderType === 'Delivery' && order.address) {
      itemsTxt += `\\n*Endereço:* ${order.address.street}, ${order.address.number} - ${order.address.neighborhood}`;
    }
    
    return encodeURIComponent(baseMsg + itemsTxt);
  };

  const verifyWhatsAppAutomation = async (order: Order, newStatus: OrderStatus) => {
    let shouldAutoSend = false;
    if (newStatus === 'Feito' && config.whatsappAutomations?.orderDone) shouldAutoSend = true;
    if (newStatus === 'Em Preparo' && config.whatsappAutomations?.orderPreparing) shouldAutoSend = true;
    if (newStatus === 'Pronto' && config.whatsappAutomations?.orderReady) shouldAutoSend = true;
    if (newStatus === 'A caminho' && config.whatsappAutomations?.orderDispatched) shouldAutoSend = true;
    if (newStatus === 'Entregue' && config.whatsappAutomations?.orderDelivered) shouldAutoSend = true;

    if (shouldAutoSend && order.customerPhone) {
      let phoneStr = order.customerPhone.replace(/\D/g, '');
      if (!phoneStr.startsWith('55')) phoneStr = `55${phoneStr}`;
      
      const text = getWhatsAppMessage(order, newStatus);
      
      // Send silently via Evolution API if enabled
      if (config.whatsappApiConfig?.enabled && config.whatsappApiConfig.apiUrl && config.whatsappApiConfig.instanceId) {
        try {
          // Fire and forget via fetch to URL
          const endpoint = `${config.whatsappApiConfig.apiUrl.replace(/\/$/, '')}/message/sendText/${config.whatsappApiConfig.instanceId}`;
          await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': config.whatsappApiConfig.token || ''
            },
            body: JSON.stringify({
              number: phoneStr,
              text: decodeURIComponent(text)
            })
          });
          toast.success('WhatsApp enviado via API (Silencioso).');
          return; // Skip normal window open
        } catch (err) {
          toast.error('Ocorreu um erro ao enviar WPP silencioso');
        }
      }

      // Fallback to normal Web Whatsapp if API is not enabled
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Use intent URI so it doesn't open a new browser tab and leaves the admin screen intact
        window.location.href = `whatsapp://send?phone=${phoneStr}&text=${text}`;
      } else {
        // Use intent URI for desktop as well if they have WhatsApp installed
        const popup = window.open(`https://web.whatsapp.com/send?phone=${phoneStr}&text=${text}`, 'whatsapp_popup', 'width=800,height=600');
        if (!popup) {
           // Fallback to regular WA web
           window.open(`https://api.whatsapp.com/send?phone=${phoneStr}&text=${text}`, '_blank', 'noopener,noreferrer');
        }
      }
    }
  };

  const handleStatusChange = async (order: Order, newStatus: OrderStatus, reason?: string) => {
    try {
      if (newStatus === 'Cancelado') {
        await updateOrderStatus(order.id!, newStatus, reason);
      } else {
        // Trigger WhatsApp automation synchronously before the async update
        // to prevent modern browsers from blocking the popup
        verifyWhatsAppAutomation(order, newStatus);
        
        await updateOrderStatus(order.id!, newStatus);
      }
    } catch (e) {
      alert('Erro ao atualizar status do pedido');
    }
  };

  const submitCancel = async () => {
    if (!cancelingOrder) return;
    await handleStatusChange(cancelingOrder, 'Cancelado', cancelReason);
    setCancelingOrder(null);
  };

  const handlePrint = (order: Order) => {
    // Check if the order is already in the queue to prevent duplicates
    if (!printQueue.some(o => o.id === order.id)) {
      toast.success('Enviando para impressora...');
      setPrintQueue(prev => [...prev, order]);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Carregando pedidos...</div>;

  const renderColumn = (status: OrderStatus, title: string) => {
    const columnOrders = filteredOrders.filter(o => o.status === status);
    
    return (
      <div className="w-[85vw] md:flex-1 md:min-w-[300px] shrink-0 bg-gray-100/50 rounded-2xl p-4 flex flex-col gap-4 snap-center">
        <div className="flex items-center justify-between mb-2 px-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${STATUS_INDICATOR[status]}`}></div>
            <h3 className="font-black text-sm uppercase tracking-widest text-gray-700">{title}</h3>
          </div>
          <span className="bg-white text-gray-500 font-bold text-xs px-2 py-1 rounded-full shadow-sm">{columnOrders.length}</span>
        </div>

        <AnimatePresence mode="popLayout">
          {columnOrders.map(order => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              key={order.id} 
              className={`rounded-xl p-5 border-2 shadow-sm flex flex-col gap-3 transition-all ${STATUS_COLORS[order.status]}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`flex items-center gap-1 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-sm ${order.orderType === 'Delivery' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {order.orderType === 'Delivery' ? <Bike className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                      {order.orderType === 'Delivery' ? 'Delivery' : 'Retirada'}
                    </span>
                    <motion.span 
                       key={order.status}
                       initial={{ backgroundColor: '#fff', color: '#000' }}
                       animate={{ backgroundColor: '#fff', color: '#111827' }}
                       transition={{ duration: 0.3 }}
                       className={`flex items-center gap-1 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-sm bg-white border border-gray-200 text-gray-700 shadow-sm`}
                    >
                       <div className={`w-1.5 h-1.5 rounded-full ${STATUS_INDICATOR[order.status]}`}></div>
                       {order.status}
                    </motion.span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg leading-none">{order.customerName}</h4>
                  <div className="flex flex-col gap-1 mt-2">
                    <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 shrink-0" />
                      Feito às: {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    {order.scheduledDate && order.scheduledTime && (
                      <div className="text-xs text-brand-red font-bold flex items-center gap-1">
                        <Calendar className="w-3 h-3 shrink-0" />
                        Agendado: {order.scheduledDate.split('-').reverse().join('/')} às {order.scheduledTime}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-brand-red">{formatCurrency(order.total)}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{order.paymentMethod}</div>
                </div>
              </div>

              {order.status === 'Cancelado' && order.cancellationReason && (
                <div className="px-3 py-2 bg-red-50 text-red-700 text-xs font-medium rounded-lg mt-1 border border-red-100">
                  <strong className="block text-[9px] uppercase tracking-widest opacity-80 decoration-slice">Motivo do Cancelamento</strong>
                  {order.cancellationReason}
                </div>
              )}
              
              {order.status === 'Em Preparo' && (
                <div className="px-3 py-2 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg mt-1 border border-purple-100 flex items-center gap-1.5 animate-pulse">
                  <TimerIcon className="w-4 h-4 shrink-0" />
                  Tempo de preparo: <ElapsedTimer startTime={order.createdAt} />
                </div>
              )}
              
              <div className="py-3 border-y border-gray-100/50">
                <div className="font-medium text-xs text-gray-600 mb-2">{order.items.length} itens:</div>
                <ul className="text-sm space-y-1 text-gray-800">
                  {order.items.map((item, i) => (
                    <li key={i} className="flex justify-between items-start">
                      <span><span className="font-bold mr-1">{item.quantity}x</span> {item.productName}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-600 gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 shrink-0 text-gray-400" />
                  {order.orderType === 'Delivery' && order.address ? (
                    <span>{order.address.neighborhood} - {order.address.street}, {order.address.number}</span>
                  ) : (
                    <span className="font-bold text-brand-red">Retirada no Local</span>
                  )}
                </div>
                
                {/* Quick Actions Component */}
                <div className="flex gap-1 shrink-0">
                  <button 
                    title="Enviar mensagem no WhatsApp"
                    onClick={async (e) => {
                      e.stopPropagation();
                      let phoneStr = '';
                      if (order.customerPhone) {
                        phoneStr = order.customerPhone.replace(/\D/g, '');
                        if (!phoneStr.startsWith('55')) phoneStr = `55${phoneStr}`;
                      }
                      const text = getWhatsAppMessage(order);
                      
                      // Using API
                      if (config.whatsappApiConfig?.enabled && config.whatsappApiConfig.apiUrl && config.whatsappApiConfig.instanceId) {
                        try {
                          const endpoint = `${config.whatsappApiConfig.apiUrl.replace(/\/$/, '')}/message/sendText/${config.whatsappApiConfig.instanceId}`;
                          await fetch(endpoint, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'apikey': config.whatsappApiConfig.token || ''
                            },
                            body: JSON.stringify({
                              number: phoneStr,
                              text: decodeURIComponent(text)
                            })
                          });
                          toast.success('Mensagem enviada (API Silenciosa)');
                          return;
                        } catch (err) {
                          toast.error('Erro na API.');
                        }
                      }
                      
                      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                      
                      if (isMobile) {
                        window.location.href = `whatsapp://send?phone=${phoneStr}&text=${text}`;
                      } else {
                        const popup = window.open(`https://web.whatsapp.com/send?phone=${phoneStr}&text=${text}`, 'whatsapp_popup', 'width=800,height=600');
                        if (!popup) {
                           window.open(`https://api.whatsapp.com/send?phone=${phoneStr}&text=${text}`, '_blank', 'noopener,noreferrer');
                        }
                      }
                    }} 
                    className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  {order.orderType === 'Delivery' && order.address && (
                    <button 
                      title="Ver no Mapa"
                      onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(`${order.address?.street}, ${order.address?.number} - ${order.address?.neighborhood}`)}`, '_blank')} 
                      className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors"
                    >
                      <MapPin className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status Audit Log */}
              {order.statusLog && order.statusLog.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100/50">
                  <details className="group cursor-pointer">
                    <summary className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 select-none">
                      <span>Histórico de Status</span>
                      <svg className="w-3 h-3 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </summary>
                    <div className="mt-2 space-y-2">
                      {[...order.statusLog].sort((a, b) => b.timestamp - a.timestamp).map((log, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[10px] text-gray-500 bg-gray-50/50 p-1.5 rounded">
                          <span className="font-medium text-gray-700">{log.status}</span>
                          <div className="flex gap-2 items-center">
                            <span className="opacity-75">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="bg-gray-200 px-1 py-0.5 rounded text-[8px] uppercase tracking-wider text-gray-600">{log.user || 'Sistema'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}

              {/* Actions */}
              <div className="mt-2 pt-3 border-t border-gray-200/50 flex flex-wrap gap-2">
                {order.status === 'Feito' && (
                  <button 
                    onClick={() => {
                       handleStatusChange(order, 'Em Preparo');
                    }}
                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-colors"
                  >
                    Enviar para Cozinha
                  </button>
                )}
                {order.status === 'Em Preparo' && (
                  <button 
                    onClick={() => handleStatusChange(order, 'Pronto')}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-colors"
                  >
                    {order.orderType === 'Delivery' ? 'Saiu para Entrega' : 'Pronto para Retirar'}
                  </button>
                )}
                {order.status === 'Pronto' && (
                  <button 
                    onClick={() => handleStatusChange(order, 'Entregue')}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-colors"
                  >
                     {order.orderType === 'Delivery' ? 'Entregue' : 'Retirado'}
                  </button>
                )}
                
                {order.status === 'A caminho' && (
                  <button 
                    onClick={() => handleStatusChange(order, 'Entregue')}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-colors"
                  >
                    Concluir
                  </button>
                )}
                {['Feito', 'Em Preparo', 'A caminho', 'Pronto'].includes(order.status) && (
                  <button 
                    onClick={() => setCancelingOrder(order)}
                    className="flex-1 max-w-[100px] bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-colors"
                  >
                    Cancelar
                  </button>
                )}
                
                <div className="flex w-full mt-1">
                  <button 
                    onClick={() => handlePrint(order)}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-black text-white py-2.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all shadow-md hover:shadow-lg"
                  >
                    <Printer className="w-4 h-4" /> Re-Imprimir Vias (Cozinha & Caixa)
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {columnOrders.length === 0 && (
          <div className="text-center p-6 text-gray-400 text-xs font-medium border-2 border-dashed border-gray-200 rounded-xl">
            Nenhum pedido aqui
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col mb-6 gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="font-black text-xl text-gray-800 tracking-tight">Gestão de Pedidos</h2>
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab('ativos')} 
                className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-colors ${activeTab === 'ativos' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Ativos
              </button>
              <button 
                onClick={() => setActiveTab('historico')} 
                className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-colors ${activeTab === 'historico' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Histórico
              </button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button onClick={() => setDateFilter('today')} className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-colors ${dateFilter === 'today' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Hoje</button>
              <button onClick={() => setDateFilter('yesterday')} className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-colors ${dateFilter === 'yesterday' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Ontem</button>
              <button onClick={() => setDateFilter('custom')} className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-colors ${dateFilter === 'custom' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Por Período</button>
            </div>
            {dateFilter === 'custom' && (
              <div className="flex gap-2 items-center">
                <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-red" />
                <span className="text-gray-400 text-xs font-bold">Até</span>
                <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-red" />
              </div>
            )}
          </div>
        </div>
        
        {activeTab === 'historico' && (
          <div className="flex flex-wrap gap-3 items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
            <input 
               type="text" 
               placeholder="🔎 Buscar por Nº ou Nome..." 
               value={historySearch}
               onChange={e => setHistorySearch(e.target.value)}
               className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-red min-w-[200px]"
            />
            <select 
              value={historyFilterType} 
              onChange={e => setHistoryFilterType(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-red outline-none appearance-none pr-8 cursor-pointer relative"
               style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
            >
              <option value="">Tipo (Todos)</option>
              <option value="Delivery">Delivery</option>
              <option value="Retirada">Retirada</option>
            </select>
            <select 
              value={historyFilterPayment} 
              onChange={e => setHistoryFilterPayment(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-red outline-none appearance-none pr-8 cursor-pointer relative"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
            >
              <option value="">Pagamento (Todos)</option>
              <option value="Pix">Pix</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Cartão de Débito">Cartão de Débito</option>
              <option value="Vale Alimentação">Vale Alimentação</option>
            </select>
          </div>
        )}
      </div>
      
      {activeTab === 'ativos' ? (
        <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar flex gap-6 snap-x snap-mandatory items-start">
          {renderColumn('Feito', 'Novos Pedidos')}
          {renderColumn('Em Preparo', 'Em Preparo')}
          {renderColumn('Pronto', 'Prontos para Entrega/Retirada')}
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar flex gap-6 snap-x snap-mandatory">
          {renderColumn('Entregue', 'Concluídos')}
          {renderColumn('Cancelado', 'Cancelados')}
        </div>
      )}

      {/* Cancelation Modal */}
      {cancelingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl">
            <h3 className="font-black text-xl text-gray-900 tracking-tight mb-4">Cancelar Pedido</h3>
            <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Motivo do Cancelamento</label>
            <select 
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red outline-none mb-6 appearance-none pr-8 relative"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
            >
              <option value="Produto Indisponível">Produto Indisponível</option>
              <option value="A Pedido do Cliente">A Pedido do Cliente</option>
              <option value="Área de Risco / Fora de Cobertura">Área de Risco / Fora de Cobertura</option>
              <option value="Problemas Técnicos">Problemas Técnicos</option>
              <option value="Fechando Estoque / Fim de Expediente">Fim de Expediente</option>
            </select>
            
            <div className="flex gap-3">
               <button 
                 onClick={() => { setCancelingOrder(null); setCancelReason('Produto Indisponível'); }}
                 className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold transition-colors"
               >
                 Voltar
               </button>
               <button 
                 onClick={submitCancel}
                 className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition-colors shadow-md shadow-red-600/20"
               >
                 Confirmar
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Component */}
      <div style={{ display: 'none' }}>
        <ReceiptPrint ref={printRef} order={printingOrder} />
      </div>
    </div>
  );
}
