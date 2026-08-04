import { 
  X, ChevronLeft, ChevronRight, Check, MapPin, Store, Utensils, 
  CreditCard, Wallet, Banknote, QrCode, Copy, CheckCircle, 
  Pencil, Percent, User, Phone, AlertCircle 
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'motion/react';
import { notify } from './NotificationOverlay';
import { useStore } from '../contexts/StoreContext';
import { CartItem, PaymentMethod, OrderType } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { generatePixCode } from '../utils/pix';
import { ImageUploadInput } from './ImageUploadInput';

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
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // Step 1 - Entrega & Cliente
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('Delivery');
  const [neighborhood, setNeighborhood] = useState(ALLOWED_NEIGHBORHOODS[0]);
  const [street, setStreet] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [reference, setReference] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // Step 2 - Pagamento & Cupom
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [needsChange, setNeedsChange] = useState<boolean>(false);
  const [changeFor, setChangeFor] = useState<number | ''>('');
  const [couponCode, setCouponCode] = useState('');
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [twoPaymentsNote, setTwoPaymentsNote] = useState('');
  const [isTwoPaymentsOpen, setIsTwoPaymentsOpen] = useState(false);

  // Step 3 - Confirmação & CPF
  const [cpf, setCpf] = useState('');
  const [pixReceiptUrl, setPixReceiptUrl] = useState<string>('');

  // Estados de envio e pagamento
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
  const finalTotal = Math.max(0, itemsTotal + deliveryFee - appliedDiscount);

  // Formatação de Previsão de Entrega
  const getDeliveryEstimate = () => {
    const minMins = config.deliveryTimeType === 'fixed' 
      ? (config.fixedDeliveryTime || 40)
      : (config.minDeliveryTime || 40);
    const maxMins = config.deliveryTimeType === 'fixed'
      ? (config.fixedDeliveryTime || 50) + 10
      : (config.maxDeliveryTime || 50);

    const now = new Date();
    const minTime = new Date(now.getTime() + minMins * 60000);
    const maxTime = new Date(now.getTime() + maxMins * 60000);

    const formatH = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return `${formatH(minTime)} - ${formatH(maxTime)}`;
  };

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

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    if (code === 'DESCONTO10' || code === '10OFF' || code === 'PASTEL10') {
      const discount = itemsTotal * 0.10;
      setAppliedDiscount(discount);
      notify.success('Cupom de 10% aplicado com sucesso!');
    } else if (code === 'PRIMEIRA' || code === '5OFF') {
      const discount = itemsTotal * 0.05;
      setAppliedDiscount(discount);
      notify.success('Cupom de 5% aplicado com sucesso!');
    } else {
      notify.error('Cupom inválido ou expirado.');
    }
  };

  const handleNextStep1 = () => {
    if (!name.trim()) {
      notify.error('Por favor, informe o seu nome completo.');
      return;
    }
    if (!phone.trim()) {
      notify.error('Por favor, informe seu telefone / WhatsApp.');
      return;
    }
    if (orderType === 'Delivery') {
      if (!street.trim() || !addressNumber.trim()) {
        notify.error('Preencha a rua e o número para entrega.');
        return;
      }
      if (!neighborhood.trim()) {
        notify.error('Selecione o bairro de entrega.');
        return;
      }
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!paymentMethod) {
      notify.error('Selecione uma forma de pagamento para continuar.');
      return;
    }
    if (paymentMethod === 'Dinheiro' && needsChange) {
      if (!changeFor || Number(changeFor) <= finalTotal) {
        notify.error('Informe um valor de troco válido, maior que o total do pedido.');
        return;
      }
    }
    setStep(3);
  };

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
        cpf: cpf.trim() || undefined,
        orderType,
        paymentMethod: twoPaymentsNote ? `${paymentMethod} (${twoPaymentsNote})` : paymentMethod,
        needsChange: paymentMethod === 'Dinheiro' ? needsChange : undefined,
        changeFor: paymentMethod === 'Dinheiro' && needsChange ? changeFor : undefined,
        items: orderItems,
        subtotal: itemsTotal,
        deliveryFee,
        total: finalTotal,
        appliedDiscount: appliedDiscount > 0 ? appliedDiscount : undefined,
        couponCode: appliedDiscount > 0 ? couponCode.trim().toUpperCase() : undefined,
        status: initialStatus,
        createdAt: Date.now(),
        statusLog: [{
          status: initialStatus,
          timestamp: Date.now(),
          user: 'Cliente (App)'
        }],
        pixReceiptUrl: (paymentMethod === 'Pix Manual' && pixReceiptUrl) ? pixReceiptUrl : undefined
      };

      if (orderType === 'Delivery') {
        orderData.address = {
          neighborhood,
          street: street.trim(),
          number: addressNumber.trim(),
          complement: complement.trim(),
          reference: reference.trim()
        };
      }

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
      wppMessage += `*📞 Telefone:* ${phone.trim()}\n`;
      if (cpf.trim()) {
        wppMessage += `*📄 CPF na Nota:* ${cpf.trim()}\n`;
      }
      wppMessage += `\n`;
      
      if (orderType === 'Delivery') {
        wppMessage += `*🛵 Tipo:* Delivery\n`;
        wppMessage += `*📍 Endereço:*\n${street.trim()}, ${addressNumber.trim()} - ${neighborhood}${complement ? '\n*Comp:* ' + complement.trim() : ''}${reference ? '\n*Ref:* ' + reference.trim() : ''}\n\n`;
      } else if (orderType === 'Consumir no local') {
        wppMessage += `*🍽️ Tipo:* Consumir no local\n\n`;
      } else {
        wppMessage += `*🏪 Tipo:* Retirada na Loja\n\n`;
      }
      
      wppMessage += `*📋 ITENS DO PEDIDO*\n`;
      wppMessage += `-------------------------------\n`;
      
      items.forEach(i => {
        wppMessage += `*👉 ${i.quantity}x ${i.product.name}*\n`;
        if (i.observation) {
          wppMessage += `   _Obs: ${i.observation}_\n`;
        }
        wppMessage += `   💰 ${i.quantity} x ${formatCurrency(i.product.price)} = ${formatCurrency(i.quantity * i.product.price)}\n\n`;
      });
      
      wppMessage += `-------------------------------\n\n`;
      wppMessage += `*💵 RESUMO FINANCEIRO*\n`;
      wppMessage += `Subtotal: ${formatCurrency(itemsTotal)}\n`;
      if (orderType === 'Delivery') {
        wppMessage += `🛵 Taxa de Entrega: ${formatCurrency(deliveryFee)}\n`;
      }
      if (appliedDiscount > 0) {
        wppMessage += `🎟️ Desconto (Cupom): -${formatCurrency(appliedDiscount)}\n`;
      }
      wppMessage += `*✅ TOTAL: ${formatCurrency(finalTotal)}*\n\n`;
      
      wppMessage += `*💳 PAGAMENTO*\n`;
      let paymentText = paymentMethod;
      if (paymentMethod === 'Dinheiro') {
        paymentText += needsChange ? ` (Troco para ${formatCurrency(Number(changeFor))})` : ' (Sem troco)';
      }
      if (twoPaymentsNote) {
        paymentText += ` | Obs: ${twoPaymentsNote}`;
      }
      wppMessage += `Forma: ${paymentText}\n\n`;
      wppMessage += `⏱️ *Tempo Estimado:* ${timeMessage}`;

      if (paymentMethod === 'Pix Manual') {
        wppMessage += `\n\n⚠️ *Comprovante Pix:* O cliente anexou o comprovante no sistema.\n`;
      }
      
      if (paymentMethod === 'Pix' || paymentMethod === 'Pix automático') {
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
              wppMessage += `\n🔗 *Código PIX (Copia e Cola):* \n${bbData.brcode}\n`;
            }
          } catch (err) {
            console.error("Erro ao gerar BB Pix", err);
          }
        } else {
          const staticPixKey = config.pixKey || '';
          const staticPixName = config.pixReceiverName || '';
          const staticPixCity = config.pixReceiverCity || '';
          const pixCode = generatePixCode(staticPixKey, staticPixName, staticPixCity, finalTotal);
          setBbBrcode(pixCode);
          wppMessage += `\n🔗 *Código PIX Copia e Cola:* \n${pixCode}\n`;
        }
      }

      const wpNumber = config.whatsappNumber ? config.whatsappNumber.replace(/\D/g, '') : '';
      const wpUrl = `https://wa.me/${wpNumber}?text=${encodeURIComponent(wppMessage)}`;
      
      window.open(wpUrl, '_blank');
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

  // TELA DE SUCESSO APÓS ENVIAR O PEDIDO
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

          {bbBrcode && (
            <div className="w-full bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center mb-4">
              <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-3">
                {paymentConfirmed ? 'Pagamento Confirmado!' : 'Pague com PIX (Copia e Cola)'}
              </p>
              {paymentConfirmed ? (
                <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 mb-4">
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
                        notify.success('Código PIX copiado!');
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

          <button 
            onClick={handleCloseSuccess}
            className="w-full bg-[#800000] hover:bg-[#680000] text-white font-bold py-4 px-6 rounded-xl transition-colors uppercase tracking-widest text-xs shadow-md"
          >
            Voltar para o Menu
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col h-[94vh] sm:h-[88vh] max-h-[850px] animate-in slide-in-from-bottom-6 duration-200">
        
        {/* HEADER MODAL COM VOLTAR, NOME E FECHAR */}
        <div className="bg-white border-b border-gray-100 p-4 sticky top-0 z-20">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => {
                if (step > 1) setStep((step - 1) as 1 | 2);
                else onClose();
              }} 
              className="p-1.5 text-gray-700 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Voltar"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h2 className="font-semibold text-lg text-gray-800">Checkout</h2>
            <button 
              onClick={onClose} 
              className="p-1.5 text-gray-700 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* STEPPER NOVO NO MODELO DAS IMAGENS */}
          <div className="relative flex items-center justify-between px-6">
            {/* Linha traseira */}
            <div className="absolute left-10 right-10 top-3.5 h-[3px] bg-gray-200 z-0">
              <div 
                className="h-full bg-[#800000] transition-all duration-300" 
                style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
              />
            </div>

            {/* Step 1: Entrega */}
            <div className="relative z-10 flex flex-col items-center">
              <button 
                onClick={() => setStep(1)}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > 1 
                    ? 'bg-[#800000] text-white' 
                    : step === 1 
                      ? 'bg-[#800000] text-white ring-4 ring-[#800000]/20' 
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
              </button>
              <span className={`text-[11px] font-medium mt-1.5 ${step >= 1 ? 'text-[#800000] font-semibold' : 'text-gray-400'}`}>
                Entrega
              </span>
            </div>

            {/* Step 2: Pagamento */}
            <div className="relative z-10 flex flex-col items-center">
              <button 
                onClick={() => { if (name && phone) setStep(2); }}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > 2 
                    ? 'bg-[#800000] text-white' 
                    : step === 2 
                      ? 'bg-[#800000] text-white ring-4 ring-[#800000]/20' 
                      : 'bg-gray-200 text-gray-400'
                }`}
              >
                {step > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : '2'}
              </button>
              <span className={`text-[11px] font-medium mt-1.5 ${step >= 2 ? 'text-[#800000] font-semibold' : 'text-gray-400'}`}>
                Pagamento
              </span>
            </div>

            {/* Step 3: Confirmação */}
            <div className="relative z-10 flex flex-col items-center">
              <button 
                onClick={() => { if (name && phone && paymentMethod) setStep(3); }}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === 3 
                    ? 'bg-[#800000] text-white ring-4 ring-[#800000]/20' 
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                3
              </button>
              <span className={`text-[11px] font-medium mt-1.5 ${step === 3 ? 'text-[#800000] font-semibold' : 'text-gray-400'}`}>
                Confirmação
              </span>
            </div>
          </div>
        </div>

        {/* CORPO DO CHECKOUT DIVERSIFICADO EM 3 PASSOS */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-white space-y-5">

          {/* ==================== PASSO 1: ENTREGA ==================== */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* DADOS DO CLIENTE */}
              <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-3">
                <div className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#800000]" />
                  Seus Dados
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="Seu Nome Completo *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#800000] transition-colors"
                  />
                  <input
                    type="tel"
                    placeholder="Seu WhatsApp com DDD *"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#800000] transition-colors"
                  />
                </div>
              </div>

              {/* OPÇÃO 1: RECEBER NO ENDEREÇO (DELIVERY) */}
              <div 
                onClick={() => setOrderType('Delivery')}
                className={`border rounded-2xl p-4 cursor-pointer transition-all ${
                  orderType === 'Delivery' 
                    ? 'border-gray-300 bg-white shadow-sm' 
                    : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm text-gray-800">Receber no seu endereço</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    orderType === 'Delivery' ? 'border-gray-800 bg-gray-800' : 'border-gray-300'
                  }`}>
                    {orderType === 'Delivery' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>

                {/* EXPANSÃO DO ENDEREÇO QUANDO DELIVERY ESTÁ ATIVO */}
                {orderType === 'Delivery' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    {street && addressNumber && !isEditingAddress ? (
                      <div className="flex items-start justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="flex gap-2.5">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div className="text-xs space-y-0.5 text-gray-700">
                            <div className="font-bold text-gray-900">{street}, {addressNumber}</div>
                            <div>{neighborhood}</div>
                            {complement && <div className="text-gray-500">{complement}</div>}
                            {reference && <div className="text-gray-500 italic">Ref: {reference}</div>}
                          </div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setIsEditingAddress(true); }}
                          className="text-xs font-bold text-[#800000] hover:underline shrink-0"
                        >
                          Editar
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5" onClick={(e) => e.stopPropagation()}>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="Rua / Avenida *"
                            value={street}
                            onChange={(e) => setStreet(e.target.value)}
                            className="col-span-2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#800000]"
                          />
                          <input
                            type="text"
                            placeholder="Número *"
                            value={addressNumber}
                            onChange={(e) => setAddressNumber(e.target.value)}
                            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#800000]"
                          />
                        </div>
                        <select
                          value={neighborhood}
                          onChange={(e) => setNeighborhood(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#800000]"
                        >
                          {ALLOWED_NEIGHBORHOODS.map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Complemento (Ex: Apt 201)"
                            value={complement}
                            onChange={(e) => setComplement(e.target.value)}
                            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#800000]"
                          />
                          <input
                            type="text"
                            placeholder="Ponto de referência"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#800000]"
                          />
                        </div>
                        {isEditingAddress && (
                          <button
                            type="button"
                            onClick={() => setIsEditingAddress(false)}
                            className="w-full py-2 bg-gray-800 text-white font-bold text-xs rounded-xl"
                          >
                            Confirmar Endereço
                          </button>
                        )}
                      </div>
                    )}

                    {/* BOX TAXA E TEMPO */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        <div className="w-7 h-7 rounded-full bg-gray-200/60 flex items-center justify-center text-gray-600 text-xs font-bold">
                          $
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400 font-medium">Taxa de entrega</div>
                          <div className="text-xs font-bold text-gray-800">{formatCurrency(deliveryFee)}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        <div className="w-7 h-7 rounded-full bg-gray-200/60 flex items-center justify-center text-gray-600">
                          ⏱️
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400 font-medium">Tempo de espera</div>
                          <div className="text-xs font-bold text-gray-800">{getDeliveryEstimate()}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* OPÇÃO 2: RETIRAR NO ESTABELECIMENTO */}
              <div 
                onClick={() => setOrderType('Retirada')}
                className={`border rounded-2xl p-4 cursor-pointer transition-all ${
                  orderType === 'Retirada' 
                    ? 'border-gray-300 bg-white shadow-sm' 
                    : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                      <Store className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm text-gray-800">Retirar no estabelecimento</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    orderType === 'Retirada' ? 'border-gray-800 bg-gray-800' : 'border-gray-300'
                  }`}>
                    {orderType === 'Retirada' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              </div>

              {/* OPÇÃO 3: CONSUMIR NO LOCAL */}
              <div 
                onClick={() => setOrderType('Consumir no local')}
                className={`border rounded-2xl p-4 cursor-pointer transition-all ${
                  orderType === 'Consumir no local' 
                    ? 'border-gray-300 bg-white shadow-sm' 
                    : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                      <Utensils className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm text-gray-800">Consumir no local</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    orderType === 'Consumir no local' ? 'border-gray-800 bg-gray-800' : 'border-gray-300'
                  }`}>
                    {orderType === 'Consumir no local' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ==================== PASSO 2: PAGAMENTO ==================== */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* CUPOM DE DESCONTO */}
              <div className="border border-gray-200 rounded-2xl p-3.5 bg-white">
                <button
                  type="button"
                  onClick={() => setIsCouponOpen(!isCouponOpen)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                      <Percent className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-gray-800">Tem um cupom?</div>
                      <div className="text-[11px] text-gray-400">
                        {appliedDiscount > 0 ? `Cupom aplicado: -${formatCurrency(appliedDiscount)}` : 'Clique e insira o código'}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isCouponOpen ? 'rotate-90' : ''}`} />
                </button>

                {isCouponOpen && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                    <input
                      type="text"
                      placeholder="Código do cupom (ex: DESCONTO10)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:border-[#800000]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="bg-[#800000] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#680000] transition-colors"
                    >
                      Aplicar
                    </button>
                  </div>
                )}
              </div>

              {/* PAGAR ONLINE */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-gray-800 tracking-tight">Pagar online</div>
                
                <div 
                  onClick={() => setPaymentMethod('Pix')}
                  className={`border rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === 'Pix' 
                      ? 'border-emerald-500 bg-emerald-50/20' 
                      : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center text-white">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-xs text-gray-800">Pix automático</span>
                  </div>
                  <span className="text-[10px] font-medium bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
                    Mais usado
                  </span>
                </div>
              </div>

              {/* PAGAR NA ENTREGA */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-gray-800 tracking-tight">Pagar na entrega</div>

                {/* DINHEIRO */}
                <div 
                  onClick={() => setPaymentMethod('Dinheiro')}
                  className={`border rounded-xl p-3.5 cursor-pointer transition-all ${
                    paymentMethod === 'Dinheiro' 
                      ? 'border-gray-800 bg-white shadow-sm' 
                      : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center text-gray-700">
                        <Banknote className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-xs text-gray-800">Dinheiro</span>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      paymentMethod === 'Dinheiro' ? 'border-gray-800 bg-gray-800' : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'Dinheiro' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>

                  {paymentMethod === 'Dinheiro' && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between text-xs text-gray-700">
                        <span>Precisa de troco?</span>
                        <button
                          type="button"
                          onClick={() => {
                            setNeedsChange(!needsChange);
                            if (needsChange) setChangeFor('');
                          }}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${needsChange ? 'bg-[#800000]' : 'bg-gray-300'}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${needsChange ? 'translate-x-4.5' : 'translate-x-1'}`} />
                        </button>
                      </div>

                      {needsChange && (
                        <input
                          type="text"
                          placeholder="Troco para quanto? Ex: 50"
                          value={changeFor}
                          onChange={(e) => setChangeFor(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#800000]"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* CARTÃO DE CRÉDITO */}
                <div 
                  onClick={() => setPaymentMethod('Cartão de Crédito')}
                  className={`border rounded-xl p-3.5 cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === 'Cartão de Crédito' 
                      ? 'border-gray-800 bg-white shadow-sm' 
                      : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center text-gray-700">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-xs text-gray-800">Cartão de crédito</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    paymentMethod === 'Cartão de Crédito' ? 'border-gray-800 bg-gray-800' : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'Cartão de Crédito' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>

                {/* CARTÃO DE DÉBITO */}
                <div 
                  onClick={() => setPaymentMethod('Cartão de Débito')}
                  className={`border rounded-xl p-3.5 cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === 'Cartão de Débito' 
                      ? 'border-gray-800 bg-white shadow-sm' 
                      : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center text-gray-700">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-xs text-gray-800">Cartão de débito</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    paymentMethod === 'Cartão de Débito' ? 'border-gray-800 bg-gray-800' : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'Cartão de Débito' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>

                {/* PIX MANUAL COM COMPROVANTE */}
                <div 
                  onClick={() => setPaymentMethod('Pix Manual')}
                  className={`border rounded-xl p-3.5 cursor-pointer transition-all ${
                    paymentMethod === 'Pix Manual' 
                      ? 'border-gray-800 bg-white shadow-sm' 
                      : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center text-gray-700">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-xs text-gray-800">Pix Manual (Anexar comprovante)</span>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      paymentMethod === 'Pix Manual' ? 'border-gray-800 bg-gray-800' : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'Pix Manual' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>

                  {paymentMethod === 'Pix Manual' && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3" onClick={(e) => e.stopPropagation()}>
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-center space-y-2">
                        <p className="text-xs font-bold text-gray-800">Chave PIX: {config.pixKey || 'Não configurada'}</p>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(config.pixKey || '');
                            notify.success('Chave PIX copiada!');
                          }}
                          className="bg-gray-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" /> Copiar Chave
                        </button>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Anexar Comprovante PIX</label>
                        <ImageUploadInput
                          label=""
                          value={pixReceiptUrl}
                          onChange={setPixReceiptUrl}
                          placeholder="Fazer upload do comprovante..."
                        />
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* OPÇÃO DE DUAS FORMAS DE PAGAMENTO */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsTwoPaymentsOpen(!isTwoPaymentsOpen)}
                  className="text-xs font-bold text-[#800000] hover:underline uppercase tracking-wider"
                >
                  Pagar com duas formas de pagamento
                </button>

                {isTwoPaymentsOpen && (
                  <div className="mt-2 text-left bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <textarea
                      placeholder="Especifique como deseja dividir (Ex: R$20 no Pix e o restante em dinheiro)"
                      value={twoPaymentsNote}
                      onChange={(e) => setTwoPaymentsNote(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs h-16 focus:outline-none focus:border-[#800000]"
                    />
                  </div>
                )}
              </div>

              {/* RESUMO DE VALORES STEP 2 */}
              <div className="pt-4 border-t border-gray-100 space-y-1 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(itemsTotal)}</span>
                </div>
                {orderType === 'Delivery' && (
                  <div className="flex justify-between">
                    <span>Taxa de entrega</span>
                    <span>{formatCurrency(deliveryFee)}</span>
                  </div>
                )}
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Desconto</span>
                    <span>-{formatCurrency(appliedDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-1">
                  <span>Total</span>
                  <span className="text-base text-gray-900">{formatCurrency(finalTotal)}</span>
                </div>
              </div>

            </div>
          )}

          {/* ==================== PASSO 3: CONFIRMAÇÃO ==================== */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* CPF NA NOTA */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-800">CPF na nota</label>
                <input
                  type="text"
                  placeholder="Informe o seu CPF"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#800000] placeholder:text-gray-400"
                />
              </div>

              {/* PREVISÃO DE ENTREGA */}
              <div className="text-center py-2 border-y border-dashed border-gray-100 my-2">
                <div className="text-xs text-gray-400 font-medium mb-0.5">Previsão de entrega</div>
                <div className="text-xl font-black text-gray-800 tracking-tight">{getDeliveryEstimate()}</div>
              </div>

              {/* INFORMAÇÕES PARA ENTREGA */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-gray-800">Informações para entrega</div>

                <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 flex items-start justify-between">
                  <div className="space-y-3 text-xs text-gray-700">
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4 text-gray-400 shrink-0" />
                      <div>
                        <div className="font-bold text-gray-900">{name}</div>
                        <div className="text-gray-500">{phone}</div>
                      </div>
                    </div>

                    {orderType === 'Delivery' ? (
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-bold text-gray-900">{street}, {addressNumber}</div>
                          <div className="text-gray-600">{neighborhood}</div>
                          {complement && <div className="text-gray-500">{complement}</div>}
                          {reference && <div className="text-gray-500">{reference}</div>}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <Store className="w-4 h-4 text-gray-400 shrink-0" />
                        <div className="font-bold text-gray-900">
                          {orderType === 'Consumir no local' ? 'Consumir no local' : 'Retirada no estabelecimento'}
                        </div>
                      </div>
                    )}
                  </div>

                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="p-1.5 text-gray-400 hover:text-[#800000] transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ITENS DO PEDIDO */}
              <div className="space-y-2 pt-1">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                      <span className="bg-gray-100 border border-gray-200 text-gray-800 font-bold px-2 py-1 rounded-lg shrink-0">
                        {item.quantity}x
                      </span>
                      <div className="min-w-0">
                        <span className="font-semibold text-gray-800 block truncate">{item.product.name}</span>
                        {item.observation && <span className="text-[10px] text-gray-400 italic block">Obs: {item.observation}</span>}
                      </div>
                    </div>
                    <span className="font-bold text-gray-900 shrink-0">{formatCurrency(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* RESUMO DO PEDIDO */}
              <div className="pt-2 border-t border-gray-100 space-y-1.5 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(itemsTotal)}</span>
                </div>
                {orderType === 'Delivery' && (
                  <div className="flex justify-between">
                    <span>Taxa de entrega</span>
                    <span>{formatCurrency(deliveryFee)}</span>
                  </div>
                )}
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Desconto</span>
                    <span>-{formatCurrency(appliedDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-1">
                  <span>Total</span>
                  <span className="text-base text-gray-900">{formatCurrency(finalTotal)}</span>
                </div>
              </div>

              {/* FORMA DE PAGAMENTO SELECIONADA */}
              <div className="space-y-1.5 pt-1">
                <div className="text-xs font-bold text-gray-800">Pagamento</div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 font-semibold text-gray-800">
                    {paymentMethod === 'Pix' && <QrCode className="w-4 h-4 text-teal-600" />}
                    {paymentMethod === 'Dinheiro' && <Banknote className="w-4 h-4 text-emerald-600" />}
                    {paymentMethod === 'Cartão de Crédito' && <CreditCard className="w-4 h-4 text-blue-600" />}
                    {paymentMethod === 'Cartão de Débito' && <Wallet className="w-4 h-4 text-purple-600" />}
                    <span>{paymentMethod || 'Não informado'}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setStep(2)}
                    className="p-1 text-gray-400 hover:text-[#800000] transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* AVISO DO ENDEREÇO */}
              <div className="text-center pt-2">
                <p className="text-xs font-medium text-gray-600">
                  Confira se o endereço para recebimento está correto!
                </p>
              </div>

            </div>
          )}

        </div>

        {/* RODAPÉ DO CHECKOUT COM BOTÃO DE AÇÃO */}
        <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0 z-20">
          {step === 1 && (
            <button
              type="button"
              onClick={handleNextStep1}
              className="w-full bg-[#800000] hover:bg-[#680000] text-white font-bold py-3.5 px-6 rounded-xl transition-colors text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md"
            >
              <span>CONTINUAR</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {step === 2 && (
            <button
              type="button"
              onClick={handleNextStep2}
              className="w-full bg-[#800000] hover:bg-[#680000] text-white font-bold py-3.5 px-6 rounded-xl transition-colors text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md"
            >
              <span>CONTINUAR</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={handleSubmitOrder}
              disabled={isCreating}
              className="w-full bg-[#800000] hover:bg-[#680000] text-white font-bold py-3.5 px-6 rounded-xl transition-colors text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {isCreating ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                'ENVIAR PEDIDO'
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
