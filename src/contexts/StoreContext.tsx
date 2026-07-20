import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Category, Review, BusinessHours, DaySchedule, TimeSlot } from '../types';
import { products as initialProducts } from '../data/products';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, writeBatch, increment, arrayUnion, addDoc, getDoc, runTransaction } from 'firebase/firestore';
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
  businessHours?: BusinessHours;
  openTime?: string;
  closeTime?: string;
  pixKey?: string;
  pixReceiverName?: string;
  pixReceiverCity?: string;
  deliveryFee?: number;
  bbPixConfig?: {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
    developerAppKey: string;
    isProduction: boolean;
  };
  deliveryTimeType?: 'fixed' | 'range';
  fixedDeliveryTime?: number;
  minDeliveryTime?: number;
  maxDeliveryTime?: number;
  minPickupTime?: number;
  maxPickupTime?: number;
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
  enabledPaymentMethodsDelivery?: string[];
  enabledPaymentMethodsPickup?: string[];
  minOrderValue?: number;
  orderSuccessMessage?: string;
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
    usbPrinter?: {
      vendorId: number;
      productId: number;
      name?: string;
    };
  };
  productDisplayOrder?: 'alphabetical' | 'additionDate';
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
  updateOrderStatus: (orderId: string, status: import('../types').OrderStatus) => Promise<void>;
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
  isOpen: false,
  autoOpenClose: true,
  businessHours: {
    0: { isOpen: true, slots: [{ open: '18:00', close: '22:00' }] }, // Domingo
    1: { isOpen: false, slots: [] }, // Segunda
    2: { isOpen: true, slots: [{ open: '18:00', close: '22:00' }] }, // Terça
    3: { isOpen: true, slots: [{ open: '18:00', close: '22:00' }] }, // Quarta
    4: { isOpen: true, slots: [{ open: '18:00', close: '22:00' }] }, // Quinta
    5: { isOpen: true, slots: [{ open: '18:00', close: '22:00' }] }, // Sexta
    6: { isOpen: true, slots: [{ open: '18:00', close: '22:00' }] }, // Sábado
  },
  deliveryFee: 3.00,
  bbPixConfig: {
    enabled: false,
    clientId: '',
    clientSecret: '',
    developerAppKey: '',
    isProduction: false,
  },
  deliveryTimeType: 'range',
  fixedDeliveryTime: 40,
  minDeliveryTime: 30,
  maxDeliveryTime: 50,
  minPickupTime: 15,
  maxPickupTime: 30,
  minOrderValue: 20,
  orderSuccessMessage: 'Seu pedido foi registrado! Caso o WhatsApp não tenha aberto automaticamente, clique no botão abaixo.',
  notifyOnCartStart: false,
  enabledPaymentMethods: ['Pix', 'Pix Manual', 'Cartão de Crédito', 'Cartão de Débito', 'Vale Alimentação', 'Dinheiro'],
  enabledPaymentMethodsDelivery: ['Pix', 'Pix Manual', 'Cartão de Crédito', 'Cartão de Débito', 'Vale Alimentação', 'Dinheiro'],
  enabledPaymentMethodsPickup: ['Pix', 'Pix Manual', 'Cartão de Crédito', 'Cartão de Débito', 'Vale Alimentação', 'Dinheiro'],
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProductsState] = useState<Product[]>([]);
  const [config, setConfigState] = useState<StoreConfig>(DEFAULT_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);
  const [computedIsOpen, setComputedIsOpen] = useState(true);

  useEffect(() => {
    const checkSchedule = () => {
      if (!config.autoOpenClose) {
        setComputedIsOpen(config.isOpen);
        return;
      }

      if (config.businessHours) {
        const now = new Date();
        const day = now.getDay();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        const todaySchedule = config.businessHours[day];
        if (!todaySchedule || !todaySchedule.isOpen || !todaySchedule.slots || todaySchedule.slots.length === 0) {
          setComputedIsOpen(false);
          return;
        }

        const isOpenNow = todaySchedule.slots.some(slot => {
          if (slot.open <= slot.close) {
            return currentTime >= slot.open && currentTime <= slot.close;
          } else {
            // Crosses midnight
            return currentTime >= slot.open || currentTime <= slot.close;
          }
        });

        setComputedIsOpen(isOpenNow);
      } else {
        // Fallback to legacy config
        let currentIsOpen = config.isOpen;
        if (config.openTime && config.closeTime) {
          const now = new Date();
          const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          if (config.openTime <= config.closeTime) {
            currentIsOpen = currentTime >= config.openTime && currentTime <= config.closeTime;
          } else {
            currentIsOpen = currentTime >= config.openTime || currentTime <= config.closeTime;
          }
        }
        setComputedIsOpen(currentIsOpen);
      }
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
    const original = products;
    try {
      setProductsState(products.map(p => p.id === updated.id ? updated : p));
      await setDoc(doc(db, 'products', updated.id), updated);
    } catch (e) {
      setProductsState(original);
      handleFirestoreError(e, OperationType.UPDATE, `products/${updated.id}`);
      throw e;
    }
  };

  const addProduct = async (product: Product) => {
    const original = products;
    try {
      setProductsState([...products, product]);
      await setDoc(doc(db, 'products', product.id), product);
    } catch (e) {
      setProductsState(original);
      handleFirestoreError(e, OperationType.CREATE, `products/${product.id}`);
      throw e;
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
      let orderId = '';
      try {
        const counterRef = doc(db, 'counters', 'orders');
        await runTransaction(db, async (transaction) => {
          const counterDoc = await transaction.get(counterRef);
          let newIdNum = 1;
          if (counterDoc.exists()) {
            newIdNum = (counterDoc.data().lastId || 0) + 1;
          }
          transaction.set(counterRef, { lastId: newIdNum });
          orderId = newIdNum.toString();
        });
      } catch (err) {
        console.error("Counter transaction failed, falling back to random ID", err);
        orderId = Math.floor(100000 + Math.random() * 900000).toString(); // Fallback
      }

      const docRef = doc(db, 'orders', orderId);
      const newOrder = { ...orderData, id: orderId };
      await setDoc(docRef, newOrder);
      
      try {
        const savedOrders = localStorage.getItem('customer_orders');
        const currentOrders = savedOrders ? JSON.parse(savedOrders) : [];
        currentOrders.unshift(newOrder); // Add to beginning
        localStorage.setItem('customer_orders', JSON.stringify(currentOrders.slice(0, 20))); // Keep last 20
      } catch (err) {
        console.error('Failed to save order to local storage', err);
      }
      
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'orders');
      return '';
    }
  };

  const updateOrderStatus = async (orderId: string, status: import('../types').OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
    } catch (e) {
      console.error("Error updating order status", e);
    }
  };

  return (
    <StoreContext.Provider value={{ products: isLoaded ? products : [], setProducts, config, computedIsOpen, setConfig, updateProduct, addProduct, deleteProduct, notifyAdminCartStarted, favorites, toggleFavorite, addReview, recordSale, createOrder, updateOrderStatus }}>
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
