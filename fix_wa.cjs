const fs = require('fs');
let code = fs.readFileSync('src/components/AdminOrders.tsx', 'utf-8');

const targetWa = `                                            if (isMobile) {
                        window.location.href = \`whatsapp://send?phone=\${phoneStr}&text=\${text}\`;
                      } else {
                        const popup = window.open(\`https://web.whatsapp.com/send?phone=\${phoneStr}&text=\${text}\`, 'whatsapp_popup', 'width=800,height=600');
                        if (!popup) { 
                           window.open(\`https://api.whatsapp.com/send?phone=\${phoneStr}&text=\${text}\`, '_blank', 'noopener,noreferrer');
                        }
                      }`;
                      
const replacementWa = `                                            if (isMobile) {
                        window.location.href = \`whatsapp://send?phone=\${phoneStr}&text=\${text}\`;
                      } else {
                        window.open(\`https://wa.me/\${phoneStr}?text=\${text}\`, '_blank', 'noopener,noreferrer');
                      }`;
                      
code = code.replace(targetWa, replacementWa);
fs.writeFileSync('src/components/AdminOrders.tsx', code);
