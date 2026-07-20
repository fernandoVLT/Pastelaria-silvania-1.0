import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Banner } from './components/Banner';
import { CartSidebar } from './components/CartSidebar';
import { CheckoutModal } from './components/CheckoutModal';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { Footer } from './components/Footer';
import { HeroSplash } from './components/HeroSplash';
import { CustomerOrdersModal } from './components/CustomerOrdersModal';
import { useStore } from './contexts/StoreContext';
import { CartItem, Category, Product } from './types';
import { cn } from './utils/cn';
import { MessageSquare, ArrowUpDown } from 'lucide-react';
import { NotificationContainer, notify } from './components/NotificationOverlay';
import { motion, AnimatePresence } from 'motion/react';

const AdminModal = lazy(() => import('./components/AdminModal').then(m => ({ default: m.AdminModal })));
const AdminLoginModal = lazy(() => import('./components/AdminLoginModal').then(m => ({ default: m.AdminLoginModal })));

export default function App() {
  const { products, config, computedIsOpen, favorites, toggleFavorite, notifyAdminCartStarted } = useStore();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [showCustomerOrders, setShowCustomerOrders] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);
  const [sortOrder, setSortOrder] = useState<'none' | 'asc' | 'desc'>('none');
  const [visibleCount, setVisibleCount] = useState(12);

  const displayCategories = useMemo(() => {
    const cats = [...config.categories];
    const catSet = new Set(cats);
    products.forEach(p => {
      if (p.isAvailable !== false && p.category && !catSet.has(p.category)) {
        catSet.add(p.category);
        cats.push(p.category);
      }
    });
    return cats;
  }, [config.categories, products]);

  useEffect(() => {
    if (displayCategories.length > 0 && (!activeCategory || !displayCategories.includes(activeCategory))) {
      setActiveCategory(displayCategories[0]);
    }
  }, [displayCategories, activeCategory]);

  useEffect(() => {
    setVisibleCount(12);
  }, [activeCategory, searchQuery, showFavorites]);

  const handleAddToCart = (item: Omit<CartItem, 'id'>) => {
    if (!computedIsOpen) {
      notify.error("A loja está fechada no momento. Os pedidos estão suspensos.");
      return;
    }
    setCartItems(prev => {
      if (prev.length === 0) { 
         if (config.notifyOnCartStart) {
           notifyAdminCartStarted?.().catch(console.error);
         }
      }
      return [...prev, { ...item, id: crypto.randomUUID() }];
    });
    setSelectedProduct(null);
  };

  const handleUpdateProductQuantity = (product: Product, change: number) => {
    if (!computedIsOpen) {
      notify.error("A loja está fechada no momento. Os pedidos estão suspensos.");
      return;
    }
    setCartItems(prev => {
      if (change > 0) {
        if (product.stock !== undefined && product.stock <= 0) {
           notify.error("Produto esgotado.");
           return prev;
        }
        
        const basicItemIndex = prev.findIndex(item => item.product.id === product.id && !item.observation);
        if (basicItemIndex >= 0) {
          const newCart = [...prev];
          newCart[basicItemIndex].quantity += change;
          return newCart;
        } else {
           if (prev.length === 0 && config.notifyOnCartStart) {
             notifyAdminCartStarted?.().catch(console.error);
           }
           return [...prev, { id: crypto.randomUUID(), product, quantity: change }];
        }
      } else {
        const existingItems = prev.filter(item => item.product.id === product.id);
        if (existingItems.length === 0) return prev;
        
        const newCart = [...prev];
        let indexToDecrease = -1;
        for (let i = newCart.length - 1; i >= 0; i--) {
          if (newCart[i].product.id === product.id) {
            indexToDecrease = i;
            break;
          }
        }
        
        if (indexToDecrease >= 0) {
          if (newCart[indexToDecrease].quantity > 1) {
            newCart[indexToDecrease].quantity -= 1;
            return newCart;
          } else {
            newCart.splice(indexToDecrease, 1);
            return newCart;
          }
        }
        return prev;
      }
    });
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleReorder = (historicItems: any[]) => {
    if (!computedIsOpen) {
      notify.error("A loja está fechada no momento. Os pedidos estão suspensos.");
      return;
    }
    
    const newCartItems: CartItem[] = historicItems.map(item => {
      const product = products.find(p => p.name === item.productName) || {
        id: crypto.randomUUID(),
        name: item.productName,
        category: item.category,
        price: item.price,
        description: '',
        reviews: []
      } as Product;
      
      return {
        id: crypto.randomUUID(),
        product,
        quantity: item.quantity
      };
    });

    setCartItems(prev => {
      if (prev.length === 0 && config.notifyOnCartStart) {
         notifyAdminCartStarted?.().catch(console.error);
      }
      return [...prev, ...newCartItems];
    });
    
    setIsMobileCartOpen(true);
  };

  const total = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const sortedActiveProducts = useMemo(() => {
    const activeList = products.filter(p => {
      if (p.isAvailable === false) return false;
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch = p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }
      if (showFavorites) {
        return favorites.includes(p.id);
      }
      return p.category === activeCategory;
    });

    let list = [...activeList];
    
    // Sort by addition date or alphabetical order
    if (config.productDisplayOrder === 'alphabetical') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else {
      // Sort by creation date (older first). For products before this update, they might not have createdAt.
      list.sort((a, b) => {
         const timeA = a.createdAt || 0;
         const timeB = b.createdAt || 0;
         if (timeA !== timeB) return timeA - timeB;
         return (a.id || '').localeCompare(b.id || '', undefined, { numeric: true });
      });
    }

    if (sortOrder === 'asc') return list.sort((a, b) => a.price - b.price);
    if (sortOrder === 'desc') return list.sort((a, b) => b.price - a.price);
    return list;
  }, [products, searchQuery, showFavorites, favorites, activeCategory, sortOrder, config.productDisplayOrder]);

  const getQuantityInCart = (productId: string) => {
    return cartItems.filter(item => item.product.id === productId).reduce((sum, item) => sum + item.quantity, 0);
  };

  const bestSellers = useMemo(() => {
    return [...products]
      .filter(p => p.isAvailable !== false)
      .sort((a, b) => {
        if (a.isBestSeller && !b.isBestSeller) return -1;
        if (!a.isBestSeller && b.isBestSeller) return 1;
        return (b.salesCount || 0) - (a.salesCount || 0);
      })
      .slice(0, 4);
  }, [products]);

  const handleAdminLogin = () => {
    if (config.adminPassword) {
      setIsAdminLoginOpen(true);
    } else {
      setIsAdminOpen(true);
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pb-8 flex flex-col bg-gray-50 font-sans">
      <NotificationContainer />
      <HeroSplash />
      {!computedIsOpen && (
        <div className="bg-red-600 text-white text-center py-4 px-4 text-xs sm:text-sm font-black tracking-widest uppercase relative z-[60] shadow-md border-b border-red-700 flex items-center justify-center gap-2">
           <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
           A loja está fechada no momento. Os pedidos estão temporariamente suspensos.
        </div>
      )}
      <Header 
        cartItemCount={cartItems.length} 
        onOpenMobileCart={() => setIsMobileCartOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showFavorites={showFavorites}
        setShowFavorites={setShowFavorites}
        onOpenCustomerOrders={() => setShowCustomerOrders(true)}
      />
      <Banner />

      <main className="flex-1 max-w-7xl mx-auto px-4 w-full mt-12 flex flex-col md:flex-row gap-12">
        <div className="flex-1 overflow-visible">
          {/* Best Sellers Section */}
          {!showFavorites && !searchQuery && bestSellers.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-8 text-gray-900 flex items-center gap-4">
                <span className="text-brand-red text-3xl">★</span>
                Mais Vendidos
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {bestSellers.map((product, index) => (
                  <motion.div 
                    key={`bs-${product.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex flex-col h-full"
                  >
                    <ProductCard 
                      product={product} 
                      onClick={setSelectedProduct}
                      quantityInCart={getQuantityInCart(product.id)}
                      onIncrement={() => handleUpdateProductQuantity(product, 1)}
                      onDecrement={() => handleUpdateProductQuantity(product, -1)}
                      isFavorite={favorites.includes(product.id)}
                      onToggleFavorite={() => toggleFavorite(product.id)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {!showFavorites && !searchQuery && (
            <div className="flex overflow-x-auto gap-4 pb-6 mb-8 scrollbar-hide" id="cardapio">
              {displayCategories.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "whitespace-nowrap px-6 py-3 rounded-full text-xs font-bold tracking-widest transition-all whitespace-pre uppercase shadow-sm",
                    activeCategory === category 
                      ? "bg-brand-red text-white border-brand-red" 
                      : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-gray-900 flex items-center gap-4">
                <span className="w-8 h-px bg-gray-300 hidden sm:block"></span>
                {searchQuery ? 'Resultados da busca' : showFavorites ? 'Meus Favoritos' : activeCategory}
              </h2>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold hidden sm:inline-block">Ordenar:</span>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'none' | 'asc' | 'desc')}
                  className="bg-white border border-gray-200 text-gray-700 text-xs font-bold uppercase tracking-widest rounded-xl px-4 py-2 hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-red cursor-pointer shadow-sm disabled:opacity-50"
                  disabled={sortedActiveProducts.length === 0}
                >
                  <option value="none">Padrão</option>
                  <option value="asc">Menor Preço</option>
                  <option value="desc">Maior Preço</option>
                </select>
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 relative">
              <AnimatePresence>
                {sortedActiveProducts.slice(0, visibleCount).map((product, index) => (
                  <motion.div 
                    layout
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, delay: index * 0.05 }}
                    className="flex flex-col h-full"
                  >
                    <ProductCard 
                      product={product} 
                      onClick={setSelectedProduct}
                      quantityInCart={getQuantityInCart(product.id)}
                      onIncrement={() => handleUpdateProductQuantity(product, 1)}
                      onDecrement={() => handleUpdateProductQuantity(product, -1)}
                      isFavorite={favorites.includes(product.id)}
                      onToggleFavorite={() => toggleFavorite(product.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              {sortedActiveProducts.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500 font-medium col-[1/-1]">
                  {showFavorites ? 'Você ainda não salvou nenhum produto como favorito.' : 'Nenhum produto encontrado.'}
                </div>
              )}
            </div>
            
            {visibleCount < sortedActiveProducts.length && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setVisibleCount(v => v + 12)}
                  className="bg-white border text-xs tracking-widest uppercase font-bold text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-gray-200 py-3 px-8 rounded-full shadow-sm transition-all"
                >
                  Carregar Mais Itens
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Cart */}
        <div className="hidden md:block w-[360px] flex-shrink-0">
          <CartSidebar 
            items={cartItems} 
            onRemove={handleRemoveFromCart}
            onCheckout={() => setIsCheckoutOpen(true)}
          />
        </div>
      </main>

      {/* Mobile Sticky Cart Button */}
      {cartItems.length > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] z-40">
          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="w-full bg-brand-red hover:bg-brand-red-dark text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl h-14 transition-all flex items-center justify-between px-6 shadow-md"
          >
            <span className="bg-black/10 px-2.5 py-1 rounded text-[10px]">
              {cartItems.length} {cartItems.length === 1 ? 'ITEM' : 'ITENS'}
            </span>
            <span>Ver Sacola</span>
            <span className="font-mono">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</span>
          </button>
        </div>
      )}

      {/* Mobile Cart Modal */}
      {isMobileCartOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-gray-50 animate-in slide-in-from-bottom-full duration-200">
          <div className="bg-white p-4 border-b border-gray-100 flex items-center gap-3 shadow-sm">
            <button 
              onClick={() => setIsMobileCartOpen(false)}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <h2 className="font-black text-lg text-gray-900 flex-1 tracking-tight uppercase">Sacola</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
             <CartSidebar 
               items={cartItems} 
               onRemove={handleRemoveFromCart}
               onCheckout={() => {
                 setIsMobileCartOpen(false);
                 setIsCheckoutOpen(true);
               }}
             />
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedProduct && (
        <ProductModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onAdd={handleAddToCart}
        />
      )}

      {isCheckoutOpen && (
        <CheckoutModal 
          items={cartItems}
          total={total}
          onClose={() => setIsCheckoutOpen(false)}
          onFinish={() => setCartItems([])}
        />
      )}

      {showCustomerOrders && (
        <CustomerOrdersModal onClose={() => setShowCustomerOrders(false)} onReorder={handleReorder} />
      )}

      {isAdminOpen && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-white/20 border-t-white animate-spin"></div></div>}>
          <AdminModal onClose={() => setIsAdminOpen(false)} />
        </Suspense>
      )}

      {isAdminLoginOpen && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-white/20 border-t-white animate-spin"></div></div>}>
          <AdminLoginModal
            onClose={() => setIsAdminLoginOpen(false)}
            onSuccess={() => {
              setIsAdminLoginOpen(false);
              setIsAdminOpen(true);
            }}
          />
        </Suspense>
      )}

      {/* Floating WhatsApp Button */}
      <a 
        href={`https://wa.me/${(config.whatsappNumber || '').replace(/\D/g, '').startsWith('55') ? (config.whatsappNumber || '').replace(/\D/g, '') : '55' + (config.whatsappNumber || '').replace(/\D/g, '')}?text=${encodeURIComponent(config.whatsappMessages?.contact || 'Olá, gostaria de fazer um pedido / tirar uma dúvida!')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all z-40"
        title="Fale conosco no WhatsApp"
      >
        <MessageSquare className="w-6 h-6" />
      </a>

      <Footer onOpenAdmin={handleAdminLogin} />
    </div>
  );
}
