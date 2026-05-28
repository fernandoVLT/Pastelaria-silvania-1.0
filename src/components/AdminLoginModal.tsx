import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminLoginModal({ onClose, onSuccess }: Props) {
  const { config } = useStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === config.adminPassword) {
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-gray-100 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 relative">
        <button onClick={onClose} className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-900 bg-gray-100 rounded-full transition-colors z-10">
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-8 text-center pt-10">
          <div className="w-16 h-16 bg-gray-50 rounded-full border border-gray-100 flex items-center justify-center mx-auto mb-6 text-gray-400">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="font-black text-xl tracking-tight uppercase text-gray-900 mb-2">Acesso Restrito</h2>
          <p className="text-gray-500 text-xs mb-8">Digite a senha para habilitar o modo de edição.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                required
                autoFocus
                placeholder="Senha de acesso"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(false); }}
                className={`w-full bg-gray-50 border ${error ? 'border-red-500' : 'border-gray-200'} rounded-xl p-4 text-center text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red font-bold text-lg tracking-[0.25em]`}
              />
              {error && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-2">Senha incorreta</p>}
            </div>
            <button 
              type="submit"
              className="w-full bg-brand-red hover:bg-brand-red-dark text-white font-black h-12 rounded-xl transition-all uppercase text-[10px] tracking-[0.2em] mt-4"
            >
              Acessar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
