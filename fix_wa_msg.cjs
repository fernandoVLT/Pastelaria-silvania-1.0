const fs = require('fs');
let code = fs.readFileSync('src/components/AdminOrders.tsx', 'utf-8');

const targetStr = `    // Build items summary
    let itemsTxt = '\\n\\n*Resumo do Pedido:*\\n';
    order.items.forEach(item => {
      itemsTxt += \\\`• \\\${item.quantity}x \\\${item.productName}\\\\n\\\`;
    });
    
    if (order.orderType === 'Delivery' && order.address) {
      itemsTxt += \\\`\\\\n*Endereço:* \\\${order.address.street}, \\\${order.address.number} - \\\${order.address.neighborhood}\\\`;
    }`;

const replacementStr = `    // Build items summary (only for 'Feito' status)
    let itemsTxt = '';
    if (st === 'Feito') {
      itemsTxt = '\\n\\n*Resumo do Pedido:*\\n';
      order.items.forEach(item => {
        let tamanho = '';
        if (item.category) {
          const lower = item.category.toLowerCase();
          if (lower.includes('pequeno')) tamanho = ' (PEQUENO)';
          if (lower.includes('grande')) tamanho = ' (GRANDE)';
          if (lower.includes('médio') || lower.includes('medio')) tamanho = ' (MÉDIO)';
        }
        itemsTxt += \`• \${item.quantity}x \${item.productName}\${tamanho}\\n\`;
      });
      
      if (order.orderType === 'Delivery' && order.address) {
        itemsTxt += \`\\n*Endereço:* \${order.address.street}, \${order.address.number} - \${order.address.neighborhood}\`;
      }
    }`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/components/AdminOrders.tsx', code);
