const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fix() {
  // 1. Add "Bebidas" to config if not present
  const configRef = db.collection('config').doc('main');
  const configDoc = await configRef.get();
  let categories = [];
  if (configDoc.exists) {
    categories = configDoc.data().categories || [];
    if (!categories.includes('Bebidas')) {
      categories.push('Bebidas');
      await configRef.update({ categories });
      console.log('Added Bebidas to config');
    }
  }

  // 2. Set category to "Bebidas" for all products with no category
  const productsSnapshot = await db.collection('products').get();
  for (const doc of productsSnapshot.docs) {
    const data = doc.data();
    if (!data.category || data.category === 'Outras Categorias' || data.category === 'Sem Categoria') {
      await doc.ref.update({ category: 'Bebidas' });
      console.log(`Updated product ${doc.id} to Bebidas`);
    }
  }
}

fix().then(() => {
  console.log('Done');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
