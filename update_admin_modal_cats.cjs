const fs = require('fs');
let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf-8');

const target1 = `              {config.categories.map(category => {
                const categoryProducts = products.filter(p => p.category === category && (!productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.description && p.description.toLowerCase().includes(productSearch.toLowerCase()))));
                if (categoryProducts.length === 0) return null;`;

const replacement1 = `              {Array.from(new Set([...config.categories, ...products.map(p => p.category).filter(c => c)])).map(category => {
                const categoryProducts = products.filter(p => p.category === category && (!productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.description && p.description.toLowerCase().includes(productSearch.toLowerCase()))));
                if (categoryProducts.length === 0) return null;`;

code = code.replace(target1, replacement1);

const target2 = `              {products.filter(p => !config.categories.includes(p.category) && (!productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.description && p.description.toLowerCase().includes(productSearch.toLowerCase())))).length > 0 && (
                 <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                 <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                   <h3 className="font-bold text-gray-700 text-xs uppercase tracking-widest">Outras Categorias</h3>
                   <span className="text-[10px] text-gray-400 font-bold bg-white px-2 py-1 rounded border border-gray-200">
                     {products.filter(p => !config.categories.includes(p.category) && (!productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.description && p.description.toLowerCase().includes(productSearch.toLowerCase())))).length} itens
                   </span>`;

const replacement2 = `              {products.filter(p => !p.category && (!productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.description && p.description.toLowerCase().includes(productSearch.toLowerCase())))).length > 0 && (
                 <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                 <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                   <h3 className="font-bold text-gray-700 text-xs uppercase tracking-widest">Sem Categoria</h3>
                   <span className="text-[10px] text-gray-400 font-bold bg-white px-2 py-1 rounded border border-gray-200">
                     {products.filter(p => !p.category && (!productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.description && p.description.toLowerCase().includes(productSearch.toLowerCase())))).length} itens
                   </span>`;

code = code.replace(target2, replacement2);

const target3 = `                      <tbody>
                        {products.filter(p => !config.categories.includes(p.category) && (!productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.description && p.description.toLowerCase().includes(productSearch.toLowerCase())))).map(p => (
                          <tr key={p.id} className="border-b last:border-b-0 border-gray-50 hover:bg-gray-50 transition-colors">`;

const replacement3 = `                      <tbody>
                        {products.filter(p => !p.category && (!productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.description && p.description.toLowerCase().includes(productSearch.toLowerCase())))).map(p => (
                          <tr key={p.id} className="border-b last:border-b-0 border-gray-50 hover:bg-gray-50 transition-colors">`;

code = code.replace(target3, replacement3);
fs.writeFileSync('src/components/AdminModal.tsx', code);
