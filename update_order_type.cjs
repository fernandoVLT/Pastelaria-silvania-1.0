const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf-8');

if (!code.includes('pixReceiptUrl?: string;')) {
  code = code.replace(
    '  cancellationReason?: string;',
    '  cancellationReason?: string;\n  pixReceiptUrl?: string;'
  );
  fs.writeFileSync('src/types.ts', code);
}
