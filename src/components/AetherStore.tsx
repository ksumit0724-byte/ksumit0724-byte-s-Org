import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Zap, ChevronLeft, Star, Plus, Camera, Loader2, X } from 'lucide-react';
import { useAetherStore } from '../store/useAetherStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

const INITIAL_PRODUCTS = [
  { id: '7', name: 'Vinsguir Tactical Grip Gloves', price: '18.99', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800', category: 'Gear', description: 'Advanced tactical half-finger design with excellent grip.', rating: 4.8, reviews: 124 },
  { id: '1', name: 'Neural Protein Isolate', price: '45.00', image: 'https://images.unsplash.com/photo-1579722820308-d74e571900a9?auto=format&fit=crop&q=80&w=800', category: 'Nutrition', description: 'Fast-absorbing protein matrix combined with neural pathway enhancers.', rating: 4.9, reviews: 342 },
  { id: '2', name: 'Aether Smart-Strap', price: '120.00', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800', category: 'Hardware', description: 'Next-generation biometric tracking. Syncs directly with your Aether grid.', rating: 4.7, reviews: 89 },
];

export const AetherStore: React.FC = () => {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const { session, user } = useAetherStore();

  const userRole = session?.user?.user_metadata?.role || user?.role || 'pilot';
  const isOwner = userRole === 'owner';

  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'Apparel', description: '', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800' });

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price) return;
    const added = {
      ...newProduct,
      id: Date.now().toString(),
      rating: 5.0,
      reviews: 0
    };
    setProducts([added, ...products]);
    setIsAddMode(false);
    setNewProduct({ name: '', price: '', category: 'Apparel', description: '', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800' });
  };

  const product = products.find(p => p.id === selectedProduct);

  return (
    <>
      <AnimatePresence mode="wait">
        {!selectedProduct ? (
        <motion.div 
          key="list"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex-1 flex flex-col p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full h-full pb-32 overflow-y-auto custom-scrollbar"
        >
          <div className="flex items-center justify-between mb-8 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#deff9a]/10 border border-[#deff9a]/30 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(222,255,154,0.15)]">
                <ShoppingBag className="w-6 h-6 text-[#deff9a]" />
              </div>
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter text-white font-heading">Aether Store</h1>
                <p className="text-[#deff9a] text-xs font-mono uppercase tracking-[0.2em]">Partner Ecosystem & Gear</p>
              </div>
            </div>
            {isOwner && (
              <Button 
                onClick={() => setIsAddMode(true)}
                className="bg-[#deff9a]/20 text-[#deff9a] border border-[#deff9a]/50 hover:bg-[#deff9a] hover:text-black font-bold uppercase tracking-widest h-10 px-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6 custom-scrollbar pb-10">
            {products.map((product) => (
              <motion.div 
                key={product.id}
                whileHover={{ y: -5 }}
                onClick={() => setSelectedProduct(product.id)}
                className="bg-black/80 backdrop-blur-xl border border-white/10 hover:border-[#deff9a]/50 rounded-2xl md:rounded-3xl overflow-hidden flex flex-col transition-all group cursor-pointer"
              >
                <div className="relative h-32 md:h-40 w-full overflow-hidden bg-white/5">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover mix-blend-luminosity group-hover:mix-blend-normal opacity-50 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-2 left-2 md:top-4 md:left-4 z-20">
                    <span className="px-1.5 py-0.5 md:px-2 md:py-1 bg-black/50 backdrop-blur-md border border-white/10 rounded text-[7px] md:text-[8px] font-bold uppercase tracking-widest text-[#deff9a]">
                      {product.category}
                    </span>
                  </div>
                </div>
                
                <div className="p-3 md:p-4 flex flex-col gap-3 flex-1">
                  <div>
                    <h3 className="text-sm md:text-base font-bold text-white mb-0.5 md:mb-1 group-hover:text-[#deff9a] transition-colors line-clamp-2 leading-tight">{product.name}</h3>
                    <p className="text-white/40 font-mono text-xs md:text-sm">${product.price} <span className="text-[8px] md:text-[10px] text-white/20">/ CREDITS</span></p>
                  </div>
                  
                  <button className="mt-auto w-full py-2.5 md:py-3.5 rounded-lg md:rounded-xl bg-[#deff9a]/10 border border-[#deff9a]/30 text-[#deff9a] font-black tracking-widest uppercase text-[10px] md:text-xs hover:bg-[#deff9a] hover:text-black transition-all shadow-[0_0_15px_rgba(222,255,154,0.1)] flex items-center justify-center gap-1.5 md:gap-2 group-hover:shadow-[0_0_20px_rgba(222,255,154,0.3)]">
                    <Zap className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span>View Item</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="detail"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex-1 flex flex-col p-4 md:p-8 pt-6 max-w-5xl mx-auto w-full h-full pb-32 overflow-y-auto custom-scrollbar"
        >
          <button 
            onClick={() => setSelectedProduct(null)}
            className="flex items-center gap-2 text-white/50 hover:text-white mb-6 w-fit transition-colors group shrink-0"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest font-mono">Back to Store</span>
          </button>

          {product && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto w-full">
              <div className="rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 bg-white/5 aspect-square md:aspect-[4/3] h-fit max-h-[350px] relative">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover mix-blend-luminosity hover:mix-blend-normal transition-all duration-700 hover:scale-105"
                />
              </div>
              
              <div className="flex flex-col justify-center">
                <div className="mb-4 md:mb-6">
                  <span className="px-2 py-1 bg-black/50 backdrop-blur-md border border-[#deff9a]/30 rounded text-[10px] font-bold uppercase tracking-widest text-[#deff9a] inline-block mb-3">
                    {product.category}
                  </span>
                  <h1 className="text-2xl md:text-4xl font-black text-white leading-tight mb-3">{product.name}</h1>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1 text-[#deff9a]">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-bold">{product.rating}</span>
                    </div>
                    <span className="text-white/30 text-xs md:text-sm">({product.reviews} reviews)</span>
                  </div>

                  <div className="text-xl md:text-2xl font-mono text-white mb-4">
                    ${product.price} <span className="text-xs text-white/30 uppercase tracking-widest ml-2">Credits</span>
                  </div>

                  <p className="text-white/60 text-xs md:text-sm leading-relaxed mb-6">
                    {product.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-auto">
                  <button className="py-3 md:py-4 rounded-xl bg-white/5 border border-white/10 text-white font-black tracking-widest uppercase text-[10px] md:text-xs hover:bg-white/10 transition-all">
                    Add to Cart
                  </button>
                  <button 
                    onClick={() => {
                      const btn = document.getElementById(`sync-btn-${product.id}`);
                      if (btn) {
                        btn.innerHTML = `<span class="animate-pulse">Syncing...</span>`;
                        setTimeout(() => {
                           btn.innerHTML = `<span>Synced to Grid</span>`;
                           btn.className = btn.className.replace('bg-[#deff9a]', 'bg-transparent border border-[#deff9a] text-[#deff9a]');
                        }, 1500);
                      }
                    }}
                    id={`sync-btn-${product.id}`}
                    className="py-3 md:py-4 rounded-xl bg-[#deff9a] text-black font-black tracking-widest uppercase text-[10px] md:text-xs hover:bg-[#c5e67a] transition-all shadow-[0_0_20px_rgba(222,255,154,0.2)] hover:shadow-[0_0_30px_rgba(222,255,154,0.4)] flex items-center justify-center gap-2"
                  >
                    <Zap className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span>Sync Gear</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>

      <Dialog open={isAddMode} onOpenChange={setIsAddMode}>
        <DialogContent className="bg-obsidian/95 backdrop-blur-2xl border-white/10 text-white max-w-sm rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase text-[#deff9a]">Add New Gear</DialogTitle>
            <DialogDescription className="text-white/40 text-[10px] font-mono uppercase">Add products to your gym's virtual storefront</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono text-white/50">Product Name</label>
              <Input
                value={newProduct.name}
                onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                placeholder="E.g. Neural Link Wire"
                className="bg-black/40 border-white/10 text-xs text-white focus:border-[#deff9a]/50 h-10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono text-white/50">Price (Credits)</label>
              <Input
                type="number"
                value={newProduct.price}
                onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                placeholder="E.g. 50"
                className="bg-black/40 border-white/10 text-xs text-white focus:border-[#deff9a]/50 h-10"
              />
            </div>
            <Button onClick={handleAddProduct} className="w-full h-10 bg-[#deff9a] text-black font-bold uppercase tracking-widest text-[10px]">
              Deploy to Store
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

