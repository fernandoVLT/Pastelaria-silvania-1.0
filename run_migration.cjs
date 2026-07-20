const fs = require('fs');
let code = fs.readFileSync('src/contexts/StoreContext.tsx', 'utf-8');

const target = `    async function initProducts() {
      // Seed default products
      const defaultProducts: Product[] = [];
      const batch = writeBatch(db);
      defaultProducts.forEach(p => {
        batch.set(doc(db, 'products', p.id), p);
      });
      try {
        if (defaultProducts.length > 0) {
          await batch.commit();
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'products');
      }
    }

    return () => {
      unsubConfig();
      unsubProducts();
      unsubOrders();
    };
  }, []);`;

const replacement = `    async function initProducts() {
      // Seed default products
      const defaultProducts: Product[] = [];
      const batch = writeBatch(db);
      defaultProducts.forEach(p => {
        batch.set(doc(db, 'products', p.id), p);
      });
      try {
        if (defaultProducts.length > 0) {
          await batch.commit();
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'products');
      }
    }

    return () => {
      unsubConfig();
      unsubProducts();
      unsubOrders();
    };
  }, []);

  // One-time migration to fix "Outras Categorias" to "Bebidas"
  useEffect(() => {
    if (!isLoaded || products.length === 0) return;
    const runMigration = async () => {
      const needsCategoryFix = products.some(p => !p.category || p.category === 'Outras Categorias' || p.category === 'Sem Categoria');
      const needsConfigFix = !config.categories.includes('Bebidas') && needsCategoryFix;

      if (!needsCategoryFix && !needsConfigFix) return;

      try {
        const batch = writeBatch(db);
        let count = 0;
        
        if (needsCategoryFix) {
          for (const p of products) {
            if (!p.category || p.category === 'Outras Categorias' || p.category === 'Sem Categoria') {
              batch.update(doc(db, 'products', p.id), { category: 'Bebidas' });
              count++;
            }
          }
        }
        
        if (needsConfigFix) {
          batch.update(doc(db, 'config', 'main'), { 
            categories: [...config.categories.filter(c => c !== 'Outras Categorias' && c !== 'Sem Categoria'), 'Bebidas']
          });
          count++;
        }
        
        if (count > 0) {
          await batch.commit();
        }
      } catch (e) {
        console.error('Migration error:', e);
      }
    };
    runMigration();
  }, [isLoaded, products.length]);
`;

code = code.replace(target, replacement);
fs.writeFileSync('src/contexts/StoreContext.tsx', code);
