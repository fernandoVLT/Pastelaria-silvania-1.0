const fs = require('fs');
let code = fs.readFileSync('src/components/AdminOrders.tsx', 'utf-8');

code = code.replace(
  "  const [printType, setPrintType] = useState<'kitchen' | 'dispatch' | 'all'>('kitchen');",
  "  const [printType, setPrintType] = useState<'kitchen' | 'dispatch' | 'all'>('kitchen');\n  const [viewReceiptUrl, setViewReceiptUrl] = useState<string | null>(null);"
);

fs.writeFileSync('src/components/AdminOrders.tsx', code);
