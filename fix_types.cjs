const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf-8');

code = code.replace(
  `  address?: {
    neighborhood: string;
    street: string;
    number: string;
  };`,
  `  address?: {
    neighborhood: string;
    street: string;
    number: string;
    reference?: string;
  };`
);
fs.writeFileSync('src/types.ts', code);
