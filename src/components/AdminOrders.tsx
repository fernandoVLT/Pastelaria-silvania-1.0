import React, { useState, useEffect, useRef } from 'react';
import { useOrders } from '../hooks/useOrders';
import { Order, OrderStatus } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { Printer, MapPin, Phone, MessageSquare, Clock, Calendar, Store, Check, Bike, Timer as TimerIcon, X } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { motion, AnimatePresence } from 'motion/react';
import { useReactToPrint } from 'react-to-print';
import { printDirectToUsb } from '../utils/printUsb';
import { ReceiptPrint } from './ReceiptPrint';
import { notify } from './NotificationOverlay';

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
  'Aguardando Confirmação Pix': 'bg-teal-100 border-teal-300 text-teal-800',
  'Feito': 'bg-yellow-100 border-yellow-300 text-yellow-800',
  'Em Preparo': 'bg-purple-100 border-purple-300 text-purple-800',
  'Pronto': 'bg-orange-100 border-orange-300 text-orange-800',
  'A caminho': 'bg-blue-100 border-blue-300 text-blue-800',
  'Entregue': 'bg-green-100 border-green-300 text-green-800',
  'Cancelado': 'bg-red-100 border-red-300 text-red-800'
};

const STATUS_INDICATOR = {
  'Aguardando Confirmação Pix': 'bg-teal-500',
  'Feito': 'bg-yellow-500',
  'Em Preparo': 'bg-purple-500',
  'Pronto': 'bg-orange-500',
  'A caminho': 'bg-blue-500',
  'Entregue': 'bg-green-500',
  'Cancelado': 'bg-red-500'
};

