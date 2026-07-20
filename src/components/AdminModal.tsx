import { X, Plus, Edit2, Trash2, Save, Image as ImageIcon, BarChart3, Check, Store, Printer, Eye, EyeOff, Search } from 'lucide-react';
import React, { useState } from 'react';
import { notify } from './NotificationOverlay';
import { useStore } from '../contexts/StoreContext';
import { Product } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { requestUsbPrinter } from '../utils/printUsb';
import { ImageUploadInput } from './ImageUploadInput';
import { AdminOrders } from './AdminOrders';
import { AdminReports } from './AdminReports';
import { AdminCategories } from './AdminCategories';

export function AdminModal({ onClose }: { onClose: () => void }) {
  const { config, setConfig, products, addProduct, updateProduct, deleteProduct } = useStore();
  const [activeTab, setActiveTab] = useState<'orders' | 'config' | 'products' | 'categories' | 'messages' | 'pagamentos' | 'reports'>('orders');

  const [formConfig, setFormConfig] = useState(config);
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isEnteringNewCategory, setIsEnteringNewCategory] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const handleSaveConfig = () => {
    setConfig(formConfig);
    notify.success('Configurações salvas com sucesso!');
    onClose();
  };

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    try {
      if (isAddingProduct) {
        await addProduct({ ...editingProduct, id: crypto.randomUUID(), createdAt: Date.now() });
      } else {
        await updateProduct(editingProduct);
      }
      
      if (!config.categories.includes(editingProduct.category)) {
        await setConfig({ ...config, categories: [...config.categories, editingProduct.category] });
      }
      
      setEditingProduct(null);
      setIsAddingProduct(false);
      setIsEnteringNewCategory(false);
      notify.success('Produto salvo com sucesso!');
    } catch (e) {
      // Error is already handled and notified by the context
      console.error("Failed to save product", e);
    }
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
    setIsEnteringNewCategory(false);
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
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-3 font-bold text-sm tracking-widest uppercase border-b-2 transition-colors ${activeTab === 'categories' ? 'border-brand-red text-brand-red' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
          >
            Categorias
          </button>
          <button 
            onClick={() => setActiveTab('messages')}
            className={`px-4 py-3 font-bold text-sm tracking-widest uppercase border-b-2 transition-colors ${activeTab === 'messages' ? 'border-brand-red text-brand-red' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
          >
            Mensagens WPP
          </button>
          <button 
            onClick={() => setActiveTab('pagamentos')}
            className={`px-4 py-3 font-bold text-sm tracking-widest uppercase border-b-2 transition-colors ${activeTab === 'pagamentos' ? 'border-brand-red text-brand-red' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
          >
            Pagamentos
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
          {activeTab === 'categories' && <AdminCategories />}
          
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
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Ordem de Exibição dos Produtos</label>
                  <select
                    value={formConfig.productDisplayOrder || 'additionDate'}
                    onChange={e => setFormConfig({...formConfig, productDisplayOrder: e.target.value as any})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm"
                  >
                    <option value="additionDate">Por Adição (Mais antigos primeiro)</option>
                    <option value="alphabetical">Ordem Alfabética</option>
                  </select>
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

                <div className="col-span-1 border-t border-gray-100 pt-6 mt-2">
                  <h3 className="font-bold text-gray-900 mb-4 whitespace-nowrap">Tempo de Retirada</h3>
                  
                  {formConfig.deliveryTimeType === 'fixed' ? (
                    <div>
                        <span className="text-[10px] text-gray-500">(Utiliza o mesmo tempo fixo da entrega)</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Tempo Mínimo (min)</label>
                        <input 
                          type="number"
                          min="1"
                          value={formConfig.minPickupTime ?? 15} 
                          onChange={e => setFormConfig({...formConfig, minPickupTime: parseInt(e.target.value, 10)})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Tempo Máximo (min)</label>
                        <input 
                          type="number" 
                          min="1"
                          value={formConfig.maxPickupTime ?? 30} 
                          onChange={e => setFormConfig({...formConfig, maxPickupTime: parseInt(e.target.value, 10)})}
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Valor Mínimo do Pedido (S/ Taxa)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                        <input 
                          type="number" 
                          step="0.01"
                          value={formConfig.minOrderValue ?? 20} 
                          onChange={e => setFormConfig({...formConfig, minOrderValue: parseFloat(e.target.value)})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pl-10 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Mensagem de Sucesso (Checkout)</label>
                      <textarea 
                        rows={3}
                        value={formConfig.orderSuccessMessage ?? ''} 
                        onChange={e => setFormConfig({...formConfig, orderSuccessMessage: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm resize-none"
                      />
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
                      <div className="mt-4 flex flex-col gap-3">
                        <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-1">Configuração de Horários por Dia</label>
                        {[0,1,2,3,4,5,6].map(day => {
                          const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
                          const schedule = formConfig.businessHours?.[day] || { isOpen: false, slots: [] };
                          return (
                            <div key={day} className="flex flex-col gap-2 p-3 bg-white border border-gray-100 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={schedule.isOpen}
                                    onChange={e => {
                                      const newConfig = { ...formConfig };
                                      if (!newConfig.businessHours) newConfig.businessHours = {};
                                      newConfig.businessHours[day] = { ...schedule, isOpen: e.target.checked };
                                      setFormConfig(newConfig);
                                    }}
                                    className="w-4 h-4 accent-brand-red cursor-pointer"
                                  />
                                  <span className="text-sm font-bold text-gray-800">{dayNames[day]}</span>
                                </div>
                                <button
                                  type="button"
                                  disabled={!schedule.isOpen}
                                  onClick={() => {
                                    const newConfig = { ...formConfig };
                                    if (!newConfig.businessHours) newConfig.businessHours = {};
                                    newConfig.businessHours[day] = { 
                                      ...schedule, 
                                      slots: [...(schedule.slots || []), { open: '18:00', close: '22:00' }] 
                                    };
                                    setFormConfig(newConfig);
                                  }}
                                  className="text-brand-red font-bold text-xs flex items-center gap-1 disabled:opacity-50"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                  Adicionar
                                </button>
                              </div>
                              {schedule.isOpen && schedule.slots && schedule.slots.map((slot, idx) => (
                                <div key={idx} className="flex items-center gap-2 mt-1">
                                  <input 
                                    type="time" 
                                    value={slot.open} 
                                    onChange={e => {
                                      const newConfig = { ...formConfig };
                                      const newSlots = [...schedule.slots];
                                      newSlots[idx].open = e.target.value;
                                      newConfig.businessHours![day] = { ...schedule, slots: newSlots };
                                      setFormConfig(newConfig);
                                    }}
                                    className="w-full bg-gray-50 border border-gray-200 rounded p-1 text-xs text-gray-900 focus:outline-none"
                                  />
                                  <span className="text-xs text-gray-400">até</span>
                                  <input 
                                    type="time" 
                                    value={slot.close} 
                                    onChange={e => {
                                      const newConfig = { ...formConfig };
                                      const newSlots = [...schedule.slots];
                                      newSlots[idx].close = e.target.value;
                                      newConfig.businessHours![day] = { ...schedule, slots: newSlots };
                                      setFormConfig(newConfig);
                                    }}
                                    className="w-full bg-gray-50 border border-gray-200 rounded p-1 text-xs text-gray-900 focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newConfig = { ...formConfig };
                                      const newSlots = schedule.slots.filter((_, sIdx) => sIdx !== idx);
                                      newConfig.businessHours![day] = { ...schedule, slots: newSlots };
                                      setFormConfig(newConfig);
                                    }}
                                    className="text-gray-400 hover:text-red-500"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          );
                        })}
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
                        <div className="mt-4 p-4 bg-sky-50 border border-sky-200 rounded-xl shadow-sm">
                          <h5 className="text-xs font-bold text-sky-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Store className="w-4 h-4" />
                            Impressão Silenciosa (Sem Janela)
                          </h5>
                          <p className="text-xs text-sky-800 font-medium mb-3 leading-relaxed">
                            Navegadores abrem uma tela de confirmação de impressão por segurança. Para pular essa tela e imprimir direto, use a <strong>Opção 1</strong> (USB direto). Se não funcionar, use a <strong>Opção 2</strong> (Modo Kiosk).
                          </p>
                          <ul className="text-xs text-sky-800 list-disc pl-5 space-y-3 leading-relaxed opacity-95">
                            <li><strong>Opção 1 (WebUSB abaixo):</strong> Conecte sua impressora térmica via USB e clique no botão escuro "Selecionar Impressora" abaixo.</li>
                            <li>
                              <strong>Opção 2 (Modo Kiosk Chrome):</strong> No atalho do Chrome, no campo "Destino", adicione no final:
                              <code className="block mt-1 bg-white px-2 py-1.5 rounded border border-sky-200 text-xs text-pink-700 font-mono shadow-sm">--kiosk-printing --user-data-dir="C:\ChromePDV" "{window.location.origin}"</code>
                              <span className="block mt-1 text-[10px] bg-sky-100 p-1.5 rounded">
                                * O comando <strong>--user-data-dir</strong> é OBRIGATÓRIO, senão o Chrome ignora o kiosk se você já tiver outra janela dele aberta! O Chrome cria a pasta C:\ChromePDV sozinho, você não precisa criar. Certifique-se de que a sua impressora térmica seja a <strong>Impressora Padrão</strong> do Windows.
                              </span>
                            </li>
                          </ul>
                        </div>
                        <div className="mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                          <h5 className="text-[10px] uppercase font-bold tracking-widest text-gray-700 mb-2 flex items-center gap-2">
                            <Printer className="w-3 h-3" /> Impressão USB (Sem Janela)
                          </h5>
                          <p className="text-[10px] text-gray-600 mb-2">Conecte sua impressora térmica USB.</p>
                          <p className="text-[10px] text-brand-red bg-red-50 p-2 rounded block mb-3 font-medium border border-red-100">
                             <strong>Atenção Windows:</strong> Se der falha (Security Error), você precisa baixar o programa gratuito <strong>"Zadig"</strong>, selecionar "Options &gt; List All Devices", escolher sua impressora (ex: POS-80) e instalar o driver <strong>"WinUSB"</strong> nela para que navegadores da web consigam ter acesso direto à impressora.
                          </p>
                          <div className="flex flex-col gap-3">
                            {formConfig.printConfig?.usbPrinter ? (
                              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                                  <div>
                                    <h6 className="text-[10px] font-bold text-green-800 uppercase tracking-widest flex items-center justify-start gap-1">
                                      <Check className="w-3 h-3" />
                                      {formConfig.printConfig.usbPrinter.name}
                                    </h6>
                                    <p className="text-[10px] text-green-600 mt-0.5">Status: Conectado e Ativo</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm('Tem certeza que deseja desconectar a impressora?')) {
                                      setFormConfig({
                                        ...formConfig,
                                        printConfig: {
                                          ...formConfig.printConfig,
                                          usbPrinter: undefined
                                        }
                                      });
                                    }
                                  }}
                                  className="text-[10px] uppercase font-bold tracking-widest text-red-600 hover:text-red-800 transition-colors bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                                >
                                  <X className="w-3 h-3" />
                                  Desconectar
                                </button>
                              </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        const device = await requestUsbPrinter();
                                        setFormConfig({
                                          ...formConfig,
                                          printConfig: {
                                            ...formConfig.printConfig,
                                            autoPrint: formConfig.printConfig?.autoPrint ?? true,
                                            usbPrinter: {
                                              vendorId: device.vendorId,
                                              productId: device.productId,
                                              name: device.productName || 'Impressora USB'
                                            }
                                          }
                                        });
                                      } catch (e) {
                                        notify.error('Não foi possível conectar: ' + (e as Error).message);
                                      }
                                    }}
                                    className="px-4 py-2 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap"
                                  >
                                    Selecionar Impressora
                                  </button>
                                  <div className="text-[10px] text-gray-500 font-medium">
                                    Nenhuma impressora configurada.
                                  </div>
                                </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Formas de Pagamento */}
                <div className="md:col-span-2 mt-4 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Formas de Pagamento (Entrega)</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 gap-4 grid grid-cols-2 md:grid-cols-3">
                      {['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Vale Alimentação', 'Dinheiro'].map((method) => {
                        const enabledMethods = formConfig.enabledPaymentMethodsDelivery || formConfig.enabledPaymentMethods || ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Vale Alimentação', 'Dinheiro'];
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
                                setFormConfig({ ...formConfig, enabledPaymentMethodsDelivery: currentMethods });
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
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Formas de Pagamento (Retirada)</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 gap-4 grid grid-cols-2 md:grid-cols-3">
                      {['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Vale Alimentação', 'Dinheiro'].map((method) => {
                        const enabledMethods = formConfig.enabledPaymentMethodsPickup || formConfig.enabledPaymentMethods || ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Vale Alimentação', 'Dinheiro'];
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
                                setFormConfig({ ...formConfig, enabledPaymentMethodsPickup: currentMethods });
                              }}
                              className="w-5 h-5 rounded border-gray-300 text-brand-red focus:ring-brand-red cursor-pointer"
                            />
                            <span className="text-sm font-bold text-gray-900">{method}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Gerenciar Categorias</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex gap-2 mb-3">
                      <input 
                        type="text" 
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.currentTarget.value.trim();
                            if (val && !formConfig.categories.includes(val)) {
                              setFormConfig({ ...formConfig, categories: [...formConfig.categories, val] });
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                        placeholder="Nova Categoria (pressione Enter)" 
                        className="flex-1 bg-white border border-gray-200 text-sm p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-red font-bold uppercase"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {formConfig.categories.map((cat) => (
                         <div key={cat} className="flex gap-1 items-center bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold uppercase">
                           <span>{cat}</span>
                           <button 
                             type="button"
                             onClick={() => setFormConfig({ ...formConfig, categories: formConfig.categories.filter(c => c !== cat) })}
                             className="text-gray-400 hover:text-red-500 ml-1"
                           >
                             <X className="w-3 h-3" />
                           </button>
                         </div>
                       ))}
                    </div>
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

          {activeTab === 'pagamentos' && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-black text-sm uppercase tracking-widest text-gray-900 mb-4">Banco do Brasil API (Pix)</h3>
                
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formConfig.bbPixConfig?.enabled || false}
                      onChange={e => setFormConfig({...formConfig, bbPixConfig: { ...formConfig.bbPixConfig, enabled: e.target.checked } as any})}
                      className="w-5 h-5 rounded border-gray-300 text-brand-red focus:ring-brand-red cursor-pointer"
                    />
                    <div>
                      <div className="text-sm font-bold text-gray-900">Ativar Banco do Brasil PIX (Checkout)</div>
                      <div className="text-[10px] text-gray-500">Gera QR Code automático via app-key. Requer Sandbox/Produção Credentials.</div>
                    </div>
                  </div>
                  
                  {formConfig.bbPixConfig?.enabled && (
                    <div className="space-y-4 pt-3 border-t border-gray-200">
                      <div>
                        <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Ambiente</label>
                        <select 
                          value={formConfig.bbPixConfig.isProduction ? 'true' : 'false'}
                          onChange={e => setFormConfig({...formConfig, bbPixConfig: { ...formConfig.bbPixConfig, isProduction: e.target.value === 'true' } as any})}
                          className="w-full bg-white border border-gray-200 rounded-xl p-3 text-gray-900 text-sm font-bold"
                        >
                          <option value="false">Sandbox (Testes)</option>
                          <option value="true">Produção (Necessário configurar mTLS depois)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Client ID (OAuth)</label>
                        <input 
                          type="text" 
                          value={formConfig.bbPixConfig.clientId || ''} 
                          onChange={e => setFormConfig({...formConfig, bbPixConfig: { ...formConfig.bbPixConfig, clientId: e.target.value } as any})}
                          className="w-full bg-white border border-gray-200 rounded-xl p-3 text-gray-900 font-mono text-sm"
                          placeholder="Ex: eyJhbG..."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Client Secret (OAuth)</label>
                        <input 
                          type="password" 
                          value={formConfig.bbPixConfig.clientSecret || ''} 
                          onChange={e => setFormConfig({...formConfig, bbPixConfig: { ...formConfig.bbPixConfig, clientSecret: e.target.value } as any})}
                          className="w-full bg-white border border-gray-200 rounded-xl p-3 text-gray-900 font-mono text-sm"
                          placeholder="********"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Developer Application Key (app-key)</label>
                        <input 
                          type="text" 
                          value={formConfig.bbPixConfig.developerAppKey || ''} 
                          onChange={e => setFormConfig({...formConfig, bbPixConfig: { ...formConfig.bbPixConfig, developerAppKey: e.target.value } as any})}
                          className="w-full bg-white border border-gray-200 rounded-xl p-3 text-gray-900 font-mono text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleSaveConfig}
                  className="mt-4 px-6 py-3 bg-brand-red text-white text-[10px] uppercase font-black tracking-widest rounded-xl hover:bg-brand-red-dark transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar Pagamentos
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
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500">Pedido Em Preparo (Cozinha)</label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <span className="text-[10px] font-bold uppercase text-gray-500">Auto</span>
                      <input 
                        type="checkbox" 
                        checked={formConfig.whatsappAutomations?.orderPreparing ?? false}
                        onChange={e => setFormConfig({...formConfig, whatsappAutomations: { ...formConfig.whatsappAutomations, orderPreparing: e.target.checked }})}
                        className="rounded text-brand-red focus:ring-brand-red cursor-pointer"
                      />
                    </label>
                  </div>
                  <p className="text-[10px] text-gray-400 -mt-1 mb-2 leading-tight">Será enviada a mensagem padrão ou via API.</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500">Pedido Pronto</label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <span className="text-[10px] font-bold uppercase text-gray-500">Auto</span>
                      <input 
                        type="checkbox" 
                        checked={formConfig.whatsappAutomations?.orderReady ?? false}
                        onChange={e => setFormConfig({...formConfig, whatsappAutomations: { ...formConfig.whatsappAutomations, orderReady: e.target.checked }})}
                        className="rounded text-brand-red focus:ring-brand-red cursor-pointer"
                      />
                    </label>
                  </div>
                  <p className="text-[10px] text-gray-400 -mt-1 mb-2 leading-tight">Será enviada a mensagem padrão ou via API.</p>
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
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Buscar produtos..."
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      if (window.confirm("Isso irá adicionar os itens padrão do cardápio que podem estar faltando. Continuar?")) { 
                         try {
                           const initProductsOrig = (await import('../data/products')).products;
                           for (const prod of initProductsOrig) {
                             if (!products.find(p => p.name === prod.name)) {
                               await addProduct(prod);
                             }
                           }
                           alert("Cardápio base sincronizado!");
                         } catch (e) {
                           console.error(e);
                         }
                      }
                    }}
                    className="text-xs font-bold text-gray-500 hover:text-brand-red transition-colors underline"
                  >
                    Sincronizar
                  </button>
                  <button 
                    onClick={startAddProduct}
                    className="px-6 py-3 bg-brand-red text-white text-[10px] uppercase font-black tracking-widest rounded-xl hover:bg-brand-red-dark transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Produto
                  </button>
                </div>
              </div>

              {config.categories.map(category => {
                const categoryProducts = products.filter(p => {
                  const matchesCategory = p.category === category;
                  const matchesSearch = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.description && p.description.toLowerCase().includes(productSearch.toLowerCase()));
                  return matchesCategory && matchesSearch;
                });
                if (config.productDisplayOrder === 'alphabetical') {
                  categoryProducts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                } else {
                  categoryProducts.sort((a, b) => {
                     const timeA = a.createdAt || 0;
                     const timeB = b.createdAt || 0;
                     if (timeA !== timeB) return timeA - timeB;
                     return (a.id || '').localeCompare(b.id || '', undefined, { numeric: true });
                  });
                }
                if (categoryProducts.length === 0) return null;
                return (
                  <div key={category} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-bold text-gray-700 text-xs uppercase tracking-widest">{category}</h3>
                      <span className="text-[10px] text-gray-400 font-bold bg-white px-2 py-1 rounded border border-gray-200">{categoryProducts.length} itens</span>
                    </div>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 text-[10px] uppercase tracking-widest text-gray-500">
                          <th className="p-4 font-bold w-16 text-center">Status</th>
                          <th className="p-4 font-bold">Produto</th>
                          <th className="p-4 font-bold">Preço</th>
                          <th className="p-4 font-bold">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryProducts.map(p => (
                          <tr key={p.id} className="border-b last:border-b-0 border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="p-4 align-middle">
                              <button
                                onClick={() => {
                                  updateProduct({ ...p, isAvailable: p.isAvailable === false ? true : false });
                                }}
                                title={p.isAvailable === false ? "Produto Indisponível (clique para ativar)" : "Produto Disponível (clique para desativar)"}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${p.isAvailable === false ? 'bg-gray-300' : 'bg-green-500'}`}
                              >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${p.isAvailable === false ? 'translate-x-1' : 'translate-x-6'}`} />
                              </button>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                {p.imageUrl ? (
                                  <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded object-contain bg-white border border-gray-200" />
                                ) : (
                                  <div className="w-10 h-10 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                                    <ImageIcon className="w-4 h-4" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                    {p.name}
                                    {p.isAvailable === false && (
                                      <span className="bg-red-100 text-red-600 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded">Indisponível</span>
                                    )}
                                  </div>
                                  {p.description && <div className="text-[10px] text-gray-500 line-clamp-1">{p.description}</div>}
                                </div>
                              </div>
                            </td>
                            <td className="p-4 font-mono font-bold text-brand-red text-sm">{p.price === 0 ? 'S/ Valor' : formatCurrency(p.price)}</td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => {
                                    setEditingProduct(p);
                                    setIsEnteringNewCategory(false);
                                  }}
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
                );
              })}
              
              {products.filter(p => !p.category && (!productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.description && p.description.toLowerCase().includes(productSearch.toLowerCase())))).length > 0 && (
                 <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                 <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                   <h3 className="font-bold text-gray-700 text-xs uppercase tracking-widest">Sem Categoria</h3>
                   <span className="text-[10px] text-gray-400 font-bold bg-white px-2 py-1 rounded border border-gray-200">
                     {products.filter(p => !p.category && (!productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.description && p.description.toLowerCase().includes(productSearch.toLowerCase())))).length} itens
                   </span>
                 </div>
                 <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 text-[10px] uppercase tracking-widest text-gray-500">
                          <th className="p-4 font-bold w-16 text-center">Status</th>
                          <th className="p-4 font-bold">Produto</th>
                          <th className="p-4 font-bold">Categoria</th>
                          <th className="p-4 font-bold">Preço</th>
                          <th className="p-4 font-bold">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.filter(p => !p.category && (!productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.description && p.description.toLowerCase().includes(productSearch.toLowerCase())))).map(p => (
                          <tr key={p.id} className="border-b last:border-b-0 border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="p-4 align-middle">
                              <button
                                onClick={() => {
                                  updateProduct({ ...p, isAvailable: p.isAvailable === false ? true : false });
                                }}
                                title={p.isAvailable === false ? "Produto Indisponível (clique para ativar)" : "Produto Disponível (clique para desativar)"}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${p.isAvailable === false ? 'bg-gray-300' : 'bg-green-500'}`}
                              >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${p.isAvailable === false ? 'translate-x-1' : 'translate-x-6'}`} />
                              </button>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                {p.imageUrl ? (
                                  <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded object-contain bg-white border border-gray-200" />
                                ) : (
                                  <div className="w-10 h-10 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                                    <ImageIcon className="w-4 h-4" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                    {p.name}
                                    {p.isAvailable === false && (
                                      <span className="bg-red-100 text-red-600 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded">Indisponível</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-xs uppercase tracking-widest text-gray-600">{p.category}</td>
                            <td className="p-4 font-mono font-bold text-brand-red text-sm">{p.price === 0 ? 'S/ Valor' : formatCurrency(p.price)}</td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => {
                                    setEditingProduct(p);
                                    setIsEnteringNewCategory(false);
                                  }}
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
              )}
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
                    {isEnteringNewCategory ? (
                      <div className="flex gap-2">
                        <input 
                           autoFocus
                           required
                           value={editingProduct.category}
                           onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}
                           placeholder="Nova Categoria..."
                           className="flex-1 bg-white border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm font-bold uppercase transition-shadow"
                        />
                        <button 
                           type="button" 
                           onClick={() => {
                              setIsEnteringNewCategory(false);
                              setEditingProduct({...editingProduct, category: config.categories[0] || ''});
                           }}
                           className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl font-bold transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <select
                        required
                        value={editingProduct.category}
                        onChange={e => {
                          if (e.target.value === '__NEW__') {
                            setIsEnteringNewCategory(true);
                            setEditingProduct({...editingProduct, category: ''});
                          } else {
                            setEditingProduct({...editingProduct, category: e.target.value});
                          }
                        }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red text-sm font-bold uppercase cursor-pointer"
                      >
                        <option value="" disabled>Selecione...</option>
                        {Array.from(new Set([...config.categories, ...products.map(p => p.category)])).filter(c => c).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        {editingProduct.category && !config.categories.includes(editingProduct.category) && !products.some(p => p.category === editingProduct.category) && (
                          <option value={editingProduct.category}>{editingProduct.category}</option>
                        )}
                        <option value="__NEW__" className="text-brand-red font-bold">+ Nova Categoria...</option>
                      </select>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                       <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500">Preço (R$)</label>
                       <label className="flex items-center gap-1.5 cursor-pointer">
                         <input 
                           type="checkbox" 
                           checked={editingProduct.price === 0}
                           onChange={e => {
                             if (e.target.checked) {
                               setEditingProduct({...editingProduct, price: 0});
                             } else {
                               setEditingProduct({...editingProduct, price: 1}); // or any non-zero value to re-enable
                             }
                           }}
                           className="w-3 h-3 accent-brand-red cursor-pointer"
                         />
                         <span className="text-[9px] font-bold text-gray-500 uppercase">Sem Valor</span>
                       </label>
                    </div>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      value={editingProduct.price === 0 ? '' : editingProduct.price} 
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        setEditingProduct({...editingProduct, price: isNaN(val) ? 0 : val});
                      }}
                      placeholder="0,00"
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
                    <img src={editingProduct.imageUrl} alt="Preview" className="mt-2 h-32 rounded-xl object-cover border border-gray-200 overflow-hidden" />
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
                
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4 mt-2">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={editingProduct.isAvailable !== false}
                    onChange={e => setEditingProduct({...editingProduct, isAvailable: e.target.checked})}
                    className="w-5 h-5 accent-brand-red cursor-pointer"
                  />
                  <div>
                    <label htmlFor="isAvailable" className="block text-sm font-bold text-gray-900 cursor-pointer mb-0.5">Disponível para Venda</label>
                    <p className="text-[10px] text-gray-500 tracking-wide">Se desmarcado, o produto aparecerá como "Indisponível" para os clientes.</p>
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
