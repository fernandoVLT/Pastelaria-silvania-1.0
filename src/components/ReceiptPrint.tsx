import React, { forwardRef } from 'react';
import { Order } from '../types';
import { formatCurrency } from '../utils/formatCurrency';

interface ReceiptPrintProps {
  order: Order | null;
  type?: 'kitchen' | 'dispatch' | 'all';
}

export const ReceiptPrint = forwardRef<HTMLDivElement, ReceiptPrintProps>(({ order, type = 'all' }, ref) => {
  if (!order) return null;

  const renderVia = (type: 'kitchen' | 'dispatch') => (
    <div className="receipt-via">
      <div className="receipt-header">
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 5px' }}>
          Pastelaria da Silvânia
        </h2>
        <div style={{ fontSize: '10px' }}>
          VIA {type === 'kitchen' ? 'COZINHA' : 'MOTOBOY / ENTREGA'}
        </div>
      </div>
      
      <div className="receipt-details text-xs space-y-1 mb-4 border-y border-dashed border-gray-400 py-2">
        <div><strong>Pedido:</strong> #{order.id?.substring(0,6).toUpperCase()}</div>
        <div><strong>Data:</strong> {new Date(order.createdAt).toLocaleString()}</div>
        <div><strong>Cliente:</strong> {order.customerName}</div>
        {order.customerPhone && <div><strong>Tel:</strong> {order.customerPhone}</div>}
        <div><strong>Tipo:</strong> {order.orderType}</div>
        {order.observation && <div className="mt-1 font-bold border border-gray-400 p-1">OBS: {order.observation}</div>}
      </div>

      <div className="receipt-items mb-4 border-b border-dashed border-gray-400 pb-2">
        <div className="font-bold text-xs mb-2 uppercase">Itens do Pedido</div>
        {order.items.map((item, idx) => (
          <div key={idx} className="flex flex-col text-xs mb-2">
            <div className="flex justify-between items-start">
              <div style={{ flex: 1, paddingRight: '10px' }}>
                <strong>{item.quantity}x</strong> {item.productName}
              </div>
              {type === 'dispatch' && <div>{formatCurrency(item.price * item.quantity)}</div>}
            </div>
            {item.category && (
              <div style={{ paddingLeft: '18px', fontSize: '10px', color: '#555', marginTop: '2px', fontWeight: 'bold' }}>
                [{item.category}]
              </div>
            )}
          </div>
        ))}
      </div>

      {type === 'dispatch' && (
         <div className="receipt-totals text-xs mb-4 border-b border-dashed border-gray-400 pb-2">
           <div className="flex justify-between">
             <span>Subtotal:</span>
             <span>{formatCurrency(order.subtotal)}</span>
           </div>
           {order.deliveryFee > 0 && (
             <div className="flex justify-between">
               <span>Taxa de Entrega:</span>
               <span>{formatCurrency(order.deliveryFee)}</span>
             </div>
           )}
           <div className="flex justify-between font-bold text-sm mt-1">
             <span>Total:</span>
             <span>{formatCurrency(order.total)}</span>
           </div>
         </div>
      )}

      {type === 'dispatch' && order.orderType === 'Delivery' && order.address && (
         <div className="receipt-address text-xs mb-4 border-b border-dashed border-gray-400 pb-2">
           <div className="font-bold mb-1 uppercase">Endereço de Entrega</div>
           <div>{order.address.street}, {order.address.number}</div>
           <div>{order.address.neighborhood}</div>
           {order.address.complement && <div>{order.address.complement}</div>}
         </div>
      )}

      {type === 'dispatch' && order.orderType === 'Delivery' && order.paymentMethod && (
         <div className="receipt-payment text-xs">
           <div className="font-bold uppercase">Pagamento (Presencial)</div>
           <div>{order.paymentMethod}</div>
         </div>
      )}

      {order.scheduledDate && order.scheduledTime && (
         <div className="receipt-schedule text-xs mt-3 bg-gray-100 p-2 text-center rounded font-bold border border-gray-400 border-dashed">
            AGENDADO PARA: {order.scheduledDate.split('-').reverse().join('/')} às {order.scheduledTime}
         </div>
      )}
    </div>
  );

  return (
    <div ref={ref} className="receipt-container" style={{ padding: '0', width: '300px', fontFamily: 'monospace', color: '#000', backgroundColor: '#fff', fontSize: '12px' }}>
      <style>
        {`
          @media print {
            body { margin: 0; padding: 0; background: #fff !important; }
            .receipt-container { width: 100% !important; max-width: 80mm !important; margin: 0 auto; display: block !important; }
            .receipt-via { display: block !important; page-break-inside: avoid; break-inside: avoid; }
            .page-break { 
              display: block !important;
              page-break-after: always !important; 
              break-after: page !important; 
              clear: both;
            }
          }
          .receipt-container * { box-sizing: border-box; }
        `}
      </style>
      {type === 'kitchen' && renderVia('kitchen')}
      {type === 'dispatch' && renderVia('dispatch')}
      {type === 'all' && (
        <>
          <div className="page-break">
            {renderVia('kitchen')}
          </div>
          <div>
            {renderVia('dispatch')}
          </div>
        </>
      )}
    </div>
  );
});

ReceiptPrint.displayName = 'ReceiptPrint';
