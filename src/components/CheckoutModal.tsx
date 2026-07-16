import { X, QrCode, CreditCard, Wallet, Utensils, CheckCircle, ExternalLink, MapPin, Store, Copy, Banknote, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'motion/react';
import { notify } from './NotificationOverlay';
import { useStore } from '../contexts/StoreContext';
import { CartItem, PaymentMethod, OrderType } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { generatePixCode } from '../utils/pix';

interface Props {
  items: CartItem[];
  total: number;
  onClose: () => void;
  onFinish: () => void;
}

const FALLBACK_PAYMENT_METHODS: PaymentMethod[] = [
  'Pix',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Vale Alimentação',
  'Dinheiro'
];

const ALLOWED_NEIGHBORHOODS = [
  "Alto do Chalé", "Amália Rodrigues", "Bandeirantes", "Bela Vista", "Belvedere",
  "Campo Novo", "Centro", "Dom Orione", "Flores", "Inconfidentes", "Jardim Belo Horizonte",
  "Jardim Belo Vale", "Jardim Monte Belo", "Luzia Augusta", "Metalúrgicos", "Minas Talco",
  "Nova Serrana", "Novo Horizonte", "Pioneiros", "Primeiro de Maio", "São Francisco",
  "Serra Verde", "Siderurgia", "Soledade", "Vale do Engenho", "Portaria Leste da Gerdau"
];

export function CheckoutModal({ items, total: itemsTotal, onClose, onFinish }: Props) {
  const { config, recordSale, createOrder, updateOrderStatus } = useStore();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('Delivery');
  const [neighborhood, setNeighborhood] = useState(ALLOWED_NEIGHBORHOODS[0]);
  const [street, setStreet] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [needsChange, setNeedsChange] = useState<boolean>(false);
  const [changeFor, setChangeFor] = useState<number | ''>('');
  const [isOrderSent, setIsOrderSent] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [wpUrl, setWpUrl] = useState('');
  const [paymentLink, setPaymentLink] = useState('');
  const [bbBrcode, setBbBrcode] = useState('');
  const [bbTxid, setBbTxid] = useState('');
  const [isPollingPix, setIsPollingPix] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState('');

  const deliveryFee = orderType === 'Delivery' ? (config.deliveryFee || 3.00) : 0;
  const finalTotal = itemsTotal + deliveryFee;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOrderSent && bbTxid && !paymentConfirmed) {
      setIsPollingPix(true);
      interval = setInterval(async () => {
        try {
          const res = await fetch('/api/bb-pix-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              txid: bbTxid,
              bbPixConfig: config.bbPixConfig
            })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'CONCLUIDA') {
              setPaymentConfirmed(true);
              setIsPollingPix(false);
              clearInterval(interval);
              notify.success('Pagamento PIX confirmado com sucesso!');
              // Atualizar status no banco
              if (createdOrderId) {
                await updateOrderStatus(createdOrderId, 'Feito');
              }
            }
          }
        } catch (err) {
          console.error("Erro polling PIX:", err);
        }
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOrderSent, bbTxid, paymentConfirmed, createdOrderId, config.bbPixConfig, updateOrderStatus]);

  const handleSubmitOrder = async () => {
    const minOrder = config.minOrderValue || 20;
    if (itemsTotal < minOrder) {
      notify.error(`Adicione mais produtos. O valor mínimo é de ${formatCurrency(minOrder)} em itens.`);
      return;
    }

    if (!name.trim() || !phone.trim() || !paymentMethod) {
      notify.error('Preencha seu nome, WhatsApp e a forma de pagamento.');
      return;
    }
    
    if (paymentMethod === 'Dinheiro' && needsChange) {
      if (!changeFor || Number(changeFor) <= finalTotal) {
        notify.error('Informe um valor de troco válido, maior que o total do pedido.');
        return;
      }
    }

    if (orderType === 'Delivery') {
      if (!street.trim() || !addressNumber.trim()) {
        notify.error('Preencha a rua e o número para entrega.');
        return;
      }
    }

    setIsCreating(true);

    const orderItems = items.map(i => ({
      productName: i.product.name,
      category: i.product.category,
      description: i.product.description,
      quantity: i.quantity,
      price: i.product.price,
      observation: i.observation
    }));

    try {
      const initialStatus = paymentMethod.includes('Pix') ? 'Aguardando Confirmação Pix' : 'Feito';
      const orderData: any = {
        customerName: name.trim(),
        customerPhone: phone.trim(),
        orderType,
        paymentMethod,
        needsChange: paymentMethod === 'Dinheiro' ? needsChange : undefined,
        changeFor: paymentMethod === 'Dinheiro' && needsChange ? changeFor : undefined,
        items: orderItems,
        subtotal: itemsTotal,
        deliveryFee,
        total: finalTotal,
        status: initialStatus,
        createdAt: Date.now(),
        statusLog: [{
          status: initialStatus,
          timestamp: Date.now(),
          user: 'Cliente (App)'
        }]
      };

      if (orderType === 'Delivery') {
        orderData.address = {
          neighborhood,
          street: street.trim(),
          number: addressNumber.trim()
        };
      }

      // Firestore doesn't accept undefined values
      const cleanOrderData = JSON.parse(JSON.stringify(orderData));

      const orderId = await createOrder(cleanOrderData);
      setCreatedOrderId(orderId);

      recordSale(items.map(i => ({ productId: i.product.id, quantity: i.quantity })));
      
      const timeMessage = orderType === 'Delivery' 
        ? (config.deliveryTimeType === 'fixed' 
            ? `${config.fixedDeliveryTime} min` 
            : `${config.minDeliveryTime} a ${config.maxDeliveryTime} min`)
        : (config.deliveryTimeType === 'fixed'
            ? `${config.fixedDeliveryTime} min`
            : `${config.minPickupTime} a ${config.maxPickupTime} min`);

      const shortOrderId = orderId.substring(0, 4).toUpperCase();
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR');
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      let wppMessage = `🍔 *NOVO PEDIDO* 🍔\n\n`;
      wppMessage += `*#️⃣ Pedido:* ${shortOrderId}\n`;
      wppMessage += `*🕒 Feito em:* ${dateStr} às ${timeStr}\n\n`;
      wppMessage += `*👤 Cliente:* ${name.trim()}\n`;
      wppMessage += `*📞 Telefone:* ${phone.trim()}\n\n`;
      
      if (orderType === 'Delivery') {
        wppMessage += `*🛵 Tipo:* Delivery\n`;
        wppMessage += `*📍 Endereço:*\n${street.trim()}, ${addressNumber.trim()} - ${neighborhood}\n\n`;
      } else {
        wppMessage += `*🏪 Tipo:* Retirada na Loja\n\n`;
      }
      
      wppMessage += `*📋 ITENS DO PEDIDO*\n`;
      wppMessage += `-------------------------------\n`;
      
      items.forEach(i => {
        wppMessage += `*👉 ${i.quantity}x ${i.product.name}*\n`;
        if (i.product.category) {
          wppMessage += `   _Categoria: ${i.product.category}_\n`;
        }
        wppMessage += `   💰 ${i.quantity} x ${formatCurrency(i.product.price)} = ${formatCurrency(i.quantity * i.product.price)}\n\n`;
      });
      
      wppMessage += `-------------------------------\n\n`;
      wppMessage += `*💵 RESUMO FINANCEIRO*\n`;
      wppMessage += `Subtotal: ${formatCurrency(itemsTotal)}\n`;
      if (orderType === 'Delivery') {
        wppMessage += `🛵 Taxa de Entrega: ${formatCurrency(deliveryFee)}\n`;
      }
      wppMessage += `*✅ TOTAL: ${formatCurrency(finalTotal)}*\n\n`;
      
      wppMessage += `*💳 PAGAMENTO*\n`;
      let paymentText = paymentMethod;
      if (paymentMethod === 'Dinheiro') {
        paymentText += needsChange ? ` (Troco para ${formatCurrency(Number(changeFor))})` : ' (Sem troco)';
      }
      wppMessage += `Forma: ${paymentText}\n\n`;
      wppMessage += `⏱️ *Tempo Estimado:* ${timeMessage}`;

      if (paymentMethod === 'Pix') {
        if (config.bbPixConfig?.enabled) {
          try {
            const bbRes = await fetch('/api/bb-pix', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                amount: finalTotal,
                txid: orderId.replace(/-/g, '').slice(0, 32),
                bbPixConfig: config.bbPixConfig
              })
            });
            const bbData = await bbRes.json();
            if (bbData.brcode) {
              setBbBrcode(bbData.brcode);
              setBbTxid(bbData.txid || '');
              wppMessage += `\n🔗 *Código PIX (Copia e Cola) Banco do Brasil:* \n${bbData.brcode}\n`;
            } else if (bbData.error) {
              console.error("BB Pix API error:", bbData.error);
            }
          } catch (err) {
            console.error("Erro ao gerar BB Pix", err);
          }
        } else {
          const staticPixKey = config.pixKey || '5531996698807';
          const staticPixName = config.pixReceiverName || 'SILVANIA BARRETO DE ALMEIDA';
          const staticPixCity = config.pixReceiverCity || 'BELO HORIZONTE';
          const pixCode = generatePixCode(staticPixKey, staticPixName, staticPixCity, finalTotal);
          setBbBrcode(pixCode);
          wppMessage += `\n🔗 *Código PIX Copia e Cola:* \n${pixCode}\n`;
        }
      }

      const wpNumber = config.whatsappNumber ? config.whatsappNumber.replace(/\D/g, '') : '';
      const wpUrl = `https://wa.me/${wpNumber}?text=${encodeURIComponent(wppMessage)}`;
      
      const newWindow = window.open(wpUrl, '_blank');
      // Adiciona o wpUrl ao estado para usar depois se o bloqueador de popup tiver agido
      setWpUrl(wpUrl);
      
      setIsOrderSent(true);
      notify.success('Pedido enviado com sucesso!');
    } catch (e) {
      notify.error('Houve um erro ao enviar seu pedido. Tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseSuccess = () => {
    onFinish();
    onClose();
  };

// ... removed nested import
  if (isOrderSent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="bg-white border flex flex-col items-center border-gray-100 rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-500"
          >
            <CheckCircle className="w-10 h-10" />
          </motion.div>
          <h2 className="font-black text-2xl tracking-tight text-gray-900 mb-2">Pedido Enviado!</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed whitespace-pre-line">
            {config.orderSuccessMessage || 'Seu pedido foi registrado! Caso o WhatsApp não tenha aberto automaticamente, clique no botão abaixo.'}
          </p>
          <div className="flex flex-col gap-3 w-full">
            {bbBrcode && (
              <div className="w-full bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center mb-2">
                <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-3">
                  {paymentConfirmed ? 'Pagamento Confirmado!' : 'Pague com PIX (Banco do Brasil)'}
                </p>
                {paymentConfirmed ? (
                  <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 mb-4 scale-in">
                    <CheckCircle className="w-12 h-12" />
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm mb-3 relative">
                      <QRCodeSVG value={bbBrcode} size={150} level="M" includeMargin={true} />
                      {isPollingPix && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-2xl">
                          <div className="w-6 h-6 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-[10px] font-bold text-teal-700 mt-2 bg-white px-2 py-1 rounded-full shadow-sm">Aguardando...</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col gap-3">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Pix Copia e Cola</div>
                      <div className="w-full bg-white border border-gray-200 rounded-lg p-3 text-xs font-mono text-gray-500 break-all select-all line-clamp-2">
                        {bbBrcode}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(bbBrcode);
                          notify.success('Código PIX Copia e Cola copiado!');
                        }}
                        className="bg-teal-500 hover:bg-teal-600 text-white py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Copy className="w-4 h-4" /> Copiar Código Pix
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            {paymentLink && !bbBrcode && (
              <a 
                href={paymentLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-black h-12 rounded-xl transition-all uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 shadow-md shadow-teal-500/20"
              >
                Pagar com PIX Agora
              </a>
            )}
            
            {paymentMethod === 'Pix Manual' && (
               <div className="w-full bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center mb-2">
                 <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-3">
                   Pague com Pix Manual
                 </p>
                 <div className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm mb-4 relative">
                   <QRCodeSVG 
                     value={generatePixCode('5531996698807', 'SILVANIA BARRETO DE ALMEIDA', 'BELO HORIZONTE', finalTotal)} 
                     size={150} level="M" includeMargin={true} 
                   />
                 </div>
                 
                 <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col gap-3">
                    <div className="flex justify-between items-center bg-white border border-gray-200 rounded-lg p-3">
                       <div className="flex flex-col text-left">
                         <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Chave Celular</span>
                         <span className="font-mono font-bold text-gray-700 mt-0.5 text-xs">+5531996698807</span>
                       </div>
                       <button
                         onClick={() => {
                            navigator.clipboard.writeText('5531996698807');
                            notify.success('Chave copiada!');
                         }}
                         className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                         aria-label="Copiar Chave"
                       >
                         <Copy className="w-3 h-3" />
                       </button>
                    </div>

                    <div className="flex flex-col gap-2 mt-1">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Ou use o Copia e Cola</div>
                      <button
                        onClick={() => {
                          const code = generatePixCode('5531996698807', 'SILVANIA BARRETO DE ALMEIDA', 'BELO HORIZONTE', finalTotal);
                          navigator.clipboard.writeText(code);
                          notify.success('Código PIX Copia e Cola copiado!');
                        }}
                        className="bg-teal-500 hover:bg-teal-600 text-white w-full py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Copy className="w-4 h-4" /> Copiar PIX Copia e Cola
                      </button>
                    </div>
                 </div>
               </div>
            )}
            
            <a 
              href={wpUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-black h-12 rounded-xl transition-all uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 shadow-md shadow-[#25D366]/20 mt-2"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Abrir no WhatsApp
            </a>
            <button 
              onClick={handleCloseSuccess}
              className="w-full bg-brand-yellow hover:bg-yellow-400 text-gray-900 font-black h-12 rounded-xl transition-all uppercase text-[10px] tracking-[0.2em]"
            >
              Voltar para a Loja
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const pixPayload = generatePixCode(config.pixKey || '', config.pixReceiverName || config.logoText, config.pixReceiverCity || 'Cidade', finalTotal);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white border border-gray-100 md:rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col rounded-t-3xl animate-in slide-in-from-bottom-full md:zoom-in-95 duration-300 h-[92vh] md:h-[85vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-20">
          <h2 className="font-black text-xl tracking-tight uppercase text-gray-900">Finalizar Pedido</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="space-y-8">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-3">Seu Nome *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="NOME COMPLETO"
                  className="w-full bg-white border border-gray-200 rounded-xl p-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent text-sm font-bold placeholder:text-gray-300 placeholder:font-normal"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-3">WhatsApp *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-white border border-gray-200 rounded-xl p-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent text-sm font-bold placeholder:text-gray-300 placeholder:font-normal"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-4">Forma de Entrega *</label>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => {
                    setOrderType('Delivery');
                    setPaymentMethod('');
                  }}
                  className={`border-2 rounded-xl p-4 text-[10px] font-black tracking-widest uppercase transition-all flex flex-col items-center justify-center gap-2 text-center h-24 ${
                    orderType === 'Delivery' 
                      ? 'border-brand-red text-brand-red bg-red-50 shadow-sm ring-2 ring-brand-red/20' 
                      : 'border-gray-200 text-gray-400 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <MapPin className="w-6 h-6 mb-1" />
                  Entrega
                </button>
                <button
                  onClick={() => {
                    setOrderType('Retirada');
                    setPaymentMethod('');
                  }}
                  className={`border-2 rounded-xl p-4 text-[10px] font-black tracking-widest uppercase transition-all flex flex-col items-center justify-center gap-2 text-center h-24 ${
                    orderType === 'Retirada' 
                      ? 'border-brand-yellow text-yellow-700 bg-yellow-50 shadow-sm ring-2 ring-brand-yellow/20' 
                      : 'border-gray-200 text-gray-400 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Store className="w-6 h-6 mb-1" />
                  Retirar no Local
                </button>
              </div>

              {orderType === 'Delivery' ? (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Bairro (Área de Cobertura) *</label>
                    <select
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent text-sm font-bold appearance-none"
                    >
                      {ALLOWED_NEIGHBORHOODS.sort().map(bairro => (
                        <option key={bairro} value={bairro}>{bairro}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-[1fr_100px] gap-3">
                    <div>
                      <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Rua *</label>
                      <input
                        type="text"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="Nome da rua"
                        className="w-full bg-white border border-gray-200 rounded-xl p-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent text-sm font-bold"
                      />
                    </div>
                    <div>
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
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 animate-in fade-in duration-300 text-center">
                  <Store className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <h4 className="font-bold text-yellow-800 uppercase tracking-widest text-xs mb-1">Endereço de Retirada</h4>
                  <p className="text-yellow-700 font-medium text-sm">
                    Rua Lobo Leite, nº 100<br/>
                    Bairro Primeiro de Maio<br/>
                    <span className="text-xs mt-1 block opacity-80">(Do lado direito da pastelaria)</span>
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold tracking-widest uppercase mb-0 whitespace-normal leading-relaxed text-brand-red">
                Mensagem de observação<br/><span className="text-gray-500 font-medium">(Não é possível editar observação após envio do pedido)</span>
              </p>
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
                      className={`relative border-2 rounded-xl p-4 text-[9px] font-black tracking-widest uppercase transition-all flex flex-col items-center justify-center gap-3 text-center h-28 ${
                        isSelected 
                          ? `${border} ${color} ${bg} shadow-md scale-105 z-10 ring-4 ring-${color.split('-')[1]}-500/20` 
                          : 'border-gray-200 text-gray-400 bg-white hover:border-gray-300 hover:bg-gray-50 hover:text-gray-600'
                      }`}
                    >
                      <Icon className={`w-8 h-8 transition-colors ${isSelected ? color : 'text-gray-300 group-hover:text-gray-500'}`} />
                      <span>{method}</span>
                      {isSelected && (
                         <div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full ${bg} border-2 ${border} flex items-center justify-center`}>
                           <div className={`w-2 h-2 rounded-full ${bg.replace('50', '500')}`}></div>
                         </div>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Payment Context Options */}
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
                      <div className="mt-3 py-2 px-4 bg-teal-50 border border-teal-100 rounded-xl inline-flex hidden">
                        {/* We use hidden here to keep the generatePixCode valid if it's imported, preventing TS errors */}
                        {generatePixCode('', '', '', 0)}
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'Pix Manual' && (
                    <div className="flex flex-col items-center text-center w-full">
                      <p className="text-xs text-brand-red mb-2 font-bold uppercase tracking-widest flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Atenção!</p>
                      <p className="text-[10px] text-gray-500 font-medium mb-4">O pedido só será aceito após o envio do comprovante Pix no número da loja.</p>
                      
                      <div className="p-3 bg-white border border-gray-200 rounded-2xl shadow-sm mb-4 relative">
                        <QRCodeSVG value={generatePixCode('5531996698807', 'SILVANIA BARRETO DE ALMEIDA', 'BELO HORIZONTE', finalTotal)} size={140} level="M" includeMargin={true} />
                      </div>
                      
                      <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col gap-3">
                        <div className="flex justify-between items-center bg-white border border-gray-200 rounded-lg p-3">
                           <div className="flex flex-col text-left">
                             <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Chave Celular</span>
                             <span className="font-mono font-bold text-gray-700 mt-0.5 text-xs">+5531996698807</span>
                           </div>
                           <button
                             type="button"
                             onClick={(e) => {
                                e.preventDefault();
                                navigator.clipboard.writeText('5531996698807');
                                notify.success('Chave copiada!');
                             }}
                             className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                             aria-label="Copiar Chave"
                           >
                             <Copy className="w-3 h-3" />
                           </button>
                        </div>
    
                        <div className="flex flex-col gap-2 mt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              const code = generatePixCode('5531996698807', 'SILVANIA BARRETO DE ALMEIDA', 'BELO HORIZONTE', finalTotal);
                              navigator.clipboard.writeText(code);
                              notify.success('Código PIX Copia e Cola copiado!');
                            }}
                            className="bg-teal-500 hover:bg-teal-600 text-white w-full py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 shadow-sm"
                          >
                            <Copy className="w-4 h-4" /> Copiar PIX Copia ou Cola
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {paymentMethod === 'Dinheiro' && (
                    <div className="flex flex-col items-center text-center w-full pb-4">
                      <p className="text-xs text-gray-500 mb-4 font-medium">Precisa de troco?</p>
                      <div className="flex gap-4 mb-4">
                        <button
                          type="button"
                          onClick={() => setNeedsChange(true)}
                          className={`px-6 py-2 rounded-xl text-xs font-bold border-2 transition-colors ${needsChange ? 'border-brand-red bg-red-50 text-brand-red' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setNeedsChange(false)}
                          className={`px-6 py-2 rounded-xl text-xs font-bold border-2 transition-colors ${!needsChange ? 'border-brand-red bg-red-50 text-brand-red' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
                        >
                          Não
                        </button>
                      </div>
                      {needsChange && (
                        <div className="w-full relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                          <input
                            type="number"
                            value={changeFor}
                            onChange={(e) => setChangeFor(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="Troco para quanto?"
                            className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red text-sm font-bold"
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

        <div className="p-6 border-t border-gray-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-6 sticky bottom-0 z-20 rounded-b-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
          <div className="w-full sm:w-auto flex flex-col space-y-1">
            <div className="flex justify-between sm:justify-start sm:gap-4 text-xs font-medium text-gray-500">
              <span>Subtotal:</span>
              <span>{formatCurrency(itemsTotal)}</span>
            </div>
            {orderType === 'Delivery' && (
              <>
                <div className="flex justify-between sm:justify-start sm:gap-4 text-xs font-medium text-gray-500">
                  <span>Taxa de Entrega:</span>
                  <span>{formatCurrency(deliveryFee)}</span>
                </div>
                {(config.deliveryTimeType === 'fixed' && config.fixedDeliveryTime) || (config.deliveryTimeType === 'range' && config.minDeliveryTime && config.maxDeliveryTime) ? (
                  <div className="flex justify-between sm:justify-start sm:gap-4 text-xs font-medium text-gray-500">
                    <span>Tempo Estimado:</span>
                    <span>
                      {config.deliveryTimeType === 'fixed' 
                        ? `~${config.fixedDeliveryTime} min` 
                        : `${config.minDeliveryTime}-${config.maxDeliveryTime} min`}
                    </span>
                  </div>
                ) : null}
              </>
            )}
            <div className="flex justify-between sm:block pt-1">
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-left">Total a Pagar</div>
              <div className="font-black text-3xl text-brand-red tracking-tight">{formatCurrency(finalTotal)}</div>
            </div>
          </div>
          <button 
            onClick={handleSubmitOrder}
            disabled={isCreating}
            className="w-full sm:flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black h-14 rounded-full transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3 uppercase text-[10px] tracking-[0.2em] shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            {isCreating ? (
               <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Confirmar e Enviar Pedido
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
