const fs = require('fs');
let code = fs.readFileSync('src/components/ReceiptPrint.tsx', 'utf-8');

const getTamanhoFn = `const getTamanho = (category: string) => {
  if (!category) return '';
  const lower = category.toLowerCase();
  if (lower.includes('pequeno')) return 'PEQUENO';
  if (lower.includes('grande')) return 'GRANDE';
  if (lower.includes('médio') || lower.includes('medio')) return 'MÉDIO';
  return '';
};`;

// Add getTamanho inside the loop or before it. Let's put it before the order.items.map
const itemsTarget = `      <div className="receipt-items mb-1.5 border-b border-dashed border-black pb-1">
        {order.items.map((item, idx) => {`;
const itemsReplacement = `      <div className="receipt-items mb-1.5 border-b border-dashed border-black pb-1">
        {order.items.map((item, idx) => {
          const getTamanho = (category: string) => {
            if (!category) return '';
            const lower = category.toLowerCase();
            if (lower.includes('pequeno')) return 'PEQUENO';
            if (lower.includes('grande')) return 'GRANDE';
            if (lower.includes('médio') || lower.includes('medio')) return 'MÉDIO';
            return '';
          };
          const tamanho = getTamanho(item.category || '');`;
code = code.replace(itemsTarget, itemsReplacement);

const itemRowTarget = `              <div className="flex justify-between items-start">
                <div style={{ flex: 1, paddingRight: '5px' }}>
                  <strong style={{ fontSize: type === 'kitchen' ? '1.1em' : '1em' }}>{item.quantity}x</strong> <span className="font-bold">{emphasizeSize(item.productName)}</span>
                </div>`;
const itemRowReplacement = `              <div className="flex justify-between items-start">
                <div style={{ flex: 1, paddingRight: '5px' }}>
                  <strong style={{ fontSize: type === 'kitchen' ? '1.1em' : '1em' }}>{item.quantity}x</strong> <span className="font-bold">{emphasizeSize(item.productName)}</span>
                  {tamanho && (
                    <strong style={{ fontSize: type === 'kitchen' ? '1.6em' : '1.3em', marginLeft: '6px', textTransform: 'uppercase', display: 'inline-block', lineHeight: '1' }}>
                      → {tamanho}
                    </strong>
                  )}
                </div>`;
code = code.replace(itemRowTarget, itemRowReplacement);


const dispatchTarget = `      {type === 'dispatch' && order.orderType === 'Delivery' && order.paymentMethod && (
         <div className="receipt-payment text-[11px] mb-0.5">
           <strong>Pagamento:</strong> {order.paymentMethod}
         </div>
      )}`;
const dispatchReplacement = `      {type === 'dispatch' && order.orderType === 'Delivery' && (
         <div className="receipt-payment text-center p-2 mt-2 mb-1 border-2 border-black">
           <div className="text-[12px] uppercase font-bold mb-1">
             Forma de Pagamento
           </div>
           <div className="text-[16px] font-extrabold uppercase">
             {order.paymentMethod || 'NÃO INFORMADO'}
           </div>
           {order.paymentMethod?.toLowerCase().includes('dinheiro') && order.changeFor ? (
             <div className="text-[12px] font-bold mt-1">
               Troco para: {formatCurrency(order.changeFor)} (Levar {formatCurrency(order.changeFor - order.total)})
             </div>
           ) : null}
           <div className="text-[15px] font-bold mt-1 border-t-2 border-dashed border-black pt-1">
             Valor a Receber: {formatCurrency(order.total)}
           </div>
         </div>
      )}`;
code = code.replace(dispatchTarget, dispatchReplacement);

fs.writeFileSync('src/components/ReceiptPrint.tsx', code);
