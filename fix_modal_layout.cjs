const fs = require('fs');
let code = fs.readFileSync('src/components/CustomerOrdersModal.tsx', 'utf-8');

code = code.replace(
  `                    <button 
                      onClick={() => setTrackingOrder(trackingOrder === order.id ? null : (order.id || null))}`,
  `                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setTrackingOrder(trackingOrder === order.id ? null : (order.id || null))}`
);

code = code.replace(
  `                      Refazer Pedido
                    </button>`,
  `                      Refazer Pedido
                    </button>
                    </div>`
);
fs.writeFileSync('src/components/CustomerOrdersModal.tsx', code);
