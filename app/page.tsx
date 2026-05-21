'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingCart, Trash2, Package, X, Search, FileText, Minus, Plus, Loader2, Truck, Mail, Video, ChevronLeft, ChevronRight } from 'lucide-react';

interface Product { 
  id: number; name: string; price: number; image: string; category: string; discount?: number; video?: string; 
  images?: string[]; description?: string; 
}
interface CartItem extends Product { quantity: number; }
interface Ad { id: number; image_url: string; link_url: string; title?: string; discount?: string; }

const translations = {
  pt: {
    search: "O que você procura?", specialOrder: "Encomenda Especial", addToCart: "Adicionar",
    support: "Suporte", payment: "Pagamento & Entrega", secure: "💰 Pagar na Entrega | 🔒 Seguro",
    copyright: "© 2026 Evita Store.", cartTitle: "Seu Carrinho", emptyCart: "Carrinho vazio.",
    unitPrice: "Preço unitário", estimatedTotal: "Total Estimado:", finishPurchase: "Finalizar Compra",
    deliveryData: "Dados de Entrega", fullName: "Nome Completo", phone: "Telefone / WhatsApp",
    address: "Endereço Completo (Bairro, Rua, Referência)", confirmOrder: "Confirmar Pedido",
    processing: "Processando...", cancel: "Cancelar", specialOrderTitle: "Encomenda Especial",
    articleName: "Artigo que procura", details: "Detalhes (Cor, Modelo, Tamanho...)",
    sendOrder: "Enviar Pedido", sending: "Enviando..."
  },
  en: {
    search: "What are you looking for?", specialOrder: "Special Order", addToCart: "Add to Cart",
    support: "Support", payment: "Payment & Delivery", secure: "💰 Cash on Delivery | 🔒 Secure",
    copyright: "© 2026 Evita Store.", cartTitle: "Your Cart", emptyCart: "Cart is empty.",
    unitPrice: "Unit price", estimatedTotal: "Estimated Total:", finishPurchase: "Checkout",
    deliveryData: "Delivery Details", fullName: "Full Name", phone: "Phone / WhatsApp",
    address: "Full Address (Neighborhood, Street, Ref.)", confirmOrder: "Confirm Order",
    processing: "Processing...", cancel: "Cancel", specialOrderTitle: "Special Order",
    articleName: "Article you're looking for", details: "Details (Color, Model, Size...)",
    sendOrder: "Send Request", sending: "Sending..."
  }
};

