const fs = require('fs');
let code = fs.readFileSync('src/components/CheckoutModal.tsx', 'utf-8');

code = code.replace(
  "import { generatePixCode } from '../utils/pix';",
  "import { generatePixCode } from '../utils/pix';\nimport { ImageUploadInput } from './ImageUploadInput';"
);

code = code.replace(
  "  const [isCreating, setIsCreating] = useState(false);",
  "  const [isCreating, setIsCreating] = useState(false);\n  const [pixReceiptUrl, setPixReceiptUrl] = useState<string>('');"
);

fs.writeFileSync('src/components/CheckoutModal.tsx', code);
