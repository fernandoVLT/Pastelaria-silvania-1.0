const fs = require('fs');
let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf-8');

const targetStr = `                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Chave Pix</label>
                    <input 
                      type="text" 
                      value={formConfig.pixKey || ''} 
                      onChange={e => setFormConfig({...formConfig, pixKey: e.target.value})}
                      placeholder="Chave Pix"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Nome Beneficiário (Pix)</label>
                    <input 
                      type="text" 
                      value={formConfig.pixReceiverName || ''} 
                      onChange={e => setFormConfig({...formConfig, pixReceiverName: e.target.value})}
                      placeholder="Nome de quem recebe"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Cidade (Pix)</label>
                    <input 
                      type="text" 
                      value={formConfig.pixReceiverCity || ''} 
                      onChange={e => setFormConfig({...formConfig, pixReceiverCity: e.target.value})}
                      placeholder="Cidade"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm"
                    />
                  </div>
                </div>`;

const replacementStr = `                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Chave Pix</label>
                    <input 
                      type="text" 
                      value={formConfig.pixKey || ''} 
                      onChange={e => setFormConfig({...formConfig, pixKey: e.target.value})}
                      placeholder="Chave Pix"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Nome Beneficiário (Pix)</label>
                    <input 
                      type="text" 
                      value={formConfig.pixReceiverName || ''} 
                      onChange={e => setFormConfig({...formConfig, pixReceiverName: e.target.value})}
                      placeholder="Nome de quem recebe"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Cidade (Pix)</label>
                    <input 
                      type="text" 
                      value={formConfig.pixReceiverCity || ''} 
                      onChange={e => setFormConfig({...formConfig, pixReceiverCity: e.target.value})}
                      placeholder="Cidade"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Banco (Pix)</label>
                    <input 
                      type="text" 
                      value={formConfig.pixBank || ''} 
                      onChange={e => setFormConfig({...formConfig, pixBank: e.target.value})}
                      placeholder="Ex: Nubank, Inter, Banco do Brasil"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm"
                    />
                  </div>
                </div>`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/components/AdminModal.tsx', code);
