const fs = require('fs');
let code = fs.readFileSync('src/components/AdminCategories.tsx', 'utf-8');

const target = `  const handleDeleteCategory = (category: string) => {
    const productsInCat = products.filter(p => p.category === category);
    if (productsInCat.length > 0) {
      if (!confirm(\`Existem \${productsInCat.length} produtos nesta categoria. Eles ficarão sem categoria (ou na categoria "Outras Categorias"). Deseja realmente excluir?\`)) {
        return;
      }
    } else {
      if (!confirm('Excluir esta categoria?')) return;
    }

    setConfig({
      ...config,
      categories: config.categories.filter(c => c !== category)
    });
    // Also remove this category from any products
    const productsInCat2 = products.filter(p => p.category === category);
    for (const p of productsInCat2) {
      updateProduct({ ...p, category: '' });
    }
    notify.success('Categoria excluída!');
  };`;

const replacement = `  const handleDeleteCategory = async (category: string) => {
    const productsInCat = products.filter(p => p.category === category);
    if (productsInCat.length > 0) {
      if (!confirm(\`Existem \${productsInCat.length} produtos nesta categoria. Eles ficarão sem categoria. Deseja realmente excluir?\`)) {
        return;
      }
    } else {
      if (!confirm('Excluir esta categoria?')) return;
    }

    try {
      await setConfig({
        ...config,
        categories: config.categories.filter(c => c !== category)
      });
      
      // Also remove this category from any products
      for (const p of productsInCat) {
        await updateProduct({ ...p, category: '' });
      }
      notify.success('Categoria excluída!');
    } catch (e) {
      console.error(e);
      notify.error('Erro ao excluir categoria');
    }
  };`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/AdminCategories.tsx', code);
