const fs = require('fs');
let code = fs.readFileSync('src/components/CheckoutModal.tsx', 'utf-8');

// Update button disable logic
code = code.replace(
  '            disabled={isCreating}',
  '            disabled={isCreating || (paymentMethod === "Pix Manual" && !pixReceiptUrl)}'
);

// Add ImageUploadInput in Pix Manual block
// Replace the hardcoded block:
const targetPixManualBlock = `                  {paymentMethod === 'Pix Manual' && (
                    <div className="flex flex-col items-center text-center w-full">
                      <p className="text-xs text-brand-red mb-2 font-bold uppercase tracking-widest flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Atenção!</p>
                      <p className="text-[10px] text-gray-500 font-medium mb-4">O pedido só será aceito após o envio do comprovante Pix no número da loja.</p>
                      
                      <div className="p-3 bg-white border border-gray-200 rounded-2xl shadow-sm mb-4 relative">
                        <QRCodeSVG value={generatePixCode('5531996698807', 'SILVANIA BARRETO DE ALMEIDA', 'BELO HORIZONTE', finalTotal)} size={140} level="M" includeMargin={true} />
                      </div>
                      
                      <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col gap-3">
                        <div className="flex justify-between items-center bg-white border border-gray-200 rounded-lg p-3">
                           <div className="flex flex-col text-left">
                             <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Chave Celular</span>
                             <span className="font-mono font-bold text-gray-700 mt-0.5 text-xs">+5531996698807</span>
                           </div>
                           <button
                             type="button"
                             onClick={(e) => {
                                e.preventDefault();
                                navigator.clipboard.writeText('5531996698807');
                                notify.success('Chave copiada!');
                             }}
                             className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                             aria-label="Copiar Chave"
                           >
                             <Copy className="w-3 h-3" />
                           </button>
                        </div>
    
                        <div className="flex flex-col gap-2 mt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              const code = generatePixCode('5531996698807', 'SILVANIA BARRETO DE ALMEIDA', 'BELO HORIZONTE', finalTotal);
                              navigator.clipboard.writeText(code);
                              notify.success('Código PIX Copia e Cola copiado!');
                            }}
                            className="bg-teal-500 hover:bg-teal-600 text-white w-full py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 shadow-sm"
                          >
                            <Copy className="w-4 h-4" />
                            Copiar Código Copia e Cola
                          </button>
                        </div>
                      </div>
                    </div>
                  )}`;

const newPixManualBlock = `                  {paymentMethod === 'Pix Manual' && (
                    <div className="flex flex-col items-center text-center w-full">
                      <p className="text-xs text-brand-red mb-2 font-bold uppercase tracking-widest flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Atenção!</p>
                      <p className="text-[10px] text-gray-500 font-medium mb-4">Efetue o pagamento abaixo e <strong>anexe o comprovante</strong> para liberar o pedido.</p>
                      
                      <div className="p-3 bg-white border border-gray-200 rounded-2xl shadow-sm mb-4 relative">
                        <QRCodeSVG value={generatePixCode(config.pixKey || '', config.pixReceiverName || '', config.pixReceiverCity || '', finalTotal)} size={140} level="M" includeMargin={true} />
                      </div>
                      
                      <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col gap-3">
                        <div className="flex justify-between items-center bg-white border border-gray-200 rounded-lg p-3">
                           <div className="flex flex-col text-left w-full">
                             <div className="flex justify-between items-start w-full">
                               <div className="flex flex-col">
                                 <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Chave Pix</span>
                                 <span className="font-mono font-bold text-gray-700 mt-0.5 text-xs">{config.pixKey || 'Não configurada'}</span>
                               </div>
                               <button
                                 type="button"
                                 onClick={(e) => {
                                    e.preventDefault();
                                    navigator.clipboard.writeText(config.pixKey || '');
                                    notify.success('Chave copiada!');
                                 }}
                                 className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                                 aria-label="Copiar Chave"
                               >
                                 <Copy className="w-3 h-3" />
                               </button>
                             </div>
                             <div className="flex flex-col mt-2 pt-2 border-t border-gray-100">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Favorecido:</span>
                                <span className="font-mono text-gray-600 text-xs">{config.pixReceiverName || 'Não configurado'}</span>
                                {config.pixBank && (
                                  <>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Banco:</span>
                                    <span className="font-mono text-gray-600 text-xs">{config.pixBank}</span>
                                  </>
                                )}
                             </div>
                           </div>
                        </div>
    
                        <div className="flex flex-col gap-2 mt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              const code = generatePixCode(config.pixKey || '', config.pixReceiverName || '', config.pixReceiverCity || '', finalTotal);
                              navigator.clipboard.writeText(code);
                              notify.success('Código PIX Copia e Cola copiado!');
                            }}
                            className="bg-teal-500 hover:bg-teal-600 text-white w-full py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 shadow-sm"
                          >
                            <Copy className="w-4 h-4" />
                            Copiar Código Copia e Cola
                          </button>
                        </div>
                      </div>
                      
                      <div className="w-full mt-4 text-left">
                        <label className="block text-[10px] font-bold tracking-widest uppercase text-brand-red mb-2 text-center">Obrigatório: Anexar Comprovante</label>
                        <ImageUploadInput
                           label=""
                           value={pixReceiptUrl}
                           onChange={setPixReceiptUrl}
                           placeholder="Faça o upload do comprovante..."
                        />
                      </div>
                    </div>
                  )}`;

// Also we should check if they did generatePixCode('5531996698807', 'SILVANIA BARRETO DE ALMEIDA', 'BELO HORIZONTE', finalTotal) elsewhere.
code = code.replace(targetPixManualBlock, newPixManualBlock);

// Replace fallback static keys in Pix:
const staticPixFallback = `          const staticPixKey = config.pixKey || '5531996698807';
          const staticPixName = config.pixReceiverName || 'SILVANIA BARRETO DE ALMEIDA';
          const staticPixCity = config.pixReceiverCity || 'BELO HORIZONTE';`;
          
const newStaticPixFallback = `          const staticPixKey = config.pixKey || '';
          const staticPixName = config.pixReceiverName || '';
          const staticPixCity = config.pixReceiverCity || '';`;

code = code.replace(staticPixFallback, newStaticPixFallback);

fs.writeFileSync('src/components/CheckoutModal.tsx', code);
