const fs = require('fs');
let code = fs.readFileSync('src/components/CheckoutModal.tsx', 'utf-8');

code = code.replace(
  `                    <div>
                      <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Número *</label>
                      <input
                        type="text"
                        value={addressNumber}
                        onChange={(e) => setAddressNumber(e.target.value)}
                        placeholder="Nº"
                        className="w-full bg-white border border-gray-200 rounded-xl p-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent text-sm font-bold"
                      />
                    </div>
                  </div>`,
  `                    <div>
                      <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Número *</label>
                      <input
                        type="text"
                        value={addressNumber}
                        onChange={(e) => setAddressNumber(e.target.value)}
                        placeholder="Nº"
                        className="w-full bg-white border border-gray-200 rounded-xl p-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent text-sm font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Ponto de Referência (Opcional)</label>
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="Ex: Próximo ao supermercado"
                      className="w-full bg-white border border-gray-200 rounded-xl p-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent text-sm font-bold"
                    />
                  </div>`
);
fs.writeFileSync('src/components/CheckoutModal.tsx', code);
