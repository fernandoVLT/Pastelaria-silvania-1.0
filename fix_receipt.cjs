const fs = require('fs');
let code = fs.readFileSync('src/components/ReceiptPrint.tsx', 'utf-8');

// 1. Remove category display
code = code.replace(
  `              {item.category && (
                <div style={{ paddingLeft: '14px', fontSize: type === 'kitchen' ? '12px' : '9px', color: '#000', fontWeight: 'bold' }}>
                  [{emphasizeSize(item.category)}]
                </div>
              )}`,
  ``
);

// 2. Add address and reference to kitchen via too
// Wait, currently address is only shown if type === 'dispatch'.
// Let's find: "{type === 'dispatch' && order.orderType === 'Delivery' && order.address && ("
// and change to "{order.orderType === 'Delivery' && order.address && ("
code = code.replace(
  `      {type === 'dispatch' && order.orderType === 'Delivery' && order.address && (
         <div className="receipt-address text-[11px] mb-1.5 border-b border-dashed border-black pb-1">
           <div className="font-bold mb-0.5 uppercase text-[9px]">Endereço de Entrega:</div>
           <div>{order.address.street}, {order.address.number}</div>
           <div>{order.address.neighborhood}</div>
           {order.address.complement && <div className="text-[9.5px] italic">({order.address.complement})</div>}
         </div>
      )}`,
  `      {order.orderType === 'Delivery' && order.address && (
         <div className="receipt-address text-[11px] mb-1.5 border-b border-dashed border-black pb-1" style={{ fontSize: type === 'kitchen' ? '13px' : '11px' }}>
           <div className="font-bold mb-0.5 uppercase" style={{ fontSize: type === 'kitchen' ? '12px' : '9px' }}>Endereço de Entrega:</div>
           <div style={{ fontWeight: type === 'kitchen' ? 'bold' : 'normal' }}>{order.address.street}, {order.address.number}</div>
           <div style={{ fontWeight: type === 'kitchen' ? 'bold' : 'normal' }}>{order.address.neighborhood}</div>
           {order.address.reference && <div className="mt-1" style={{ fontWeight: 'bold', fontSize: type === 'kitchen' ? '14px' : '11px', textTransform: 'uppercase' }}>Ref: {order.address.reference}</div>}
         </div>
      )}`
);

// 3. Fix "Forma de Pagamento" and "PIX (PAGO)"
code = code.replace(
  `           <div className="text-[12px] uppercase font-bold mb-1">
             Forma de Pagamento
           </div>
           <div className="text-[16px] font-extrabold uppercase">
             {order.paymentMethod || 'NÃO INFORMADO'}
           </div>`,
  `           <div className="text-[12px] uppercase font-bold mb-1">
             PAGAMENTO:
           </div>
           <div className="text-[16px] font-extrabold uppercase">
             {(order.paymentMethod === 'Pix' || order.paymentMethod === 'Pix Manual') ? order.paymentMethod + ' (PAGO)' : (order.paymentMethod || 'NÃO INFORMADO')}
           </div>`
);

// 4. Skip dispatch via for Retirada
code = code.replace(
  `      {type === 'all' && (
        <>
          {renderVia('kitchen')}
          <div className="page-break" />
          {renderVia('dispatch')}
        </>
      )}`,
  `      {type === 'all' && (
        <>
          {renderVia('kitchen')}
          {order.orderType === 'Delivery' && (
            <>
              <div className="page-break" />
              {renderVia('dispatch')}
            </>
          )}
        </>
      )}`
);

fs.writeFileSync('src/components/ReceiptPrint.tsx', code);
