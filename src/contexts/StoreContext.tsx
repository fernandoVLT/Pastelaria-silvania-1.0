import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Category, Review } from '../types';
import { products as initialProducts } from '../data/products';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, writeBatch, increment, arrayUnion, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface StoreConfig {
  whatsappNumber: string;
  logoText: string;
  logoDescription: string;
  categories: Category[];
  location: string;
  openingHours: string;
  aboutText: string;
  logoUrl?: string;
  bannerUrl?: string;
  adminPassword?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  isOpen: boolean;
  autoOpenClose?: boolean;
  openTime?: string;
  closeTime?: string;
  pixKey?: string;
  pixReceiverName?: string;
  pixReceiverCity?: string;
  deliveryFee?: number;
  deliveryTimeType?: 'fixed' | 'range';
  fixedDeliveryTime?: number;
  minDeliveryTime?: number;
  maxDeliveryTime?: number;
  notifyOnCartStart?: boolean;
  whatsappMessages?: {
    newOrder?: string;
    orderDone?: string;
    orderDispatched?: string;
    orderDelivered?: string;
    contact?: string;
  };
  whatsappAutomations?: {
    orderDone?: boolean;
    orderPreparing?: boolean;
    orderReady?: boolean;
    orderDispatched?: boolean;
    orderDelivered?: boolean;
  };
  enabledPaymentMethods?: string[];
  whatsappApiConfig?: {
    enabled?: boolean;
    apiUrl?: string;
    instanceId?: string;
    token?: string;
  };
  printConfig?: {
    autoPrint: boolean;
    autoPrintDelivery?: boolean;
    autoPrintPickup?: boolean;
  };
  enabledPaymentMethods?: string[];
}

interface StoreContextType {
  products: Product[];
  setProducts: (products: Product[]) => void;
  config: StoreConfig;
  computedIsOpen: boolean;
  setConfig: (config: StoreConfig) => void;
  updateProduct: (product: Product) => void;
  addProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  notifyAdminCartStarted: () => Promise<void>;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  addReview: (productId: string, review: Review) => void;
  recordSale: (items: {productId: string, quantity: number}[]) => void;
  createOrder: (orderData: Omit<import('../types').Order, 'id'>) => Promise<string>;
}

