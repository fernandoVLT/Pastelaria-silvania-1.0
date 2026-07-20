import React, { useState } from 'react';
import { useStore } from '../contexts/StoreContext';
import { Edit2, Trash2, Plus, Save, X } from 'lucide-react';
import { notify } from './NotificationOverlay';

export function AdminCategories() {
  const { config, setConfig, products, updateProduct } = useStore();
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ oldName: string, newName: string } | null>(null);

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    if (config.categories.includes(newCategory.trim())) {
      notify.error('Categoria já existe!');
      return;
    }
    setConfig({
      ...config,
      categories: [...config.categories, newCategory.trim()]
    });
    setNewCategory('');
    notify.success('Categoria adicionada!');
  };

  const handleRenameCategory = async (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName.trim()) {
      setEditingCategory(null);
      return;
    }
    if (config.categories.includes(newName.trim())) {
      notify.error('Já existe uma categoria com este nome!');
      return;
    }

    // Rename in config
    const newCategories = config.categories.map(c => c === oldName ? newName.trim() : c);
    await setConfig({
      ...config,
      categories: newCategories
    });

    // Rename in products
    const productsToUpdate = products.filter(p => p.category === oldName);
    for (const p of productsToUpdate) {
      await updateProduct({ ...p, category: newName.trim() });
    }

    setEditingCategory(null);
    notify.success('Categoria renomeada com sucesso!');
  };

  const handleDeleteCategory = (category: string) => {
    const productsInCat = products.filter(p => p.category === category);
    if (productsInCat.length > 0) {
      if (!confirm(`Existem ${productsInCat.length} produtos nesta categoria. Eles ficarão sem categoria (ou na categoria "Outras Categorias"). Deseja realmente excluir?`)) {
        return;
      }
    } else {
      if (!confirm('Excluir esta categoria?')) return;
    }

    setConfig({
      ...config,
      categories: config.categories.filter(c => c !== category)
    });
    notify.success('Categoria excluída!');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4 uppercase tracking-widest text-sm border-b border-gray-100 pb-2">Gerenciar Categorias</h3>
        
        <div className="flex gap-2 mb-6">
          <input 
            type="text" 
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Nova categoria..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddCategory();
            }}
          />
          <button 
            onClick={handleAddCategory}
            className="px-4 py-2 bg-brand-red text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-brand-red-dark transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </div>

        <div className="space-y-2">
          {config.categories.map(category => (
            <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              {editingCategory?.oldName === category ? (
                <div className="flex-1 flex gap-2 items-center mr-4">
                  <input 
                    type="text"
                    value={editingCategory.newName}
                    onChange={(e) => setEditingCategory({ ...editingCategory, newName: e.target.value })}
                    className="flex-1 bg-white border border-brand-red rounded px-3 py-1.5 text-sm focus:outline-none"
                    autoFocus
                  />
                  <button 
                    onClick={() => handleRenameCategory(editingCategory.oldName, editingCategory.newName)}
                    className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setEditingCategory(null)}
                    className="p-1.5 text-gray-500 hover:bg-gray-200 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="font-medium text-gray-800 flex-1">{category}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-200 mr-2">
                      {products.filter(p => p.category === category).length} itens
                    </span>
                    <button 
                      onClick={() => setEditingCategory({ oldName: category, newName: category })}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                      title="Renomear Categoria"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(category)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Excluir Categoria"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {config.categories.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">Nenhuma categoria cadastrada.</div>
          )}
        </div>
      </div>
    </div>
  );
}
