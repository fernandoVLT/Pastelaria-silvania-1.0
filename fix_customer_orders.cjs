const fs = require('fs');
let code = fs.readFileSync('src/components/CustomerOrdersModal.tsx', 'utf-8');

if (!code.includes('trackingOrder')) {
  // Add state
  code = code.replace('const [isLoading, setIsLoading] = useState(true);', 'const [isLoading, setIsLoading] = useState(true);\n  const [trackingOrder, setTrackingOrder] = useState<string | null>(null);');

  // Add button
  code = code.replace(
    `<button 
                      onClick={() => handleReorder(order)}`,
    `<button 
                      onClick={() => setTrackingOrder(trackingOrder === order.id ? null : (order.id || null))}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                    >
                      {trackingOrder === order.id ? 'Fechar' : 'Acompanhar'}
                    </button>
                    <button 
                      onClick={() => handleReorder(order)}`
  );

  // Add timeline
  code = code.replace(
    `</div>
                </div>
              ))}
            </div>`,
    `</div>
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
                                <div className={\`absolute -left-[29px] top-0 w-4 h-4 rounded-full border-2 \${isCompleted || isCurrent ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'} \${isCurrent ? 'animate-pulse ring-4 ring-green-100' : ''}\`}>
                                  {(isCompleted) && <svg className="w-full h-full text-white p-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                <div className={\`text-xs font-bold \${isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'}\`}>
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
                </div>
              ))}
            </div>`
  );
  
  fs.writeFileSync('src/components/CustomerOrdersModal.tsx', code);
}
