import { MapPin, Clock, Info, Instagram, Facebook, Phone, Bot } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';

export function Footer({ onOpenAdmin }: { onOpenAdmin: () => void }) {
  const { config } = useStore();

  const whatsappLink = config.whatsappNumber 
    ? `https://wa.me/55${config.whatsappNumber.replace(/\D/g, '')}`
    : '#';

  return (
    <footer className="bg-gray-900 text-white py-16 mt-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display tracking-wide mb-4 text-white inline-block relative">
            {config.logoText}
            <div className="absolute -bottom-2 w-12 h-1 bg-brand-yellow left-1/2 -translate-x-1/2"></div>
          </h2>
          <p className="text-gray-400 text-xs tracking-widest uppercase max-w-xl mx-auto mt-6">
            {config.logoDescription}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          
          <div className="text-center md:text-left flex flex-col items-center md:items-start bg-gray-800/50 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-4 text-brand-yellow">
              <Info className="w-6 h-6" />
              <h3 className="font-bold text-sm tracking-widest uppercase text-white">Sobre Nós</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-6 flex-1">
              {config.aboutText || "Nenhuma informação disponível."}
            </p>
            
            <div className="w-full mt-4 pt-4 border-t border-gray-700">
              <h4 className="font-bold text-xs tracking-widest uppercase text-gray-400 mb-3 text-center md:text-left">Redes Sociais</h4>
              <div className="flex items-center justify-center md:justify-start gap-4">
                {config.instagramUrl && (
                  <a href={config.instagramUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-brand-yellow hover:scale-110 transition-all">
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {config.facebookUrl && (
                  <a href={config.facebookUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-brand-yellow hover:scale-110 transition-all">
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
                {config.whatsappNumber && (
                   <a href={whatsappLink} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#25D366] hover:scale-110 transition-all flex items-center gap-2" title="WhatsApp">
                     <Phone className="w-5 h-5" />
                   </a>
                )}
              </div>
            </div>
          </div>

          <div className="text-center md:text-left flex flex-col items-center md:items-start bg-gray-800/50 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-4 text-brand-yellow">
              <MapPin className="w-6 h-6" />
              <h3 className="font-bold text-sm tracking-widest uppercase text-white">Localização</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
              {config.location || "Endereço não informado."}
            </p>
          </div>

          <div className="text-center md:text-left flex flex-col items-center md:items-start bg-gray-800/50 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-4 text-brand-yellow">
              <Clock className="w-6 h-6" />
              <h3 className="font-bold text-sm tracking-widest uppercase text-white">Horário</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
              {config.openingHours || "Não informado."}
            </p>
          </div>

        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-800 text-gray-500 text-xs flex items-center justify-between mx-auto max-w-4xl">
          <p>&copy; {new Date().getFullYear()} {config.logoText}. Todos os direitos reservados.</p>
          <button onClick={onOpenAdmin} className="opacity-10 hover:opacity-100 transition-opacity p-2" title="Acesso Restrito">
            <Bot className="w-5 h-5 text-gray-500 hover:text-brand-yellow" />
          </button>
        </div>
      </div>
    </footer>
  );
}