const DEFAULT_CONFIG: StoreConfig = {
  whatsappNumber: '5531991456841',
  logoText: 'Pastelaria da Silvânia',
  logoDescription: 'A EXPERIÊNCIA E O SABOR INESQUECÍVEL DA NOSSA PASTELARIA.',
  categories: ['Pastéis Pequenos', 'Pastéis Grandes', 'Grandes de Calabresa', 'Bebidas'],
  location: 'Rua Principal, 123 - Centro, Cidade',
  openingHours: 'Terça a Domingo das 18:00 as 23:30',
  aboutText: 'A melhor pastelaria da região, com ingredientes selecionados e muito recheio.',
  adminPassword: 'admin',
  instagramUrl: '',
  facebookUrl: '',
  isOpen: true,
  deliveryFee: 3.00,
  deliveryTimeType: 'range',
  fixedDeliveryTime: 40,
  minDeliveryTime: 30,
  maxDeliveryTime: 50,
  notifyOnCartStart: false,
  enabledPaymentMethods: ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Vale Alimentação', 'Dinheiro'],
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProductsState] = useState<Product[]>([]);
  const [config, setConfigState] = useState<StoreConfig>(DEFAULT_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);
  const [computedIsOpen, setComputedIsOpen] = useState(true);

  useEffect(() => {
    const checkSchedule = () => {
      let currentIsOpen = config.isOpen;
      
      if (config.autoOpenClose && config.openTime && config.closeTime) {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        if (config.openTime <= config.closeTime) {
          currentIsOpen = currentTime >= config.openTime && currentTime <= config.closeTime;
        } else {
          // Crosses midnight
          currentIsOpen = currentTime >= config.openTime || currentTime <= config.closeTime;
        }
      }
      
      setComputedIsOpen(currentIsOpen);
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [config]);

  const [favorites, setFavoritesState] = useState<string[]>(() => {
    const saved = localStorage.getItem('pastelaria_favorites');
    if (saved) return JSON.parse(saved);
    return [];
  });

  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, 'config', 'main'), (snap) => {
      if (snap.exists()) {
        setConfigState({ ...DEFAULT_CONFIG, ...(snap.data() as StoreConfig) });
      } else {
        setDoc(doc(db, 'config', 'main'), DEFAULT_CONFIG).catch(e => handleFirestoreError(e, OperationType.WRITE, 'config/main'));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'config/main'));

    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      if (snap.empty && !isLoaded) {
        initProducts();
      } else {
        const prodList = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
        setProductsState(prodList);
        setIsLoaded(true);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));

    async function initProducts() {
      try {
        const batch = writeBatch(db);
        const saved = localStorage.getItem('pastelaria_products');
        let initialList = initialProducts as Product[];
        if (saved) {
           initialList = JSON.parse(saved);
        } else {
           initialList = [
             ...initialProducts,
             { id: 'b1', name: 'Coca-Cola (Lata)', description: '350ml', price: 6, category: 'Bebidas', reviews: [] },
             { id: 'b2', name: 'Guaraná Antarctica (Lata)', description: '350ml', price: 6, category: 'Bebidas', reviews: [] },
           ] as Product[];
        }
        
        for (const prod of initialList) {
          const docRef = doc(collection(db, 'products'), prod.id);
          batch.set(docRef, prod);
        }
        await batch.commit();
        setIsLoaded(true);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'products');
      }
    }

    return () => {
      unsubConfig();
      unsubProducts();
    };
  }, [isLoaded]);

  const setProducts = (newProducts: Product[]) => {
    // This is primarily maintained by onSnapshot now, but kept for compatibility.
    // If you need to deeply set all items, use a batch write, but we should rely on specific functions.
    // However, if the old codebase calls setProducts, we should only update state to avoid massive overwrites (we will handle writes through specific functions)
    setProductsState(newProducts);
  };

  const setFavorites = (newFavs: string[]) => {
    setFavoritesState(newFavs);
    localStorage.setItem('pastelaria_favorites', JSON.stringify(newFavs));
  }

  const toggleFavorite = (id: string) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(f => f !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const addReview = async (productId: string, review: Review) => {
    try {
      await updateDoc(doc(db, 'products', productId), {
        reviews: arrayUnion(review)
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `products/${productId}`);
    }
  };

  const setConfig = async (newConfig: StoreConfig) => {
    try {
      setConfigState(newConfig);
      await setDoc(doc(db, 'config', 'main'), newConfig);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'config/main');
    }
  };

  const updateProduct = async (updated: Product) => {
    try {
      setProductsState(products.map(p => p.id === updated.id ? updated : p));
      await setDoc(doc(db, 'products', updated.id), updated);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `products/${updated.id}`);
    }
  };

  const addProduct = async (product: Product) => {
    try {
      setProductsState([...products, product]);
      await setDoc(doc(db, 'products', product.id), product);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `products/${product.id}`);
    }
  };

  const notifyAdminCartStarted = async () => {
    try {
      await addDoc(collection(db, 'system_notifications'), {
        type: 'CART_STARTED',
        message: 'Um cliente está montando um pedido!',
        createdAt: Date.now(),
        read: false
      });
    } catch (e) {
      console.error("Error notifying admin", e);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `products/${id}`);
    }
  };

  const recordSale = async (items: {productId: string, quantity: number}[]) => {
    try {
      const batch = writeBatch(db);
      for (const item of items) {
        batch.update(doc(db, 'products', item.productId), {
          salesCount: increment(item.quantity)
        });
      }
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'products/batch_sale');
    }
  };

  const createOrder = async (orderData: Omit<import('../types').Order, 'id'>): Promise<string> => {
    try {
      const docRef = doc(collection(db, 'orders'));
      await setDoc(docRef, { ...orderData, id: docRef.id });
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'orders');
      return '';
    }
  };

  return (
    <StoreContext.Provider value={{ products: isLoaded ? products : [], setProducts, config, computedIsOpen, setConfig, updateProduct, addProduct, deleteProduct, notifyAdminCartStarted, favorites, toggleFavorite, addReview, recordSale, createOrder }}>
      {!isLoaded ? (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-brand-red font-bold animate-pulse text-sm tracking-widest uppercase">Carregando loja...</div>
        </div>
      ) : children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}
