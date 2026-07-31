const fs = require('fs');
let code = fs.readFileSync('src/contexts/StoreContext.tsx', 'utf-8');

if (!code.includes('pixBank?: string;')) {
  code = code.replace(
    '  pixReceiverCity?: string;',
    '  pixReceiverCity?: string;\n  pixBank?: string;'
  );
  fs.writeFileSync('src/contexts/StoreContext.tsx', code);
}
