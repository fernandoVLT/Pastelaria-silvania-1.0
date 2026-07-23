const fs = require('fs');
let code = fs.readFileSync('src/components/AdminOrders.tsx', 'utf-8');

const target1 = `        const popup = window.open(\`https://web.whatsapp.com/send?phone=\${phoneStr}&text=\${text}\`, 'whatsapp_popup', 'width=800,height=600');
        if (!popup) {
           // Fallback to regular WA web
           window.open(\`https://api.whatsapp.com/send?phone=\${phoneStr}&text=\${text}\`, '_blank', 'noopener,noreferrer');
        }`;
const replacement1 = `        window.open(\`https://wa.me/\${phoneStr}?text=\${text}\`, '_blank', 'noopener,noreferrer');`;
code = code.replace(target1, replacement1);

const target2 = `                        const popup = window.open(\`https://web.whatsapp.com/send?phone=\${phoneStr}&text=\${text}\`, 'whatsapp_popup', 'width=800,height=600');
                        if (!popup) {
                           window.open(\`https://api.whatsapp.com/send?phone=\${phoneStr}&text=\${text}\`, '_blank', 'noopener,noreferrer');
                        }`;
const replacement2 = `                        window.open(\`https://wa.me/\${phoneStr}?text=\${text}\`, '_blank', 'noopener,noreferrer');`;
code = code.replace(target2, replacement2);

fs.writeFileSync('src/components/AdminOrders.tsx', code);
