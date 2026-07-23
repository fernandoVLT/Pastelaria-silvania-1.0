const fs = require('fs');
let code = fs.readFileSync('src/components/Banner.tsx', 'utf-8');

code = code.replace('leading-[0.85]', 'leading-[1.1] sm:leading-[0.85]');
fs.writeFileSync('src/components/Banner.tsx', code);
