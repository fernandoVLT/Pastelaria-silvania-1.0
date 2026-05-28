import fs from 'fs';

let content = fs.readFileSync('src/components/AdminOrders.tsx', 'utf-8');
content = content.replace(/\\`/g, '`').replace(/\\\$/g, '$');
fs.writeFileSync('src/components/AdminOrders.tsx', content);
