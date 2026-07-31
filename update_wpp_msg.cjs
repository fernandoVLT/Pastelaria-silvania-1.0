const fs = require('fs');
let code = fs.readFileSync('src/components/CheckoutModal.tsx', 'utf-8');

code = code.replace(
  `      if (paymentMethod === 'Pix Manual') {
        wppMessage += \`\\n\\n⚠️ *Atenção:* O pedido só será confirmado após o envio do comprovante Pix por aqui!\\n\`;
      }`,
  `      if (paymentMethod === 'Pix Manual') {
        wppMessage += \`\\n\\n⚠️ *Comprovante Pix:* O cliente anexou o comprovante de pagamento no sistema. Você pode validá-ro no painel de pedidos.\\n\`;
      }`
);

fs.writeFileSync('src/components/CheckoutModal.tsx', code);
