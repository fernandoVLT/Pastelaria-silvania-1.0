const fs = require('fs');
let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf-8');

const targetLoop = `{config.categories.map(category => {
                const categoryProducts = products.filter(p => {
                  const matchesCategory = p.category === category;`;
                  
const replacementLoop = `{(Array.from(new Set([...config.categories, ...products.map(p => p.category || 'Sem Categoria')]))).map(category => {
                const categoryProducts = products.filter(p => {
                  const pCat = p.category || 'Sem Categoria';
                  const matchesCategory = pCat.trim().toLowerCase() === category.trim().toLowerCase();`;

code = code.replace(targetLoop, replacementLoop);
fs.writeFileSync('src/components/AdminModal.tsx', code);
