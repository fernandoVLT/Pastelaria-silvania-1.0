const fs = require('fs');
let code = fs.readFileSync('src/components/AdminOrders.tsx', 'utf-8');

code = code.replace(
  `    const unprintedNewOrders = orders.filter(
      (o) => o.status === 'Feito' && !o.hasBeenPrinted && !printedOrdersRef.current.has(o.id!) && (nowMs - o.createdAt < oneHourMs)
    );`,
  `    const unprintedNewOrders = orders.filter(
      (o) => (o.status === 'Feito' || o.status === 'Em Preparo') && !o.hasBeenPrinted && !printedOrdersRef.current.has(o.id!) && (nowMs - o.createdAt < oneHourMs)
    );`
);

fs.writeFileSync('src/components/AdminOrders.tsx', code);
