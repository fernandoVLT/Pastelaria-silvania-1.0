const fs = require('fs');
let code = fs.readFileSync('src/components/AdminOrders.tsx', 'utf-8');

const regex = /\/\/ Fallback to normal Web Whatsapp if API is not enabled[\s\S]*?\}\n    \}/;
const replacement = `// Fallback to normal Web Whatsapp if API is not enabled
      // Constantly opening new tabs is annoying, so we will skip it unless they use the silent API
      // They can still click the WPP button manually on the order card
    }`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/AdminOrders.tsx', code);
