const fs = require('fs');

let card = fs.readFileSync('src/components/ProductCard.tsx', 'utf-8');
card = card.replace(
  'className="w-full h-full object-contain bg-white rounded-xl border border-gray-100 transition-all group-hover:scale-[1.02]"',
  'className="w-full h-full object-cover rounded-xl border border-gray-100 transition-all group-hover:scale-[1.02]"'
);
card = card.replace(
  'className="w-24 h-24 sm:w-full sm:h-40 shrink-0 relative z-10"',
  'className="w-24 h-24 sm:w-full sm:h-40 shrink-0 relative z-10 overflow-hidden rounded-xl"'
);
fs.writeFileSync('src/components/ProductCard.tsx', card);

let modal = fs.readFileSync('src/components/ProductModal.tsx', 'utf-8');
modal = modal.replace(
  'className="w-full h-48 object-contain bg-white rounded-xl mb-6 border border-gray-100 shadow-sm"',
  'className="w-full h-48 object-cover rounded-xl mb-6 border border-gray-100 shadow-sm overflow-hidden"'
);
fs.writeFileSync('src/components/ProductModal.tsx', modal);

let admin = fs.readFileSync('src/components/AdminModal.tsx', 'utf-8');
admin = admin.replace(
  'className="mt-2 h-32 rounded-xl object-contain bg-white border border-gray-200"',
  'className="mt-2 h-32 rounded-xl object-cover border border-gray-200 overflow-hidden"'
);
fs.writeFileSync('src/components/AdminModal.tsx', admin);

