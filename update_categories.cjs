const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `  const displayCategories = useMemo(() => {
    const cats = [...config.categories];
    const catSet = new Set(cats);
    products.forEach(p => {
      if (p.isAvailable !== false && p.category && !catSet.has(p.category)) {
        catSet.add(p.category);
        cats.push(p.category);
      }
    });
    return cats;
  }, [config.categories, products]);`;

const replacement = `  const displayCategories = useMemo(() => {
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

code = code.replace(target, replacement);

const target2 = `      if (showFavorites) {
        return favorites.includes(p.id);
      }
      return p.category === activeCategory;
    });`;

const replacement2 = `      if (showFavorites) {
        return favorites.includes(p.id);
      }
      if (activeCategory === 'Outras Categorias') {
        const catSet = new Set(config.categories);
        return !p.category || !catSet.has(p.category);
      }
      return p.category === activeCategory;
    });`;

code = code.replace(target2, replacement2);
fs.writeFileSync('src/App.tsx', code);