export function AdminOrders() {
  const { orders, loading, updateOrderStatus, markOrderAsPrinted } = useOrders();
  const { config, setConfig } = useStore();

  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<'ativos' | 'historico' | 'fila_impressao'>('ativos');

  const [cancelingOrder, setCancelingOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('Produto Indisponível');

  const [historyFilterType, setHistoryFilterType] = useState<string>('');
  const [historyFilterPayment, setHistoryFilterPayment] = useState<string>('');
  const [historySearch, setHistorySearch] = useState<string>('');

  const printedOrdersRef = useRef<Set<string>>(
    (() => {
      try {
        const stored = localStorage.getItem('printedOrders');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            return new Set<string>(parsed);
          }
        }
      } catch (e) {
        console.error('Error loading printed orders:', e);
      }
      return new Set<string>();
    })()
  );
  
  const printRef = useRef<HTMLDivElement>(null);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [printQueue, setPrintQueue] = useState<Order[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);

  const persistPrintedOrders = () => {
    try {
      const arr = Array.from(printedOrdersRef.current).slice(-2000); // keep max 2000
      localStorage.setItem('printedOrders', JSON.stringify(arr));
    } catch (e) {
      console.error('Error saving printed orders:', e);
    }
  };

  const executePrint = useReactToPrint({ 
    contentRef: printRef,
    onAfterPrint: () => {
      setPrintingOrder(null);
      setIsPrinting(false);
      setPrintQueue(prev => prev.slice(1));
      notify.success('Impressão concluída.');
    },
    onPrintError: () => {
      notify.error('Erro na impressão. Tente novamente.');
      setPrintingOrder(null);
      setIsPrinting(false);
      setPrintQueue(prev => prev.slice(1));
    }
  });

  useEffect(() => {
    const processQueue = async () => {
      if (printQueue.length === 0 || isPrinting) return;

      setIsPrinting(true);
      const nextOrder = printQueue[0];

      // If USB printing is enabled, send directly to USB and mark as done
      if (config.printConfig?.usbPrinter) {
        try {
          const success = await printDirectToUsb(nextOrder, config.printConfig.usbPrinter);
          if (success) {
            notify.success('Impresso via USB com sucesso!');
            setPrintQueue(prev => prev.slice(1));
            setIsPrinting(false);
            return;
          } else {
            console.warn('USB print returned false, falling back to browser print');
          }
        } catch (err) {
          console.error('USB print failed, falling back to browser print:', err);
        }
      }

      // Fallback/Standard browser printing
      setPrintingOrder(nextOrder);
      setTimeout(() => {
        executePrint();
      }, 150); // Shorter delay for instant browser print trigger
    };

    processQueue();
  }, [printQueue, isPrinting, config.printConfig?.usbPrinter, executePrint]);

  useEffect(() => {
    // Only process when orders are loaded
    if (loading) return;
    
    const autoPrintEnabled = config.printConfig?.autoPrint ?? true;
    const autoPrintDelivery = config.printConfig?.autoPrintDelivery ?? true;
    const autoPrintPickup = config.printConfig?.autoPrintPickup ?? true;
    
    const nowMs = Date.now();
    const oneHourMs = 1 * 60 * 60 * 1000;

    // Check for new orders in 'Feito' status that haven't been printed yet
    const unprintedNewOrders = orders.filter(
      (o) => o.status === 'Feito' && !o.hasBeenPrinted && !printedOrdersRef.current.has(o.id!) && (nowMs - o.createdAt < oneHourMs)
    );
    
    if (unprintedNewOrders.length > 0) {
      setTimeout(() => {
        unprintedNewOrders.forEach((order) => {
          if (!printedOrdersRef.current.has(order.id!)) {
            printedOrdersRef.current.add(order.id!);
            markOrderAsPrinted(order.id!); // Sync to Firebase so other devices know it was queued
            if (autoPrintEnabled) {
              const isDelivery = order.orderType === 'Delivery';
              if ((isDelivery && autoPrintDelivery) || (!isDelivery && autoPrintPickup)) {
                handlePrint(order);
              }
            }
          }
        });
        persistPrintedOrders();
      }, 500);
    }
    
    let updatedSet = false;
    // Also add to set if they are already past 'Feito' (such as Em Preparo, Pronto, etc) or very old, or already printed elsewhere, so we don't accidentally print them later.
    // Note: Do NOT mark 'Aguardando Confirmação Pix' as printed here, because we want it to print once it gets confirmed and changes status to 'Feito'!
    const pastStatuses = ['Em Preparo', 'Pronto', 'A caminho', 'Entregue', 'Cancelado'];
    orders.forEach(o => {
       const isPastStatus = pastStatuses.includes(o.status);
       if ((o.hasBeenPrinted || isPastStatus || (nowMs - o.createdAt >= oneHourMs)) && !printedOrdersRef.current.has(o.id!)) {
          printedOrdersRef.current.add(o.id!);
          updatedSet = true;
       }
    });

    if (updatedSet) {
      persistPrintedOrders();
    }

  }, [orders, loading, config.printConfig?.autoPrint, config.printConfig?.autoPrintDelivery, config.printConfig?.autoPrintPickup, markOrderAsPrinted]);

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
          notify.success('WhatsApp enviado via API (Silencioso).');
          return; // Skip normal window open
        } catch (err) {
          notify.error('Ocorreu um erro ao enviar WPP silencioso');
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
      notify.error('Erro ao atualizar status do pedido');
    }
  };

  const submitCancel = async () => {
    if (!cancelingOrder) return;
    await handleStatusChange(cancelingOrder, 'Cancelado', cancelReason);
    setCancelingOrder(null);
  };

  const handlePrint = async (order: Order) => {
    // Check if the order is already in the queue to prevent duplicates
    setPrintQueue(prev => {
      if (prev.some(o => o.id === order.id)) return prev;
      return [...prev, order];
    });
    
    if (order.id && !order.hasBeenPrinted) {
      markOrderAsPrinted(order.id);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Carregando pedidos...</div>;

  const handleDrop = async (e: React.DragEvent, newStatus: OrderStatus) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('orderId');
    if (!orderId) return;
    
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status === newStatus || newStatus === 'Cancelado') return; // Cancel must go through the modal
    
    await handleStatusChange(order, newStatus);
  };

  const renderColumn = (status: OrderStatus, title: string) => {
    const columnOrders = filteredOrders.filter(o => o.status === status);
    
    return (
      <div 
        className="w-[85vw] md:flex-1 md:min-w-[300px] shrink-0 bg-gray-100/50 rounded-2xl p-4 flex flex-col gap-4 snap-center transition-colors hover:bg-gray-200/50"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, status)}
      >
        <div className="flex items-center justify-between mb-2 px-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${STATUS_INDICATOR[status]}`}></div>
            <h3 className="font-black text-sm uppercase tracking-widest text-gray-700">{title}</h3>
          </div>
          <span className="bg-white text-gray-500 font-bold text-xs px-2 py-1 rounded-full shadow-sm">{columnOrders.length}</span>
        </div>

        <AnimatePresence>
          {columnOrders.map(order => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              key={order.id} 
              className={`rounded-lg p-2 border shadow-sm flex flex-col gap-1 cursor-grab active:cursor-grabbing transition-all ${STATUS_COLORS[order.status]}`}
              draggable
              onDragStart={(e: any) => e.dataTransfer.setData('orderId', order.id)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-1 mb-1">
                    <span className={`flex items-center gap-1 text-[7px] font-black tracking-widest uppercase px-1 py-0.5 rounded-sm ${order.orderType === 'Delivery' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {order.orderType === 'Delivery' ? <Bike className="w-2.5 h-2.5" /> : <Store className="w-2.5 h-2.5" />}
                      {order.orderType === 'Delivery' ? 'Delivery' : 'Retirada'}
                    </span>
                    <motion.span 
                       key={order.status}
                       initial={{ backgroundColor: '#fff', color: '#000' }}
                       animate={{ backgroundColor: '#fff', color: '#111827' }}
                       transition={{ duration: 0.3 }}
                       className={`flex items-center gap-1 text-[7px] font-black tracking-widest uppercase px-1 py-0.5 rounded-sm bg-white border border-gray-200 text-gray-700 shadow-sm`}
                    >
                       <div className={`w-1 h-1 rounded-full ${STATUS_INDICATOR[order.status]}`}></div>
                       {order.status}
                    </motion.span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-xs leading-none">{order.customerName}</h4>
                  <div className="flex flex-col mt-1">
                    <div className="text-[9px] text-gray-500 font-medium flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 shrink-0" />
                      {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    {order.scheduledDate && order.scheduledTime && (
                      <div className="text-[9px] text-brand-red font-bold flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5 shrink-0" />
                        Agendado: {order.scheduledDate.split('-').reverse().join('/')} às {order.scheduledTime}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-brand-red text-xs">{formatCurrency(order.total)}</div>
                  <div className="text-[8px] font-bold uppercase tracking-widest text-gray-400">{order.paymentMethod}</div>
                </div>
              </div>

              {order.status === 'Cancelado' && order.cancellationReason && (
                <div className="px-1.5 py-1 bg-red-50 text-red-700 text-[9px] font-medium rounded-md mt-0 border border-red-100">
                  <strong className="block text-[7px] uppercase tracking-widest opacity-80 decoration-slice">Motivo Cancelamento</strong>
                  {order.cancellationReason}
                </div>
              )}
              
              {order.status === 'Em Preparo' && (
                <div className="px-1.5 py-1 bg-purple-50 text-purple-700 text-[9px] font-bold rounded-md mt-0 border border-purple-100 flex items-center gap-1 animate-pulse">
                  <TimerIcon className="w-2.5 h-2.5 shrink-0" />
                  Preparo: <ElapsedTimer startTime={order.createdAt} />
                </div>
              )}
              
              <div className="py-1 border-y border-gray-100/50">
                <div className="font-medium text-[9px] text-gray-600 mb-0.5">{order.items.length} itens:</div>
                <ul className="text-[10px] space-y-0 text-gray-800">
                  {order.items.map((item, i) => (
                    <li key={i} className="flex flex-col items-start leading-tight mb-1">
                      <span><span className="font-bold mr-1">{item.quantity}x</span> {item.productName}</span>
                      {item.category && (
                        <span className="text-[8px] text-gray-500 font-bold tracking-widest pl-4">{item.category}</span>
                      )}
                      {item.description && (
                        <span className="text-[9px] text-gray-500 font-medium pl-4">{item.description}</span>
                      )}
                      {item.observation && (
                        <span className="text-[9px] text-gray-400 italic pl-4 font-medium">"{item.observation}"</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between text-[10px] text-gray-600 gap-2">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0 text-gray-400" />
                  {order.orderType === 'Delivery' && order.address ? (
                    <span className="leading-tight">{order.address.neighborhood} - {order.address.street}, {order.address.number}</span>
                  ) : (
                    <span className="font-bold text-brand-red">Retirada no Local</span>
                  )}
                </div>
                
                {/* Quick Actions Component */}
                <div className="flex gap-1 shrink-0">
                  <button
                    title="Adicionar à Fila de Impressão"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPrintQueue(prev => [...prev, order]);
                      notify.success('Adicionado à fila de impressão');
                    }}
                    className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
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
                          notify.success('Mensagem enviada (API Silenciosa)');
                          return;
                        } catch (err) {
                          notify.error('Erro na API.');
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
              <div className="mt-1 pt-2 border-t border-gray-200/50 flex flex-wrap gap-1">
                {order.status === 'Feito' && (
                  <button 
                    onClick={() => {
                       handleStatusChange(order, 'Em Preparo');
                    }}
                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-1.5 rounded-md text-[9px] font-bold tracking-widest uppercase transition-colors"
                  >
                    Cozinha
                  </button>
                )}
                {order.status === 'Em Preparo' && (
                  <button 
                    onClick={() => handleStatusChange(order, order.orderType === 'Delivery' ? 'A caminho' : 'Pronto')}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-1.5 rounded-md text-[9px] font-bold tracking-widest uppercase transition-colors"
                  >
                    {order.orderType === 'Delivery' ? 'Saiu para Entrega' : 'Pronto p/ Retirar'}
                  </button>
                )}
                {order.status === 'Pronto' && (
                  <button 
                    onClick={() => handleStatusChange(order, 'Entregue')}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-1.5 rounded-md text-[9px] font-bold tracking-widest uppercase transition-colors"
                  >
                     Pedido Retirado
                  </button>
                )}
                
                {order.status === 'A caminho' && (
                  <button 
                    onClick={() => handleStatusChange(order, 'Entregue')}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-1.5 rounded-md text-[9px] font-bold tracking-widest uppercase transition-colors"
                  >
                    Pedido Entregue
                  </button>
                )}
                {['Feito', 'Em Preparo', 'A caminho', 'Pronto'].includes(order.status) && (
                  <button 
                    onClick={() => setCancelingOrder(order)}
                    className="flex-1 max-w-[70px] bg-red-100 hover:bg-red-200 text-red-700 py-1.5 rounded-md text-[9px] font-bold tracking-widest uppercase transition-colors"
                  >
                    Cancelar
                  </button>
                )}
                
                <div className="flex w-full mt-0.5">
                  <button 
                    onClick={() => handlePrint(order)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-black text-white py-1.5 rounded-md text-[9px] font-black tracking-widest uppercase transition-all shadow-sm hover:shadow-md"
                  >
                    <Printer className="w-3 h-3" /> Re-Imprimir Vias
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
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="font-black text-xl text-gray-800 tracking-tight">Gestão de Pedidos</h2>
            
            <button
               onClick={async () => {
                 const current = !!config.whatsappApiConfig?.enabled;
                 await setConfig({
                   ...config,
                   whatsappApiConfig: {
                     ...config.whatsappApiConfig,
                     enabled: !current
                   }
                 });
                 if (!current) notify.success("WhatsApp Conectado (Auto Ativado)");
                 else notify.error("WhatsApp Desconectado (Auto Desativado)");
               }}
               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-colors shadow-sm border ${
                 config.whatsappApiConfig?.enabled 
                 ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' 
                 : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
               }`}
            >
               <MessageSquare className={`w-3.5 h-3.5 ${config.whatsappApiConfig?.enabled ? 'text-green-500' : 'text-gray-400'}`} />
               {config.whatsappApiConfig?.enabled ? 'WPP Conectado' : 'WPP Desconectado'}
            </button>

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
              <button 
                onClick={() => setActiveTab('fila_impressao')} 
                className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-colors ${activeTab === 'fila_impressao' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Fila ({printQueue.length})
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
          {renderColumn('Aguardando Confirmação Pix', 'Aguardando Confirmação Pix')}
          {renderColumn('Feito', 'Novos Pedidos')}
          {renderColumn('Em Preparo', 'Em Preparo')}
          {renderColumn('Pronto', 'Pronto (Retirada)')}
          {renderColumn('A caminho', 'A Caminho')}
        </div>
      ) : activeTab === 'historico' ? (
        <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar flex gap-6 snap-x snap-mandatory">
          {renderColumn('Entregue', 'Concluídos')}
          {renderColumn('Cancelado', 'Cancelados')}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <Printer className="w-6 h-6 text-brand-red" />
                Fila de Impressão
              </h3>
              <p className="text-sm text-gray-500 font-medium mt-1">Pedidos aguardando para serem impressos.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setConfig({
                     ...config,
                     printConfig: {
                        ...(config.printConfig || { autoPrintDelivery: true, autoPrintPickup: true }),
                        autoPrint: !(config.printConfig?.autoPrint ?? true)
                     }
                  });
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  (config.printConfig?.autoPrint ?? true) 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Pausar ou ativar impressão automática para novos pedidos Finalizados"
              >
                <Printer className="w-4 h-4" />
                Auto: {(config.printConfig?.autoPrint ?? true) ? 'ON' : 'OFF'}
              </button>
              
              <button
                 onClick={() => {
                   printQueue.forEach(order => order.id && printedOrdersRef.current.add(order.id));
                   persistPrintedOrders();
                   setPrintQueue([]);
                   setPrintingOrder(null);
                   notify.success('Fila de impressão limpa!');
                 }}
                 className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition-colors"
                 disabled={printQueue.length === 0}
              >
                 Limpar Fila
              </button>
            </div>
          </div>

          {printQueue.length === 0 && !printingOrder ? (
            <div className="text-center py-12 flex flex-col items-center">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                 <Printer className="w-8 h-8" />
               </div>
               <p className="text-gray-500 font-medium">Nenhum pedido na fila de impressão.</p>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl">
              {printingOrder && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between animate-pulse">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-blue-500 mb-1">
                      Imprimindo Agora (Cozinha e Entrega)
                    </span>
                    <span className="font-bold text-gray-900">{printingOrder.customerName} - Pedido #{printingOrder.id?.substring(0, 6) || 'N/A'}</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">{new Date(printingOrder.createdAt).toLocaleString()}</span>
                  </div>
                  <Printer className="w-6 h-6 text-blue-500 animate-bounce" />
                </div>
              )}
              {printQueue.slice(printingOrder ? 1 : 0).map((order, i) => (
                <div key={order.id || i} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">
                       Posição #{printingOrder ? i + 2 : i + 1}
                    </span>
                    <span className="font-bold text-gray-900">{order.customerName} - Pedido #{order.id?.substring(0, 6) || 'N/A'}</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">{new Date(order.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                      {formatCurrency(order.total)}
                    </span>
                    <button 
                      onClick={() => {
                         setPrintQueue(prev => prev.filter(o => o.id !== order.id));
                         notify.success('Removido da fila de impressão');
                      }}
                      className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors cursor-pointer ml-2 border border-red-100"
                      title="Cortar Impressão / Remover da Fila"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-200 px-3 py-1.5 rounded-lg uppercase tracking-widest hidden sm:block">
                      Aguardando
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
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
      <div className="absolute overflow-hidden w-0 h-0 top-0 left-0 pointer-events-none opacity-0">
        {printingOrder && <ReceiptPrint ref={printRef} order={printingOrder} type="all" />}
      </div>
    </div>
  );
}
