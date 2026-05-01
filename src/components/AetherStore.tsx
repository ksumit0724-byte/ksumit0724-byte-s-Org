import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Zap, ChevronLeft, Plus, Loader2, Mail, Phone } from 'lucide-react';
import { useAetherStore } from '../store/useAetherStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { getSupabase } from '../lib/supabase';

export const AetherStore: React.FC = () => {
  const { session, user, isDemoMode } = useAetherStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isAddMode, setIsAddMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const userRole = (session?.user?.user_metadata?.role || user?.role || 'individual').toLowerCase();
  const isOwner = userRole === 'owner' || userRole === 'gym_owner';

  const [newProduct, setNewProduct] = useState({ 
    product_name: '', 
    price: '', 
    category: 'GEAR', 
    description: '', 
    contact_info: '' 
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      if (isDemoMode) throw new Error("demo");
      const client = getSupabase();
      if (!client) throw new Error("no client");
      const { data, error } = await client
        .from('store_listings')
        .select(`
          *,
          profiles(neural_id, gym_id),
          gyms(name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error(err);
      setProducts([]); // No fake listings
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [isDemoMode]);

  const handleAddProduct = async () => {
    if (!newProduct.product_name || !newProduct.price) return;
    setSubmitting(true);
    try {
      if (isDemoMode || !user?.id) throw new Error("Demo mode or no user");
      const client = getSupabase();
      if (!client) throw new Error("No client");
      
      const gymId = user.user_metadata?.gym_id || user.gym_id;

      const { error } = await client.from('store_listings').insert({
        seller_id: user.id,
        gym_id: gymId,
        product_name: newProduct.product_name,
        price: parseFloat(newProduct.price),
        category: newProduct.category,
        description: newProduct.description,
        contact_info: newProduct.contact_info,
        is_active: true
      });

      if (error) throw error;
      
      setIsAddMode(false);
      setNewProduct({ product_name: '', price: '', category: 'GEAR', description: '', contact_info: '' });
      fetchProducts();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const categories = ['ALL', 'GEAR', 'NUTRITION', 'EQUIPMENT', 'APPAREL', 'SUPPLEMENTS'];
  
  const filteredProducts = products.filter(p => selectedCategory === 'ALL' || p.category === selectedCategory);

  if (isAddMode) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col p-4 md:p-8 pt-6 max-w-3xl mx-auto w-full h-full pb-32 overflow-y-auto custom-scrollbar"
      >
        <button 
          onClick={() => setIsAddMode(false)}
          className="flex items-center gap-2 text-white/50 hover:text-white mb-6 w-fit transition-colors group shrink-0"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-widest font-mono">Back to Store</span>
        </button>

        <h1 className="text-3xl font-black uppercase tracking-tighter text-[#deff9a] font-heading mb-2">List Your Product</h1>
        <p className="text-white/40 text-[10px] uppercase font-mono tracking-widest mb-8">Gym Owner Equipment & Supply Listing</p>

        <div className="glass-panel p-6 md:p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono font-bold text-white/50">Product Name</label>
              <Input
                value={newProduct.product_name}
                onChange={e => setNewProduct({...newProduct, product_name: e.target.value})}
                placeholder="E.g. Neural Lifting Belt"
                className="bg-black/40 border-white/10 text-white focus:border-[#deff9a]/50 h-10 font-mono text-xs"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono font-bold text-white/50">Price (₹)</label>
                <Input
                  type="number"
                  value={newProduct.price}
                  onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                  placeholder="E.g. 1500"
                  className="bg-black/40 border-white/10 text-white focus:border-[#deff9a]/50 h-10 font-mono text-xs"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono font-bold text-white/50">Category</label>
                <select 
                  value={newProduct.category}
                  onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 h-10 rounded-xl px-3 text-white focus:outline-none focus:border-[#deff9a]/50 font-mono text-xs"
                >
                  {categories.filter(c => c !== 'ALL').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono font-bold text-white/50">Description</label>
              <textarea
                value={newProduct.description}
                onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                placeholder="Describe your product..."
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#deff9a]/50 min-h-[100px] font-mono text-xs resize-none"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono font-bold text-white/50">Contact Info</label>
              <Input
                value={newProduct.contact_info}
                onChange={e => setNewProduct({...newProduct, contact_info: e.target.value})}
                placeholder="Phone number, email, or gym desk..."
                className="bg-black/40 border-white/10 text-white focus:border-[#deff9a]/50 h-10 font-mono text-xs"
              />
            </div>

            <Button 
              onClick={handleAddProduct} 
              disabled={submitting}
              className="w-full h-12 mt-4 bg-[#deff9a] hover:bg-[#cbf572] text-black font-black uppercase tracking-widest text-xs"
            >
              {submitting ? 'Listing Product...' : 'List Product'}
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      key="list"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 flex flex-col p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full h-full pb-32 overflow-y-auto custom-scrollbar"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#deff9a]/10 border border-[#deff9a]/30 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(222,255,154,0.15)]">
            <ShoppingBag className="w-6 h-6 text-[#deff9a]" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white font-heading">Aether Store</h1>
            <p className="text-[#deff9a] text-xs font-mono uppercase tracking-[0.2em]">Gym Partner Ecosystem</p>
          </div>
        </div>
        
        {isOwner && (
          <Button 
            onClick={() => setIsAddMode(true)}
            className="bg-[#deff9a]/20 text-[#deff9a] border border-[#deff9a]/50 hover:bg-[#deff9a] hover:text-black font-bold uppercase tracking-widest h-10 px-4"
          >
            <Plus className="w-4 h-4 mr-2" />
            List Your Product
          </Button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-4 mb-4">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-[10px] font-mono tracking-widest uppercase transition-colors whitespace-nowrap shrink-0 border ${selectedCategory === cat ? 'bg-[#deff9a]/20 border-[#deff9a]/50 text-[#deff9a]' : 'border-white/10 text-white/40 hover:text-white hover:bg-white/5'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center flex-1 py-20 bg-white/5 border border-white/10 rounded-3xl border-dashed">
          <Loader2 className="w-8 h-8 text-[#deff9a] animate-spin mb-4" />
          <p className="text-xs font-mono uppercase tracking-widest text-[#deff9a]/50">Syncing database...</p>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredProducts.map((product) => (
            <motion.div 
              key={product.id}
              whileHover={{ y: -5 }}
              className="glass-panel overflow-hidden flex flex-col group border hover:border-[#deff9a]/50 transition-all p-5"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="px-2 py-0.5 bg-black/50 border border-white/20 rounded text-[8px] font-bold uppercase tracking-widest text-[#deff9a]">
                  {product.category}
                </span>
                <span className="text-xs font-mono text-white/40 uppercase truncate max-w-[120px]">
                  {product.gyms?.name || 'Local Gym'}
                </span>
              </div>
              
              <h3 className="text-lg font-black text-white mb-1 group-hover:text-[#deff9a] transition-colors leading-tight">{product.product_name}</h3>
              <div className="text-xl font-mono tracking-tighter text-white mb-4">₹{product.price}</div>
              
              <button 
                onClick={() => alert(`Contact Seller:\n${product.contact_info || product.gyms?.name || 'Inquire at gym desk'}`)}
                className="mt-auto w-full py-3 rounded-lg border border-[#deff9a]/30 text-[#deff9a] font-black tracking-widest uppercase text-[10px] hover:bg-[#deff9a] hover:text-black transition-all flex items-center justify-center gap-2 group-hover:shadow-[0_0_15px_rgba(222,255,154,0.2)]"
              >
                <Mail className="w-3.5 h-3.5" />
                Contact Seller
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 py-20 bg-white/5 border border-white/10 rounded-3xl border-dashed text-center px-4">
          <ShoppingBag className="w-12 h-12 text-white/20 mb-4" />
          <h3 className="text-lg font-black text-white/60 mb-2 uppercase tracking-widest font-heading">No Listings Found</h3>
          <p className="text-[10px] font-mono text-white/40 max-w-sm mx-auto uppercase mb-6 leading-relaxed">
            Marketplace is empty for this category.
            {isOwner ? " Be the first to list your products on Aether Store." : ""}
          </p>
          {isOwner && (
            <Button 
              onClick={() => setIsAddMode(true)}
              className="bg-[#deff9a] text-black font-black uppercase tracking-widest"
            >
              List Your Product
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
};

