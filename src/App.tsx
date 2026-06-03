import { useState, useEffect } from 'react';
import { Banner } from './components/Banner';
import { CartSidebar } from './components/CartSidebar';
import { CheckoutModal } from './components/CheckoutModal';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { AdminModal } from './components/AdminModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { Footer } from './components/Footer';
import { HeroSplash } from './components/HeroSplash';
import { CustomerOrdersModal } from './components/CustomerOrdersModal';
import { useStore } from './contexts/StoreContext';
import { CartItem, Category, Product } from './types';
import { cn } from './utils/cn';
import { MessageSquare } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export default function App() {
  const { products, config, computedIsOpen, favorites, notifyAdminCartStarted } = useStore();
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

  useEffect(() => {
    if (config.categories.length > 0 && !activeCategory) {
      setActiveCategory(config.categories[0]);
    }
  }, [config.categories, activeCategory]);

  const handleAddToCart = (item: Omit<CartItem, 'id'>) => {
    if (!computedIsOpen) {
      alert("A loja está fechada no momento. Os pedidos estão suspensos.");
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

  const handleRemoveFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const total = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const filterBySearch = (p: Product) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q));
  };

  const activeProducts = products.filter(p => {
    if (!filterBySearch(p)) return false;
    if (showFavorites) {
      return favorites.includes(p.id);
    }
    return p.category === activeCategory;
  });

  const bestSellers = [...products]
    .sort((a, b) => {
      // Prioritize manual override
      if (a.isBestSeller && !b.isBestSeller) return -1;
      if (!a.isBestSeller && b.isBestSeller) return 1;
      return (b.salesCount || 0) - (a.salesCount || 0);
    })
    .slice(0, 4);

  const handleAdminLogin = () => {
    if (config.adminPassword) {
      setIsAdminLoginOpen(true);
    } else {
      setIsAdminOpen(true);
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pb-8 flex flex-col bg-gray-50 font-sans">
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#333', color: '#fff', fontSize: '14px', fontWeight: 'bold' } }} />
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
        <div className="flex-1">
          {/* Best Sellers Section */}
          {!showFavorites && !searchQuery && bestSellers.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-8 text-gray-900 flex items-center gap-4">
                <span className="text-brand-red text-3xl">★</span>
                Mais Vendidos
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {bestSellers.map(product => (
                  <div key={product.id} className="flex flex-col h-full">
                    <ProductCard 
                      product={product} 
                      onClick={setSelectedProduct}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {!showFavorites && !searchQuery && (
            <div className="flex overflow-x-auto gap-4 pb-6 mb-8 scrollbar-hide" id="cardapio">
              {config.categories.map(category => (
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
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-8 text-gray-900 flex items-center gap-4">
              <span className="w-8 h-px bg-gray-300 hidden sm:block"></span>
              {searchQuery ? 'Resultados da busca' : showFavorites ? 'Meus Favoritos' : activeCategory}
            </h2>
            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {activeProducts.map(product => (
                <div key={product.id} className="flex flex-col h-full">
                  <ProductCard 
                    product={product} 
                    onClick={setSelectedProduct}
                  />
                </div>
              ))}
              {activeProducts.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500 font-medium col-[1/-1]">
                  {showFavorites ? 'Você ainda não salvou nenhum produto como favorito.' : 'Nenhum produto encontrado.'}
                </div>
              )}
            </div>
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
        <CustomerOrdersModal onClose={() => setShowCustomerOrders(false)} />
      )}

      {isAdminOpen && (
        <AdminModal onClose={() => setIsAdminOpen(false)} />
      )}

      {isAdminLoginOpen && (
        <AdminLoginModal
          onClose={() => setIsAdminLoginOpen(false)}
          onSuccess={() => {
            setIsAdminLoginOpen(false);
            setIsAdminOpen(true);
          }}
        />
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
