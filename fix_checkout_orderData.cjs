const fs = require('fs');
let code = fs.readFileSync('src/components/CheckoutModal.tsx', 'utf-8');

code = code.replace(
  `        statusLog: [{
          status: initialStatus,
          timestamp: Date.now(),
          user: 'Cliente (App)'
        }]`,
  `        statusLog: [{
          status: initialStatus,
          timestamp: Date.now(),
          user: 'Cliente (App)'
        }],
        pixReceiptUrl: (paymentMethod === 'Pix Manual' && pixReceiptUrl) ? pixReceiptUrl : undefined`
);

fs.writeFileSync('src/components/CheckoutModal.tsx', code);
