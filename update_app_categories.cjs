const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const target1 = `  const displayCategories = useMemo(() => {
    const cats = [...config.categories];
    const catSet = new Set(cats);
    let hasOther = false;
    products.forEach(p => {
      if (p.isAvailable !== false) {
        if (!p.category || !catSet.has(p.category)) {
          hasOther = true;
        }
      }
    });
    if (hasOther && !catSet.has('Outras Categorias')) {
      cats.push('Outras Categorias');
    }
    return cats;
  }, [config.categories, products]);`;

const replacement1 = `  const displayCategories = useMemo(() => {
    const cats = [...config.categories];
    const catSet = new Set(cats);
    let hasEmpty = false;
    products.forEach(p => {
      if (p.isAvailable !== false) {
        if (p.category && !catSet.has(p.category)) {
          catSet.add(p.category);
          cats.push(p.category);
        } else if (!p.category) {
          hasEmpty = true;
        }
      }
    });
    if (hasEmpty && !catSet.has('Sem Categoria')) {
      cats.push('Sem Categoria');
    }
    return cats;
  }, [config.categories, products]);`;

code = code.replace(target1, replacement1);

const target2 = `      if (activeCategory === 'Outras Categorias') {
        const catSet = new Set(config.categories);
        return !p.category || !catSet.has(p.category);
      }`;

const replacement2 = `      if (activeCategory === 'Sem Categoria') {
        return !p.category;
      }`;

code = code.replace(target2, replacement2);
fs.writeFileSync('src/App.tsx', code);
