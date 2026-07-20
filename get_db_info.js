import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  projectId: "ai-studio-a852d329-bb6f-4024-b922-556dc602f933",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const configDoc = await getDoc(doc(db, "config", "main"));
  console.log("Config categories:", configDoc.data()?.categories);
  
  const productsSnap = await getDocs(collection(db, "products"));
  const products = productsSnap.docs.map(d => ({id: d.id, name: d.data().name, category: d.data().category, isAvailable: d.data().isAvailable}));
  console.log("Products count:", products.length);
  const drinks = products.filter(p => p.category?.toLowerCase().includes('bebida') || p.name.toLowerCase().includes('coca') || p.category === 'Bebida');
  console.log("Drink-like products:", drinks);
  
  const allCategories = new Set(products.map(p => p.category));
  console.log("All unique product categories:", Array.from(allCategories));
}
run();
