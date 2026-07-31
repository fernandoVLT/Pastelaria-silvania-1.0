const fs = require('fs');
let code = fs.readFileSync('src/components/CheckoutModal.tsx', 'utf-8');

// The file currently has:
// 1. The start of the file
// 2. The isOrderSent block which got truncated
// Let's replace everything from the first `                  {paymentMethod !== 'Pix' && paymentMethod !== 'Pix Manual' && paymentMethod !== 'Dinheiro' && (` onwards up to `        <div className="p-6 border-t border-gray-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-6 sticky bottom-0 z-20 rounded-b-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">`

const targetRegex = /                  \{paymentMethod !== 'Pix'[\s\S]*?(?=        <div className="p-6 border-t border-gray-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-6 sticky bottom-0 z-20 rounded-b-3xl shadow-\[0_-10px_40px_-15px_rgba\(0,0,0,0\.1\)\]">)/g;

const replacementBlock = `          <button 
            onClick={handleCloseSuccess}
            className="mt-6 w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-4 px-6 rounded-xl transition-colors uppercase tracking-widest text-[10px]"
          >
            Voltar para o Menu
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white border border-gray-100 md:rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col rounded-t-3xl animate-in slide-in-from-bottom-full md:zoom-in-95 duration-300 h-[92vh] md:h-[85vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-20">
          <h2 className="font-black text-xl tracking-tight uppercase text-gray-900">Finalizar Pedido</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/50 relative scroll-smooth">
          <div className="space-y-6">
            
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-4">Seus Dados</label>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Seu Nome Completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
                />
                <input
                  type="tel"
                  placeholder="Seu WhatsApp (Ex: 31 99999-9999)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-4">Forma de Entrega</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setOrderType('Delivery')}
                  className={\`p-4 rounded-xl border-2 font-bold flex flex-col items-center justify-center gap-2 transition-all \${
                    orderType === 'Delivery'
                      ? 'border-brand-red bg-brand-red/5 text-brand-red shadow-sm'
                      : 'border-gray-100 text-gray-400 hover:border-gray-200 hover:bg-gray-50'
                  }\`}
                >
                  <MapPin className={\`w-6 h-6 \${orderType === 'Delivery' ? 'text-brand-red' : 'text-gray-400'}\`} />
                  Delivery
                </button>
                <button
                  onClick={() => setOrderType('Retirada')}
                  className={\`p-4 rounded-xl border-2 font-bold flex flex-col items-center justify-center gap-2 transition-all \${
                    orderType === 'Retirada'
                      ? 'border-brand-red bg-brand-red/5 text-brand-red shadow-sm'
                      : 'border-gray-100 text-gray-400 hover:border-gray-200 hover:bg-gray-50'
                  }\`}
                >
                  <Store className={\`w-6 h-6 \${orderType === 'Retirada' ? 'text-brand-red' : 'text-gray-400'}\`} />
                  Retirada
                </button>
              </div>

              {orderType === 'Delivery' && (
                <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Rua / Avenida"
                      value={address.street}
                      onChange={(e) => setAddress({ ...address, street: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
                    />
                    <input
                      type="text"
                      placeholder="Número"
                      value={address.number}
                      onChange={(e) => setAddress({ ...address, number: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Complemento (Opcional)"
                    value={address.complement}
                    onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
                  />
                  <select
                    value={address.neighborhood}
                    onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all appearance-none"
                  >
                    <option value="" disabled>Selecione seu Bairro...</option>
                    {ALLOWED_NEIGHBORHOODS.map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-4">Forma de Pagamento *</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(orderType === 'Delivery' ? (config.enabledPaymentMethodsDelivery || config.enabledPaymentMethods || FALLBACK_PAYMENT_METHODS) : (config.enabledPaymentMethodsPickup || config.enabledPaymentMethods || FALLBACK_PAYMENT_METHODS)).map((method) => {
                  const methodConfig = 
                    (method === 'Pix' || method === 'Pix Manual') ? { Icon: QrCode, color: 'text-teal-500', bg: 'bg-teal-50', border: 'border-teal-500' } :
                    method === 'Cartão de Crédito' ? { Icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-500' } :
                    method === 'Cartão de Débito' ? { Icon: Wallet, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-500' } :
                    method === 'Dinheiro' ? { Icon: Banknote, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-500' } :
                    { Icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-500' };
                  
                  const { Icon, color, bg, border } = methodConfig;
                  const isSelected = paymentMethod === method;
                  
                  return (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method as PaymentMethod)}
                      className={\`relative border-2 rounded-xl p-4 text-[9px] font-black tracking-widest uppercase transition-all flex flex-col items-center justify-center gap-3 text-center h-28 \${
                        isSelected 
                          ? \`\${border} \${color} \${bg} shadow-md scale-105 z-10 ring-4 ring-\${color.split('-')[1]}-500/20\` 
                          : 'border-gray-200 text-gray-400 bg-white hover:border-gray-300 hover:bg-gray-50 hover:text-gray-600'
                      }\`}
                    >
                      <Icon className={\`w-8 h-8 transition-colors \${isSelected ? color : 'text-gray-300 group-hover:text-gray-500'}\`} />
                      <span>{method}</span>
                      {isSelected && (
                         <div className={\`absolute -top-2 -right-2 w-5 h-5 rounded-full \${bg} border-2 \${border} flex items-center justify-center\`}>
                           <div className={\`w-2 h-2 rounded-full \${bg.replace('50', '500')}\`}></div>
                         </div>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {paymentMethod && (
                <div className="mt-6 p-4 bg-white rounded-xl border border-gray-100 flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
                  {paymentMethod === 'Pix' && (
                    <div className="flex flex-col items-center text-center w-full">
                      <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-3">
                         <QrCode className="w-6 h-6" />
                      </div>
                      <p className="text-xs text-gray-700 font-bold mb-1">
                        Pagamento Seguro via PIX {config.bbPixConfig?.enabled ? '(Banco do Brasil)' : ''}
                      </p>
                      <p className="text-[10px] text-gray-500 font-medium">Após confirmar, você receberá o QR Code para pagar e seu pedido será enviado pelo WhatsApp.</p>
                    </div>
                  )}

                  {paymentMethod === 'Pix Manual' && (
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
                  )}

                  {paymentMethod === 'Dinheiro' && (
                    <div className="flex flex-col items-center text-center w-full">
                      <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                         <Banknote className="w-6 h-6" />
                      </div>
                      <p className="text-xs text-gray-700 font-bold mb-4">Pagamento em Dinheiro</p>
                      
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-sm font-medium text-gray-600">Precisa de troco?</span>
                        <button
                          onClick={() => {
                            setNeedsChange(!needsChange);
                            if (needsChange) setChangeFor('');
                          }}
                          className={\`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2 \${needsChange ? 'bg-brand-red' : 'bg-gray-200'}\`}
                        >
                          <span className={\`inline-block h-4 w-4 transform rounded-full bg-white transition-transform \${needsChange ? 'translate-x-6' : 'translate-x-1'}\`} />
                        </button>
                      </div>
                      
                      {needsChange && (
                        <div className="w-full animate-in fade-in slide-in-from-top-2">
                          <input
                            type="text"
                            placeholder="Troco para quanto? (Ex: 50)"
                            value={changeFor}
                            onChange={(e) => setChangeFor(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all text-center"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {paymentMethod !== 'Pix' && paymentMethod !== 'Pix Manual' && paymentMethod !== 'Dinheiro' && (
                    <div className="flex flex-col items-center text-center py-4">
                      <p className="text-xs text-gray-500 mb-6 font-medium">Lembre-se de preparar o pagamento na entrega/retirada.</p>
                      <div className="flex items-center gap-2 bg-gray-100 text-gray-600 px-6 py-3 rounded-full text-xs font-bold tracking-widest uppercase transition-colors shadow-sm">
                        <Wallet className="w-4 h-4" />
                        Aguardando Pagamento Presencial
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
`;

code = code.replace(targetRegex, replacementBlock);

fs.writeFileSync('src/components/CheckoutModal.tsx', code);
