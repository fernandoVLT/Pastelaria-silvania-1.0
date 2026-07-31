const fs = require('fs');
let code = fs.readFileSync('src/components/CheckoutModal.tsx', 'utf-8');

code = code.replace(/'5531996698807'/g, "config.pixKey || ''");
code = code.replace(/'SILVANIA BARRETO DE ALMEIDA'/g, "config.pixReceiverName || ''");
code = code.replace(/'BELO HORIZONTE'/g, "config.pixReceiverCity || ''");

fs.writeFileSync('src/components/CheckoutModal.tsx', code);
