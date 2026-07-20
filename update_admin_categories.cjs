const fs = require('fs');
let code = fs.readFileSync('src/components/AdminCategories.tsx', 'utf-8');

const target = `        <div className="space-y-2">
          {config.categories.map(category => (`;

const replacement = `        <div className="space-y-2">
          {Array.from(new Set([...config.categories, ...products.map(p => p.category).filter(c => c)])).map(category => (`;

code = code.replace(target, replacement);

const targetDelete = `    setConfig({
      ...config,
      categories: config.categories.filter(c => c !== category)
    });`;

const replacementDelete = `    setConfig({
      ...config,
      categories: config.categories.filter(c => c !== category)
    });
    // Also remove this category from any products
    const productsInCat2 = products.filter(p => p.category === category);
    for (const p of productsInCat2) {
      updateProduct({ ...p, category: '' });
    }`;

code = code.replace(targetDelete, replacementDelete);

fs.writeFileSync('src/components/AdminCategories.tsx', code);
