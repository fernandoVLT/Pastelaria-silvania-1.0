import { db } from './src/lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

const newProducts = [
  { id: 'b_suco_valle', name: 'Suco Lata Dell Vale', description: 'Sabores: Uva, pêssego e manga', price: 6.50, category: 'Bebidas' },
  { id: 'b_suco_tial', name: 'Suco Tial 1 Litro', description: 'Sabores: Pêssego e uva', price: 10.00, category: 'Bebidas' },
  { id: 'b_refri_lata', name: 'Refrigerante Lata', description: 'Coca, coca zero, guaraná, Sprite, fanta uva, fanta laranja', price: 7.00, category: 'Bebidas' },
  { id: 'b_refri_600', name: 'Refrigerante 600ml', description: 'Coca, coca zero, guaraná, Sprite, fanta uva, fanta laranja', price: 8.50, category: 'Bebidas' },
  { id: 'b_agua_gas', name: 'Água com gás', description: 'Garrafinha', price: 4.50, category: 'Bebidas' },
  { id: 'b_coca_2l', name: 'Coca Cola 2 Litros', description: 'Refrigerante 2 Litros', price: 16.00, category: 'Bebidas' },
  { id: 'b_coca_zero_2l', name: 'Coca Cola Zero 2 Litros', description: 'Refrigerante 2 Litros', price: 16.00, category: 'Bebidas' },
  { id: 'b_sprite_2l', name: 'Sprite 2 Litros', description: 'Refrigerante 2 Litros', price: 14.00, category: 'Bebidas' },
  { id: 'b_guarana_2l', name: 'Guaraná 2 Litros', description: 'Refrigerante 2 Litros', price: 14.00, category: 'Bebidas' },
  { id: 'b_sukita_uva_2l', name: 'Sukita Uva 2 Litros', description: 'Refrigerante 2 Litros', price: 12.00, category: 'Bebidas' }
];

async function run() {
  console.log('Adding products...');
  for (const p of newProducts) {
    await setDoc(doc(collection(db, 'products'), p.id), p);
  }
  console.log('Done!');
  process.exit(0);
}

run();
