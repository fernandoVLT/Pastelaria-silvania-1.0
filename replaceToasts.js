const fs = require('fs');

const files = [
  'src/hooks/useOrders.ts',
  'src/components/ImageUploadInput.tsx',
  'src/components/AdminOrders.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace imports
  content = content.replace(/import\s+toast.*from\s+['"]react-hot-toast['"];?/g, "import { notify } from '../components/NotificationOverlay';");
  content = content.replace(/import\s+\{\s*toast\s*\}\s+from\s+['"]react-hot-toast['"];?/g, "import { notify } from '../components/NotificationOverlay';");
  
  // Clean up relative path if necessary (e.g. from hooks, it should be '../components/NotificationOverlay')
  if (file.includes('AdminOrders') || file.includes('ImageUpload')) {
     content = content.replace(/import \{ notify \} from '\.\.\/components\/NotificationOverlay';/, "import { notify } from './NotificationOverlay';");
  }
  
  // Replace usages
  content = content.replace(/toast\.success/g, 'notify.success');
  content = content.replace(/toast\.error/g, 'notify.error');
  
  fs.writeFileSync(file, content);
});

console.log('Done');
