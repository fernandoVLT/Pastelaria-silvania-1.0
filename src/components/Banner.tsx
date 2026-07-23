import { useStore } from '../contexts/StoreContext';

export function Banner() {
  const { config } = useStore();
  
  let formattedNumber = (config.whatsappNumber || '').replace(/\D/g, '');
  if (!formattedNumber.startsWith('55')) formattedNumber = `55${formattedNumber}`;
  const whatsappLink = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(config.whatsappMessages?.contact || 'Olá, gostaria de tirar dúvidas!')}`;

  return (
    <div className="relative h-72 md:h-96 w-full overflow-hidden bg-brand-yellow border-b border-gray-200">
      <img
        src={config.bannerUrl || "https://images.unsplash.com/photo-1628042455113-63b7e411ea99?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"}
        alt="Pastéis crocantes e deliciosos"
        loading="lazy"
        className="object-cover w-full h-full opacity-40 mix-blend-multiply grayscale-0"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent flex items-end">
        <div className="max-w-7xl mx-auto px-4 pb-12 w-full">
          <div className="max-w-2xl">
             <h1 className="text-5xl md:text-7xl font-display leading-[1.1] sm:leading-[0.85] tracking-tight mb-6 text-white drop-shadow-md">
                {config.logoText.split(' ').map((word, i, arr) => 
                  i === arr.length - 1 ? <span key={i} className="text-brand-yellow">{word}</span> : word + ' '
                )}
             </h1>
             <p className="text-gray-200 text-sm md:text-base leading-relaxed tracking-wider mb-8 font-medium uppercase">{config.logoDescription}</p>
             <div className="flex flex-wrap items-center gap-4">
                {config.isOpen ? (
                  <span className="px-3 py-1.5 bg-brand-red border-none text-white text-[10px] font-bold tracking-[0.2em] rounded-full flex items-center gap-2 shadow-sm">
                     <div className="w-2 h-2 rounded-full bg-brand-yellow animate-pulse"></div>
                     ABERTO AGORA
                  </span>
                ) : (
                  <span className="px-3 py-1.5 bg-gray-600 border-none text-white text-[10px] font-bold tracking-[0.2em] rounded-full flex items-center gap-2 shadow-sm">
                     <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                     FECHADO
                  </span>
                )}
                {config.whatsappNumber && (
                  <a href={whatsappLink} target="_blank" rel="noreferrer" className="px-4 py-2 bg-white text-gray-900 border border-transparent hover:border-brand-yellow text-xs font-bold tracking-[0.2em] rounded-full shadow-sm flex items-center gap-2 hover:bg-gray-50 transition-all uppercase">
                     <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#25D366]"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                     Fale Conosco
                  </a>
                )}
                {config.deliveryTimeType === 'fixed' && config.fixedDeliveryTime ? (
                  <span className="px-4 py-2 bg-gray-900 border border-gray-700 text-gray-200 text-xs font-bold tracking-[0.2em] rounded-full shadow-sm flex items-center gap-2 hover:bg-gray-800 transition-all uppercase">
                    ⏳ ~{config.fixedDeliveryTime} min p/ Entrega
                  </span>
                ) : config.deliveryTimeType === 'range' && config.minDeliveryTime && config.maxDeliveryTime ? (
                  <span className="px-4 py-2 bg-gray-900 border border-gray-700 text-gray-200 text-xs font-bold tracking-[0.2em] rounded-full shadow-sm flex items-center gap-2 hover:bg-gray-800 transition-all uppercase">
                    ⏳ {config.minDeliveryTime}-{config.maxDeliveryTime} min p/ Entrega
                  </span>
                ) : null}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
