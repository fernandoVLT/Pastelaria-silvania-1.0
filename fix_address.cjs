const fs = require('fs');
let code = fs.readFileSync('src/components/CheckoutModal.tsx', 'utf-8');

code = code.replace(
  `      if (orderType === 'Delivery') {
        orderData.address = {
          neighborhood,
          street: street.trim(),
          number: addressNumber.trim()
        };
      }`,
  `      if (orderType === 'Delivery') {
        orderData.address = {
          neighborhood,
          street: street.trim(),
          number: addressNumber.trim(),
          reference: reference.trim()
        };
      }`
);

code = code.replace(
  `        wppMessage += \`*📍 Endereço:*\\n\${street.trim()}, \${addressNumber.trim()} - \${neighborhood}\\n\\n\`;`,
  `        wppMessage += \`*📍 Endereço:*\\n\${street.trim()}, \${addressNumber.trim()} - \${neighborhood}\${reference ? '\\n*Referência:* ' + reference.trim() : ''}\\n\\n\`;`
);

fs.writeFileSync('src/components/CheckoutModal.tsx', code);
