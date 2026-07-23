const fs = require('fs');
let code = fs.readFileSync('src/components/AdminOrders.tsx', 'utf-8');

const targetActions = `              {/* Actions */}
              <div className="mt-1 pt-2 border-t border-gray-200/50 flex flex-wrap gap-1">
                {order.status === 'Feito' && (`;
                
const replacementActions = `              {/* Actions */}
              <div className="mt-1 pt-2 border-t border-gray-200/50 flex flex-wrap gap-1">
                {order.status === 'Aguardando Confirmação Pix' && (
                  <button 
                    onClick={() => {
                       handleStatusChange(order, 'Feito');
                    }}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-1.5 rounded-md text-[9px] font-bold tracking-widest uppercase transition-colors"
                  >
                    Confirmar Pix
                  </button>
                )}
                {order.status === 'Feito' && (`;
                
code = code.replace(targetActions, replacementActions);

const targetCancel = `{['Feito', 'Em Preparo', 'A caminho', 'Pronto'].includes(order.status) && (`;
const replacementCancel = `{['Aguardando Confirmação Pix', 'Feito', 'Em Preparo', 'A caminho', 'Pronto'].includes(order.status) && (`;
code = code.replace(targetCancel, replacementCancel);

fs.writeFileSync('src/components/AdminOrders.tsx', code);
