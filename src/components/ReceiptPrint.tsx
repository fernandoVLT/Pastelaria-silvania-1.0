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
      <div className="receipt-header" style={{ textAlign: 'center', marginBottom: '4px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 2px' }}>
          Pastelaria da Silvânia
        </h2>
        <div style={{ fontSize: '10px', fontWeight: 'bold', border: '1px solid #000', display: 'inline-block', padding: '1px 4px', textTransform: 'uppercase', lineHeight: '1.1' }}>
          VIA {type === 'kitchen' ? 'COZINHA' : 'MOTOBOY / ENTREGA'}
        </div>
      </div>
      
      <div className="receipt-details text-[11px] space-y-0.5 mb-1.5 border-y border-dashed border-black py-1">
        <div className="flex justify-between">
          <span><strong>Pedido:</strong> #{order.id?.substring(0,6).toUpperCase()}</span>
          <span>{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
        <div><strong>Data:</strong> {new Date(order.createdAt).toLocaleDateString()}</div>
        <div><strong>Cliente:</strong> {order.customerName}</div>
        {order.customerPhone && <div><strong>Tel:</strong> {order.customerPhone}</div>}
        <div><strong>Tipo:</strong> {order.orderType}</div>
        {order.observation && <div className="mt-1 font-bold border border-black p-1 text-[10px] bg-gray-50">OBS: {order.observation}</div>}
      </div>

      <div className="receipt-items mb-1.5 border-b border-dashed border-black pb-1">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex flex-col text-[11px] mb-1 leading-tight">
            <div className="flex justify-between items-start">
              <div style={{ flex: 1, paddingRight: '5px' }}>
                <strong>{item.quantity}x</strong> {item.productName}
              </div>
              {type === 'dispatch' && <div>{formatCurrency(item.price * item.quantity)}</div>}
            </div>
            {item.category && (
              <div style={{ paddingLeft: '14px', fontSize: '9px', color: '#333', fontWeight: 'bold' }}>
                [{item.category}]
              </div>
            )}
          </div>
        ))}
      </div>

      {type === 'dispatch' && (
         <div className="receipt-totals text-[11px] mb-1.5 border-b border-dashed border-black pb-1 space-y-0.5">
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
           <div className="flex justify-between font-bold text-[12px]">
             <span>Total:</span>
             <span>{formatCurrency(order.total)}</span>
           </div>
         </div>
      )}

      {type === 'dispatch' && order.orderType === 'Delivery' && order.address && (
         <div className="receipt-address text-[11px] mb-1.5 border-b border-dashed border-black pb-1">
           <div className="font-bold mb-0.5 uppercase text-[9px]">Endereço de Entrega:</div>
           <div>{order.address.street}, {order.address.number}</div>
           <div>{order.address.neighborhood}</div>
           {order.address.complement && <div className="text-[9.5px] italic">({order.address.complement})</div>}
         </div>
      )}

      {type === 'dispatch' && order.orderType === 'Delivery' && order.paymentMethod && (
         <div className="receipt-payment text-[11px] mb-0.5">
           <strong>Pagamento:</strong> {order.paymentMethod}
         </div>
      )}

      {order.scheduledDate && order.scheduledTime && (
         <div className="receipt-schedule text-[9px] mt-1 bg-gray-50 p-1 text-center font-bold border border-black border-dashed">
            AGENDADO: {order.scheduledDate.split('-').reverse().join('/')} às {order.scheduledTime}
         </div>
      )}
    </div>
  );

  return (
    <div ref={ref} className="receipt-container" style={{ padding: '0', width: '280px', fontFamily: 'monospace', color: '#000', backgroundColor: '#fff', fontSize: '11px', lineHeight: '1.2' }}>
      <style>
        {`
          @media print {
            @page {
              margin: 0 !important;
              size: auto;
            }
            body { 
              margin: 0 !important; 
              padding: 0 !important; 
              background: #fff !important; 
            }
            .receipt-container { 
              width: 100% !important; 
              max-width: 80mm !important; 
              margin: 0 !important; 
              padding: 0 !important; 
              display: block !important; 
            }
            .receipt-via { 
              display: block !important; 
              page-break-inside: avoid !important; 
              break-inside: avoid !important; 
              margin: 0 !important;
              padding: 1mm 2mm !important;
            }
            .page-break { 
              display: block !important;
              page-break-after: always !important; 
              break-after: page !important; 
              clear: both;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              height: 0 !important;
            }
          }
          .receipt-container * { box-sizing: border-box; }
        `}
      </style>
      {type === 'kitchen' && renderVia('kitchen')}
      {type === 'dispatch' && renderVia('dispatch')}
      {type === 'all' && (
        <>
          {renderVia('kitchen')}
          <div className="page-break" />
          {renderVia('dispatch')}
        </>
      )}
    </div>
  );
});

ReceiptPrint.displayName = 'ReceiptPrint';
