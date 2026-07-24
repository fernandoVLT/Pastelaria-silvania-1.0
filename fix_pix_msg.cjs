const fs = require('fs');
let code = fs.readFileSync('src/components/CheckoutModal.tsx', 'utf-8');

const targetStr = `      if (paymentMethod === 'Pix') {
        if (config.bbPixConfig?.enabled) {`;
const replacementStr = `      if (paymentMethod === 'Pix Manual') {
        wppMessage += \`\\n\\n⚠️ *Atenção:* O pedido só será confirmado após o envio do comprovante Pix por aqui!\\n\`;
      }
      
      if (paymentMethod === 'Pix') {
        if (config.bbPixConfig?.enabled) {`;
        
code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/components/CheckoutModal.tsx', code);
