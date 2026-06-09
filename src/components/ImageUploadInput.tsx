import React, { useRef, useState } from 'react';
import { Upload, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { notify } from './NotificationOverlay';
import { compressImage } from '../utils/imageUtils';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ImageUploadInput({ label, value, onChange, placeholder }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify.error('Por favor, selecione uma imagem.');
      return;
    }

    try {
      setIsUploading(true);
      const base64Image = await compressImage(file);
      onChange(base64Image);
      notify.success('Imagem carregada com sucesso!');
    } catch (err) {
      console.error(err);
      notify.error('Erro ao processar imagem.');
    } finally {
      setIsUploading(false);
      // Reset input so the same file could be picked again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">{label}</label>
      <div className="flex bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-brand-red">
        <div className="flex flex-1">
          <div className="flex items-center pl-3 text-gray-400">
            <LinkIcon className="w-4 h-4" />
          </div>
          <input 
            type="text" 
            value={value} 
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder || 'URL da imagem ou faça upload...'}
            className="w-full bg-transparent p-3 text-gray-900 border-none focus:outline-none focus:ring-0 text-sm"
          />
        </div>
        <div className="border-l border-gray-200 flex items-center justify-center bg-white hover:bg-gray-50 transition-colors">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2 text-brand-red font-bold text-xs uppercase tracking-widest flex items-center gap-2 h-full disabled:opacity-50"
          >
            {isUploading ? (
               <span className="w-4 h-4 rounded-full border-2 border-brand-red border-t-transparent animate-spin inline-block"></span>
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Upload</span>
          </button>
        </div>
      </div>
    </div>
  );
}
