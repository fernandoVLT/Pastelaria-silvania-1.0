const fs = require('fs');
let code = fs.readFileSync('src/components/AdminOrders.tsx', 'utf-8');

const targetRegex = /                <div className="text-right">[\s\S]*?                  <\/div>\n                <\/div>/g;

const newBlock = `                <div className="text-right">
                  <div className="font-bold text-brand-red text-xs">{formatCurrency(order.total)}</div>
                  <div className="text-[8px] font-bold uppercase tracking-widest text-gray-400">
                    {order.paymentMethod}
                    {order.paymentMethod === 'Dinheiro' && order.needsChange && order.changeFor && (
                      <span className="block text-brand-red mt-0.5">Troco para {formatCurrency(order.changeFor)}</span>
                    )}
                    {order.paymentMethod === 'Dinheiro' && !order.needsChange && (
                      <span className="block text-green-600 mt-0.5">Sem Troco</span>
                    )}
                    {order.pixReceiptUrl && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setViewReceiptUrl(order.pixReceiptUrl!); }}
                        className="mt-1 block w-full text-center py-1 px-2 bg-teal-50 text-teal-600 border border-teal-200 rounded text-[9px] hover:bg-teal-100 transition-colors"
                      >
                        Ver Comprovante
                      </button>
                    )}
                  </div>
                </div>`;

code = code.replace(targetRegex, newBlock);

fs.writeFileSync('src/components/AdminOrders.tsx', code);