export default function Home() {
  const [lang, setLang] = useState<'pt' | 'en'>('pt');
  const [products, setProducts] = useState<Product[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [mediaToggle, setMediaToggle] = useState<Record<number, boolean>>({});
  const [currentImageIndex, setCurrentImageIndex] = useState<Record<number, number>>({});
  
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [requestData, setRequestData] = useState({ name: '', phone: '', item_name: '', details: '' });

  const t = (key: keyof typeof translations.pt) => translations[lang][key];

  const fetchData = async () => {
    const [prodRes, adsRes] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('ads').select('*').eq('is_active', true)
    ]);
    if (prodRes.data) setProducts(prodRes.data);
    if (adsRes.data) setAds(adsRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const exist = prev.find(i => i.id === product.id);
      return exist ? prev.map(i => i.id === product.id ? {...i, quantity: i.quantity + 1} : i) : [...prev, {...product, quantity: 1}];
    });
    setShowCart(true);
  };

  const updateQuantity = (id: number, change: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + change);
        return newQty === 0 ? null : { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const removeFromCart = (id: number) => setCart(prev => prev.filter(i => i.id !== id));
  const total = cart.reduce((acc, i) => acc + (i.price * (1 - (i.discount || 0) / 100)) * i.quantity, 0);
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault(); setSending(true);
    const { error } = await supabase.from('orders').insert({
      customer_name: formData.name, phone: formData.phone, address: formData.address, items: cart, total
    });
    setSending(false);
    if (error) alert('Erro ao registrar pedido.');
    else { alert('✅ Pedido Realizado! Entraremos em contacto.'); setCart([]); setShowCheckout(false); setShowCart(false); }
  };

  const handleSpecialRequest = async (e: React.FormEvent) => {
    e.preventDefault(); setSending(true);
    const { error } = await supabase.from('special_requests').insert({
      customer_name: requestData.name, phone: requestData.phone, item_name: requestData.item_name, details: requestData.details
    });
    setSending(false);
    if (error) alert('Erro ao enviar encomenda.');
    else { alert('✅ Encomenda registada!'); setShowRequest(false); setRequestData({ name: '', phone: '', item_name: '', details: '' }); }
  };

  const getDisplayImage = (p: Product, index: number = 0) => {
    if (p.images && p.images.length > 0) return p.images[index] || p.images[0];
    return p.image || 'https://via.placeholder.com/300';
  };

  const nextImage = (id: number, maxLen: number) => setCurrentImageIndex(prev => ({ ...prev, [id]: ((prev[id] || 0) + 1) % maxLen }));
  const prevImage = (id: number, maxLen: number) => setCurrentImageIndex(prev => ({ ...prev, [id]: ((prev[id] || 0) - 1 + maxLen) % maxLen }));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-[#0a192f] text-white p-3 sticky top-0 z-40 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo Evita" className="h-8 w-auto object-contain" />
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2 text-gray-400" size={16}/>
            <input type="text" placeholder={t('search')} className="w-full pl-9 pr-4 py-1.5 rounded-full text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')} className="p-1.5 hover:bg-white/10 rounded-full transition flex items-center justify-center gap-1 text-sm font-medium" title="Change Language">
              {lang === 'pt' ? '🇦🇴' : '🇬'} <span className="hidden md:inline text-xs">{lang === 'pt' ? 'PT' : 'EN'}</span>
            </button>
            <button onClick={() => setShowRequest(true)} className="text-xs hover:text-orange-400 flex items-center gap-1"><FileText size={14}/> {t('specialOrder')}</button>
            <button onClick={() => setShowCart(!showCart)} className="relative p-1.5 hover:bg-white/10 rounded-full transition">
              <ShoppingCart size={20} />
              {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{cart.reduce((a,b)=>a+b.quantity,0)}</span>}
            </button>
          </div>
        </div>
      </header>

      {!loading && ads.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 mt-3 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ads.map(ad => (
              <a key={ad.id} href={ad.link_url || '/'} className="block rounded-lg overflow-hidden shadow-sm hover:shadow-md transition relative group cursor-pointer">
                <img src={ad.image_url} className="w-full h-32 md:h-40 object-cover" alt={ad.title || 'Promoção'} />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition flex flex-col items-center justify-center text-white p-2">
                  <p className="font-bold text-sm md:text-base text-center drop-shadow-md">{ad.title || 'Oferta Especial'}</p>
                  {ad.discount && <span className="mt-1 bg-orange-500 text-xs px-2 py-0.5 rounded font-bold">{ad.discount}</span>}
                  <span className="absolute bottom-2 right-2 bg-white/20 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full">👆 Ver na Loja</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-6 flex-grow">
        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={28}/></div> :
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredProducts.map((p) => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition overflow-hidden border border-gray-100 group">
              <div className="relative overflow-hidden bg-white">
                <img src={getDisplayImage(p)} alt={p.name} className="w-full h-48 object-contain p-3 group-hover:scale-105 transition duration-300" />
                {/* ✅ CORREÇÃO FINAL: Só mostra se desconto for maior que 0 */}
                {p.discount !== undefined && p.discount !== null && p.discount > 0 && (
                  <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">-{p.discount}%</span>
                )}
                {p.images && p.images.length > 1 && <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1 backdrop-blur-sm">📷 {p.images.length}</span>}
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">{p.category}</p>
                <h4 className="font-bold text-gray-800 mb-1 line-clamp-1 h-5">{p.name}</h4>
                {p.description && <p className="text-[10px] text-gray-500 mb-2 line-clamp-2 leading-tight">{p.description}</p>}
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-lg font-bold text-[#0a192f]">AOA {(p.price * (1 - (p.discount || 0) / 100)).toLocaleString()}</p>
                  {/* ✅ CORREÇÃO FINAL: Só mostra preço antigo se desconto for maior que 0 */}
                  {p.discount !== undefined && p.discount !== null && p.discount > 0 && (
                    <p className="text-xs text-gray-400 line-through">AOA {p.price.toLocaleString()}</p>
                  )}
                </div>
                <button onClick={() => addToCart(p)} className="w-full bg-[#0a192f] text-white py-1.5 px-3 rounded-lg text-xs hover:bg-blue-800 transition font-medium flex items-center justify-center gap-1.5">
                  <ShoppingCart size={12} /> {t('addToCart')}
                </button>
              </div>
            </div>
          ))}
        </div>}
      </main>

      <footer className="bg-[#0a192f] text-gray-300 py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-6 text-center md:text-left">
          <div>
            <h4 className="text-white font-bold mb-3 flex items-center justify-center md:justify-start gap-2"><Mail size={16} className="text-orange-500"/> {t('support')}</h4>
            <a href="mailto:suporte@evita.ao" className="text-orange-400 hover:underline">suporte@evita.ao</a>
          </div>
          <div>
            <h4 className="text-white font-bold mb-3">{t('payment')}</h4>
            <p className="text-sm text-gray-400">{t('secure')}</p>
          </div>
          <div className="text-sm text-gray-500">{t('copyright')}</div>
        </div>
      </footer>

      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-md bg-gray-50 h-full shadow-2xl flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-white shadow-sm z-10">
              <h2 className="font-bold text-lg flex items-center gap-2"><Package size={20}/> {t('cartTitle')}</h2>
              <button onClick={() => setShowCart(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? <p className="text-center text-gray-500 mt-10 text-lg">{t('emptyCart')}</p> : 
              [...cart].reverse().map((item) => {
                const itemImgIndex = currentImageIndex[item.id] || 0;
                const allImages = item.images && item.images.length > 0 ? item.images : [item.image];
                const isVideo = mediaToggle[item.id] && item.video;
                return (
                  <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="relative w-full h-56 bg-white flex items-center justify-center">
                      {isVideo ? (
                        <video src={item.video} className="w-full h-full object-contain p-2" controls playsInline preload="none" />
                      ) : (
                        <img src={allImages[itemImgIndex]} className="w-full h-full object-contain p-2 transition-transform duration-500" alt={item.name} />
                      )}
                      {!isVideo && allImages.length > 1 && (
                        <>
                          <button onClick={() => prevImage(item.id, allImages.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-md transition"><ChevronLeft size={20} /></button>
                          <button onClick={() => nextImage(item.id, allImages.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-md transition"><ChevronRight size={20} /></button>
                          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">{itemImgIndex + 1} / {allImages.length}</span>
                        </>
                      )}
                      {item.video && (
                        <button onClick={() => setMediaToggle(prev => ({ ...prev, [item.id]: !prev[item.id] }))} className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition">
                          {isVideo ? <ChevronLeft size={16} /> : <Video size={16} />}
                        </button>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-800 text-base line-clamp-2">{item.name}</h4>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18}/></button>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{t('unitPrice')}: AOA {(item.price * (1 - (item.discount || 0) / 100)).toLocaleString()}</p>
                      <div className="flex items-center justify-between mt-4 border-t pt-3">
                        <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-gray-700 font-bold hover:text-blue-600 transition">−</button>
                          <span className="text-base font-bold w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-gray-700 font-bold hover:text-blue-600 transition">+</button>
                        </div>
                        <p className="text-lg font-bold text-[#0a192f]">AOA {((item.price * (1 - (item.discount || 0) / 100)) * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-center mb-4"><span className="text-gray-600 font-medium">{t('estimatedTotal')}</span><span className="text-2xl font-bold text-[#0a192f]">AOA {total.toLocaleString()}</span></div>
              <button onClick={() => cart.length > 0 && setShowCheckout(true)} disabled={cart.length === 0 || sending} className="w-full bg-green-600 text-white py-4 rounded-xl text-base font-bold hover:bg-green-700 transition disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg">{t('finishPurchase')}</button>
            </div>
          </div>
        </div>
      )}

      {showCheckout && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Truck size={22}/> {t('deliveryData')}</h2>
            <form onSubmit={handleCheckout} className="space-y-4">
              <input required placeholder={t('fullName')} className="w-full border p-3 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input required placeholder={t('phone')} className="w-full border p-3 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              <textarea required placeholder={t('address')} className="w-full border p-3 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" rows={3} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              <button disabled={sending} className="w-full bg-green-600 text-white py-3 rounded-lg text-base font-bold hover:bg-green-700 transition">{sending ? t('processing') : t('confirmOrder')}</button>
              <button type="button" onClick={() => setShowCheckout(false)} className="w-full text-gray-500 py-2 text-sm hover:text-gray-700">{t('cancel')}</button>
            </form>
          </div>
        </div>
      )}

      {showRequest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">{t('specialOrderTitle')}</h2><button onClick={() => setShowRequest(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button></div>
            <form onSubmit={handleSpecialRequest} className="space-y-3">
              <input required placeholder={t('fullName')} className="w-full border p-3 rounded-lg text-sm" value={requestData.name} onChange={e => setRequestData({...requestData, name: e.target.value})} />
              <input required placeholder={t('phone')} className="w-full border p-3 rounded-lg text-sm" value={requestData.phone} onChange={e => setRequestData({...requestData, phone: e.target.value})} />
              <input required placeholder={t('articleName')} className="w-full border p-3 rounded-lg text-sm" value={requestData.item_name} onChange={e => setRequestData({...requestData, item_name: e.target.value})} />
              <textarea placeholder={t('details')} className="w-full border p-3 rounded-lg text-sm" rows={3} value={requestData.details} onChange={e => setRequestData({...requestData, details: e.target.value})} />
              <button disabled={sending} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">{sending ? t('sending') : t('sendOrder')}</button>
              <button type="button" onClick={() => setShowRequest(false)} className="w-full text-gray-500 py-2 text-sm">{t('cancel')}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}