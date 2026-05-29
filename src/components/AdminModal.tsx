import { X, Plus, Edit2, Trash2, Save, Image as ImageIcon, BarChart3 } from 'lucide-react';
import React, { useState } from 'react';
import { useStore } from '../contexts/StoreContext';
import { Product } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { ImageUploadInput } from './ImageUploadInput';
import { AdminOrders } from './AdminOrders';
import { AdminReports } from './AdminReports';

export function AdminModal({ onClose }: { onClose: () => void }) {
  const { config, setConfig, products, addProduct, updateProduct, deleteProduct } = useStore();
  const [activeTab, setActiveTab] = useState<'orders' | 'config' | 'products' | 'messages' | 'reports'>('orders');

  const [formConfig, setFormConfig] = useState(config);
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  const handleSaveConfig = () => {
    setConfig(formConfig);
    alert('Configurações salvas com sucesso!');
    onClose();
  };

  const handleSaveProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    if (isAddingProduct) {
      addProduct({ ...editingProduct, id: crypto.randomUUID() });
    } else {
      updateProduct(editingProduct);
    }
    
    if (!config.categories.includes(editingProduct.category)) {
      setConfig({ ...config, categories: [...config.categories, editingProduct.category] });
    }
    
    setEditingProduct(null);
    setIsAddingProduct(false);
    alert('Produto salvo com sucesso!');
  };

  const startAddProduct = () => {
    setEditingProduct({
      id: '',
      name: '',
      description: '',
      price: 0,
      category: config.categories[0] || '',
      imageUrl: '',
    });
    setIsAddingProduct(true);
  };

  const handlePasteImage = async () => {
    // Basic paste implementation if they clipboard has image URL
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gray-50 animate-in fade-in duration-200">
      <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-brand-red text-white shadow-md">
        <div className="flex items-center gap-3">
           <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
           <h2 className="font-black text-xl tracking-tight uppercase">Painel de Administração</h2>
        </div>
        <button onClick={() => { setConfig(formConfig); onClose(); }} className="px-4 py-2 bg-white text-brand-red hover:bg-gray-100 rounded-full transition-colors text-xs font-black tracking-widest uppercase flex items-center gap-2 shadow-sm">
          <Save className="w-4 h-4" /> Salvar e Sair
        </button>
      </div>
        
        <div className="flex border-b border-gray-100 px-6">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-3 font-bold text-sm tracking-widest uppercase border-b-2 transition-colors ${activeTab === 'orders' ? 'border-brand-red text-brand-red' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
          >
            Pedidos
          </button>
          <button 
            onClick={() => setActiveTab('config')}
            className={`px-4 py-3 font-bold text-sm tracking-widest uppercase border-b-2 transition-colors ${activeTab === 'config' ? 'border-brand-red text-brand-red' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
          >
            Aparência & Loja
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-4 py-3 font-bold text-sm tracking-widest uppercase border-b-2 transition-colors ${activeTab === 'products' ? 'border-brand-red text-brand-red' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
          >
            Produtos
          </button>
          <button 
            onClick={() => setActiveTab('messages')}
            className={`px-4 py-3 font-bold text-sm tracking-widest uppercase border-b-2 transition-colors ${activeTab === 'messages' ? 'border-brand-red text-brand-red' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
          >
            Mensagens WPP
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-3 font-bold text-sm tracking-widest uppercase border-b-2 transition-colors ${activeTab === 'reports' ? 'border-brand-red text-brand-red' : 'border-transparent text-gray-500 hover:text-gray-900'} flex items-center gap-1`}
          >
            <BarChart3 className="w-4 h-4" /> Relatórios
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 custom-scrollbar">
          {activeTab === 'orders' && <AdminOrders />}
          {activeTab === 'reports' && <AdminReports />}
          
          {activeTab === 'config' && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-black text-sm uppercase tracking-widest text-gray-900 mb-4">Configurações Gerais</h3>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Nome da Loja (Logo)</label>
                  <input 
                    type="text" 
                    value={formConfig.logoText} 
                    onChange={e => setFormConfig({...formConfig, logoText: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm"
                  />
                </div>
                <ImageUploadInput
                  label="URL da Logo (Opcional)"
                  value={formConfig.logoUrl || ''}
                  onChange={value => setFormConfig({...formConfig, logoUrl: value})}
                  placeholder="https://suaimagem.com/logo.png"
                />
                <ImageUploadInput
                  label="URL do Banner (Opcional)"
                  value={formConfig.bannerUrl || ''}
                  onChange={value => setFormConfig({...formConfig, bannerUrl: value})}
                  placeholder="https://suaimagem.com/banner.jpg"
                />
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Subtítulo (Banner)</label>
                  <input 
                    type="text" 
                    value={formConfig.logoDescription} 
                    onChange={e => setFormConfig({...formConfig, logoDescription: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">WhatsApp (Apenas números)</label>
                  <input 
                    type="text" 
                    value={formConfig.whatsappNumber} 
                    onChange={e => setFormConfig({...formConfig, whatsappNumber: e.target.value})}
                    placeholder="EX: 5531991456841"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Instagram URL</label>
                    <input 
                      type="url" 
                      value={formConfig.instagramUrl || ''} 
                      onChange={e => setFormConfig({...formConfig, instagramUrl: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Facebook URL</label>
                    <input 
                      type="url" 
                      value={formConfig.facebookUrl || ''} 
                      onChange={e => setFormConfig({...formConfig, facebookUrl: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Taxa de Entrega Fixa</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formConfig.deliveryFee ?? 3.00} 
                      onChange={e => setFormConfig({...formConfig, deliveryFee: parseFloat(e.target.value)})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pl-10 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm"
                    />
                  </div>
                </div>

                <div className="col-span-1 border-t border-gray-100 pt-6 mt-2">
                  <h3 className="font-bold text-gray-900 mb-4 whitespace-nowrap">Tempo de Entrega</h3>
                  
                  <div className="mb-4">
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Tipo de Tempo</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="deliveryTimeType"
                          checked={formConfig.deliveryTimeType === 'fixed'}
                          onChange={() => setFormConfig({...formConfig, deliveryTimeType: 'fixed'})}
                          className="w-4 h-4 accent-brand-red text-brand-red"
                        />
                        <span className="text-sm font-medium">Fixo</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="deliveryTimeType"
                          checked={formConfig.deliveryTimeType === 'range'}
                          onChange={() => setFormConfig({...formConfig, deliveryTimeType: 'range'})}
                          className="w-4 h-4 accent-brand-red text-brand-red"
                        />
                        <span className="text-sm font-medium">Intervalo (Min/Máx)</span>
                      </label>
                    </div>
                  </div>

                  {formConfig.deliveryTimeType === 'fixed' ? (
                    <div>
                      <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Tempo Fixo (minutos)</label>
                      <input 
                        type="number" 
                        min="1"
                        value={formConfig.fixedDeliveryTime ?? 40} 
                        onChange={e => setFormConfig({...formConfig, fixedDeliveryTime: parseInt(e.target.value, 10)})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Tempo Mínimo (min)</label>
                        <input 
                          type="number"
                          min="1"
                          value={formConfig.minDeliveryTime ?? 30} 
                          onChange={e => setFormConfig({...formConfig, minDeliveryTime: parseInt(e.target.value, 10)})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Tempo Máximo (min)</label>
                        <input 
                          type="number" 
                          min="1"
                          value={formConfig.maxDeliveryTime ?? 50} 
                          onChange={e => setFormConfig({...formConfig, maxDeliveryTime: parseInt(e.target.value, 10)})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-6 mt-2 col-span-1 md:col-span-2">
                  <div className="flex flex-col gap-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formConfig.notifyOnCartStart ?? false}
                        onChange={e => setFormConfig({...formConfig, notifyOnCartStart: e.target.checked})}
                        className="w-5 h-5 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                      />
                      <div>
                        <div className="text-sm font-bold text-gray-900">Notificar Carrinho Iniciado</div>
                        <div className="text-[10px] text-gray-500">Gera um alerta no sistema quando um cliente adiciona o primeiro item à sacola.</div>
                      </div>
                    </div>
                  </div>

                  <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mt-6 mb-2">Status da Loja</label>
                  <div className="flex flex-col gap-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isOpen"
                        checked={formConfig.isOpen}
                        onChange={e => setFormConfig({...formConfig, isOpen: e.target.checked})}
                        className="w-5 h-5 accent-brand-red cursor-pointer"
                      />
                      <div>
                        <label htmlFor="isOpen" className="block text-sm font-bold text-gray-900 cursor-pointer mb-0.5">Loja Aberta</label>
                        <p className="text-[10px] text-gray-500 tracking-wide">Desmarque para fechar a loja manualmente.</p>
                      </div>
                    </div>
                    
                    <hr className="border-gray-200" />
                    
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="autoOpenClose"
                        checked={formConfig.autoOpenClose || false}
                        onChange={e => setFormConfig({...formConfig, autoOpenClose: e.target.checked})}
                        className="w-5 h-5 accent-brand-red cursor-pointer"
                      />
                      <div>
                        <label htmlFor="autoOpenClose" className="block text-sm font-bold text-gray-900 cursor-pointer mb-0.5">Horário Automático</label>
                        <p className="text-[10px] text-gray-500 tracking-wide">Abrir e fechar a loja automaticamente nos horários abaixo.</p>
                      </div>
                    </div>
                    
                    {formConfig.autoOpenClose && (
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Horário de Abertura</label>
                          <input 
                            type="time" 
                            value={formConfig.openTime || ''} 
                            onChange={e => setFormConfig({...formConfig, openTime: e.target.value})}
                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Horário de Fechamento</label>
                          <input 
                            type="time" 
                            value={formConfig.closeTime || ''} 
                            onChange={e => setFormConfig({...formConfig, closeTime: e.target.value})}
                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-4 bg-gray-50 border border-gray-200 rounded-xl p-4 mt-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formConfig.printConfig?.autoPrint ?? true}
                        onChange={e => setFormConfig({...formConfig, printConfig: { ...formConfig.printConfig, autoPrint: e.target.checked }})}
                        className="w-5 h-5 rounded border-gray-300 text-brand-red focus:ring-brand-red cursor-pointer"
                      />
                      <div>
                        <div className="text-sm font-bold text-gray-900">Impressão Automática (Novos Pedidos)</div>
                        <div className="text-[10px] text-gray-500">Enviar novos pedidos automaticamente para a impressora.</div>
                      </div>
                    </div>
                    {(formConfig.printConfig?.autoPrint ?? true) && (
                      <div className="pl-8 flex flex-col gap-3 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formConfig.printConfig?.autoPrintDelivery ?? true}
                            onChange={e => setFormConfig({...formConfig, printConfig: { ...formConfig.printConfig, autoPrint: formConfig.printConfig?.autoPrint ?? true, autoPrintDelivery: e.target.checked }})}
                            className="w-4 h-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                          />
                          <span className="text-xs text-gray-700">Imprimir pedidos de <strong>Delivery</strong></span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formConfig.printConfig?.autoPrintPickup ?? true}
                            onChange={e => setFormConfig({...formConfig, printConfig: { ...formConfig.printConfig, autoPrint: formConfig.printConfig?.autoPrint ?? true, autoPrintPickup: e.target.checked }})}
                            className="w-4 h-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                          />
                          <span className="text-xs text-gray-700">Imprimir pedidos de <strong>Retirada</strong></span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Formas de Pagamento */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2 mt-4">Formas de Pagamento Habilitadas</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 gap-4 grid grid-cols-2 md:grid-cols-3">
                    {['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Vale Alimentação', 'Dinheiro'].map((method) => {
                      const enabledMethods = formConfig.enabledPaymentMethods || ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Vale Alimentação', 'Dinheiro'];
                      const isEnabled = enabledMethods.includes(method);
                      
                      return (
                        <label key={method} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const currentMethods = [...enabledMethods];
                              if (checked) {
                                if (!currentMethods.includes(method)) currentMethods.push(method);
                              } else {
                                const index = currentMethods.indexOf(method);
                                if (index > -1) currentMethods.splice(index, 1);
                              }
                              setFormConfig({ ...formConfig, enabledPaymentMethods: currentMethods });
                            }}
                            className="w-5 h-5 rounded border-gray-300 text-brand-red focus:ring-brand-red cursor-pointer"
                          />
                          <span className="text-sm font-bold text-gray-900">{method}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Senha do Admin</label>
                  <input 
                    type="text" 
                    value={formConfig.adminPassword || ''} 
                    onChange={e => setFormConfig({...formConfig, adminPassword: e.target.value})}
                    placeholder="Deixe em branco para remover"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Localização</label>
                  <input 
                    type="text" 
                    value={formConfig.location} 
                    onChange={e => setFormConfig({...formConfig, location: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Horário de Funcionamento</label>
                  <input 
                    type="text" 
                    value={formConfig.openingHours} 
                    onChange={e => setFormConfig({...formConfig, openingHours: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Sobre / Informações</label>
                  <textarea 
                    value={formConfig.aboutText} 
                    onChange={e => setFormConfig({...formConfig, aboutText: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm h-24 resize-none"
                  />
                </div>
                <button 
                  onClick={handleSaveConfig}
                  className="mt-4 px-6 py-3 bg-brand-red text-white text-[10px] uppercase font-black tracking-widest rounded-xl hover:bg-brand-red-dark transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar Configurações
                </button>
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-black text-sm uppercase tracking-widest text-gray-900 mb-4">Mensagens do WhatsApp</h3>
                
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formConfig.whatsappApiConfig?.enabled || false}
                      onChange={e => setFormConfig({...formConfig, whatsappApiConfig: { ...formConfig.whatsappApiConfig, enabled: e.target.checked }})}
                      className="w-5 h-5 rounded border-gray-300 text-brand-red focus:ring-brand-red cursor-pointer"
                    />
                    <div>
                      <div className="text-sm font-bold text-gray-900">Integração API (Envio Direto sem tela)</div>
                      <div className="text-[10px] text-gray-500">Enviar mensagens via Evolution API ao invés de abrir o WhatsApp Web.</div>
                    </div>
                  </div>
                  
                  {formConfig.whatsappApiConfig?.enabled && (
                    <div className="space-y-3 pt-3 border-t border-gray-200">
                      <div>
                        <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">URL Base da API</label>
                        <input 
                          type="text" 
                          value={formConfig.whatsappApiConfig?.apiUrl || ''} 
                          onChange={e => setFormConfig({...formConfig, whatsappApiConfig: { ...formConfig.whatsappApiConfig, apiUrl: e.target.value }})}
                          placeholder="EX: https://api.seudominio.com"
                          className="w-full bg-white border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Nome da Instância</label>
                          <input 
                            type="text" 
                            value={formConfig.whatsappApiConfig?.instanceId || ''} 
                            onChange={e => setFormConfig({...formConfig, whatsappApiConfig: { ...formConfig.whatsappApiConfig, instanceId: e.target.value }})}
                            placeholder="EX: loja01"
                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Global API Key</label>
                          <input 
                            type="password" 
                            value={formConfig.whatsappApiConfig?.token || ''} 
                            onChange={e => setFormConfig({...formConfig, whatsappApiConfig: { ...formConfig.whatsappApiConfig, token: e.target.value }})}
                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Novo Pedido</label>
                  <textarea 
                    value={formConfig.whatsappMessages?.newOrder || ''} 
                    onChange={e => setFormConfig({...formConfig, whatsappMessages: { ...formConfig.whatsappMessages, newOrder: e.target.value }})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm h-20 resize-none"
                    placeholder="Ex: Olá, gostaria de fazer o seguinte pedido:"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Mensagem enviada pelo cliente ao finalizar um pedido.</p>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500">Pedido Recebido (Feito)</label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <span className="text-[10px] font-bold uppercase text-gray-500">Auto</span>
                      <input 
                        type="checkbox" 
                        checked={formConfig.whatsappAutomations?.orderDone ?? false}
                        onChange={e => setFormConfig({...formConfig, whatsappAutomations: { ...formConfig.whatsappAutomations, orderDone: e.target.checked }})}
                        className="rounded text-brand-red focus:ring-brand-red"
                      />
                    </label>
                  </div>
                  <textarea 
                    value={formConfig.whatsappMessages?.orderDone || ''} 
                    onChange={e => setFormConfig({...formConfig, whatsappMessages: { ...formConfig.whatsappMessages, orderDone: e.target.value }})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm h-20 resize-none"
                    placeholder="Ex: Olá {customerName}, recebemos o seu pedido!"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Dica: Use {'{customerName}'} para o nome do cliente. Se "Auto" estiver marcado, abre automaticamente a janela do WhatsApp quando o status for alterado.</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500">Pedido a Caminho</label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <span className="text-[10px] font-bold uppercase text-gray-500">Auto</span>
                      <input 
                        type="checkbox" 
                        checked={formConfig.whatsappAutomations?.orderDispatched ?? false}
                        onChange={e => setFormConfig({...formConfig, whatsappAutomations: { ...formConfig.whatsappAutomations, orderDispatched: e.target.checked }})}
                        className="rounded text-brand-red focus:ring-brand-red"
                      />
                    </label>
                  </div>
                  <textarea 
                    value={formConfig.whatsappMessages?.orderDispatched || ''} 
                    onChange={e => setFormConfig({...formConfig, whatsappMessages: { ...formConfig.whatsappMessages, orderDispatched: e.target.value }})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm h-20 resize-none"
                    placeholder="Ex: Olá {customerName}, seu pedido está a caminho!"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Dica: Use {'{customerName}'} para o nome do cliente. Se "Auto" estiver marcado, abre automaticamente a janela do WhatsApp quando o status for alterado.</p>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500">Pedido Entregue</label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <span className="text-[10px] font-bold uppercase text-gray-500">Auto</span>
                      <input 
                        type="checkbox" 
                        checked={formConfig.whatsappAutomations?.orderDelivered ?? false}
                        onChange={e => setFormConfig({...formConfig, whatsappAutomations: { ...formConfig.whatsappAutomations, orderDelivered: e.target.checked }})}
                        className="rounded text-brand-red focus:ring-brand-red"
                      />
                    </label>
                  </div>
                  <textarea 
                    value={formConfig.whatsappMessages?.orderDelivered || ''} 
                    onChange={e => setFormConfig({...formConfig, whatsappMessages: { ...formConfig.whatsappMessages, orderDelivered: e.target.value }})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm h-20 resize-none"
                    placeholder="Ex: Olá {customerName}, pedido entregue! Obrigado."
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Dica: Use {'{customerName}'} para o nome do cliente. Se "Auto" estiver marcado, abre automaticamente a janela do WhatsApp quando o status for alterado.</p>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Dúvidas / Fale Conosco</label>
                  <textarea 
                    value={formConfig.whatsappMessages?.contact || ''} 
                    onChange={e => setFormConfig({...formConfig, whatsappMessages: { ...formConfig.whatsappMessages, contact: e.target.value }})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm h-20 resize-none"
                    placeholder="Ex: Olá, gostaria de tirar uma dúvida!"
                  />
                </div>

                <button 
                  onClick={handleSaveConfig}
                  className="mt-4 px-6 py-3 bg-brand-red text-white text-[10px] uppercase font-black tracking-widest rounded-xl hover:bg-brand-red-dark transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar Mensagens
                </button>
              </div>
            </div>
          )}

          {activeTab === 'products' && !editingProduct && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button 
                  onClick={startAddProduct}
                  className="px-6 py-3 bg-brand-red text-white text-[10px] uppercase font-black tracking-widest rounded-xl hover:bg-brand-red-dark transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Produto
                </button>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase tracking-widest text-gray-500">
                      <th className="p-4 font-bold">Produto</th>
                      <th className="p-4 font-bold hidden sm:table-cell">Categoria</th>
                      <th className="p-4 font-bold">Preço</th>
                      <th className="p-4 font-bold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded object-cover border border-gray-200" />
                            ) : (
                              <div className="w-10 h-10 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-gray-900 text-sm">{p.name}</div>
                              <div className="text-[10px] text-gray-500 uppercase tracking-widest sm:hidden">{p.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 hidden sm:table-cell text-xs uppercase tracking-widest text-gray-600 font-medium">{p.category}</td>
                        <td className="p-4 font-mono font-bold text-brand-red text-sm">{formatCurrency(p.price)}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setEditingProduct(p)}
                              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                if(confirm('Tem certeza?')) deleteProduct(p.id);
                              }}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'products' && editingProduct && (
            <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-lg uppercase tracking-tight text-gray-900">
                  {isAddingProduct ? 'Novo Produto' : 'Editar Produto'}
                </h3>
                <button onClick={() => {setEditingProduct(null); setIsAddingProduct(false);}} className="text-gray-400 hover:text-gray-900 text-xs font-bold uppercase tracking-widest">Cancelar</button>
              </div>
              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Nome</label>
                  <input 
                    required autoFocus
                    type="text" 
                    value={editingProduct.name} 
                    onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Categoria</label>
                    <input 
                      list="categories"
                      required
                      value={editingProduct.category}
                      onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm font-bold uppercase"
                      placeholder="EX: BEBIDAS"
                    />
                    <datalist id="categories">
                      {Array.from(new Set([...config.categories, ...products.map(p => p.category)])).map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Preço (R$)</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      min="0"
                      value={editingProduct.price} 
                      onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red text-sm font-mono font-bold"
                    />
                  </div>
                </div>
                <div>
                  <ImageUploadInput
                    label="URL da Imagem"
                    value={editingProduct.imageUrl || ''}
                    onChange={value => setEditingProduct({...editingProduct, imageUrl: value})}
                    placeholder="https://..."
                  />
                  {editingProduct.imageUrl && (
                    <img src={editingProduct.imageUrl} alt="Preview" className="mt-2 h-32 rounded-xl object-cover border border-gray-200" />
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Descrição (Opcional)</label>
                  <textarea 
                    value={editingProduct.description} 
                    onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm resize-none h-24"
                  />
                </div>
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4 mt-2">
                  <input
                    type="checkbox"
                    id="isBestSeller"
                    checked={editingProduct.isBestSeller || false}
                    onChange={e => setEditingProduct({...editingProduct, isBestSeller: e.target.checked})}
                    className="w-5 h-5 accent-brand-red cursor-pointer"
                  />
                  <div>
                    <label htmlFor="isBestSeller" className="block text-sm font-bold text-gray-900 cursor-pointer mb-0.5">Destaque (Mais Vendido)</label>
                    <p className="text-[10px] text-gray-500 tracking-wide">Forçar este produto a aparecer na lista de mais vendidos na página inicial.</p>
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full mt-6 py-4 bg-brand-red hover:bg-brand-red-dark text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl transition-all shadow-md flex items-center justify-center gap-3"
                >
                  <Save className="w-4 h-4" />
                  Salvar Produto
                </button>
              </form>
            </div>
          )}

        </div>
    </div>
  );
}
