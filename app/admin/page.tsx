'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { LayoutDashboard, Trash2, Loader2, Image as ImageIcon, Video, Package, FileText, Share2, Download, Zap } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'requests' | 'ads' | 'social'>('products');
  
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewType, setPreviewType] = useState<'feed' | 'story'>('feed');
  
  const previewRef = useRef<HTMLDivElement>(null);

  const [newProduct, setNewProduct] = useState({ name: '', price: '', discount: '', category: 'Eletrônicos', description: '' });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [adTitle, setAdTitle] = useState('');
  const [adDiscount, setAdDiscount] = useState('');

  useEffect(() => { loadData(); }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'products') {
        const { data } = await supabase.from('products').select('*').order('id', { ascending: false });
        setProducts(data || []);
      } else if (activeTab === 'orders') {
        const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        setOrders(data || []);
      } else if (activeTab === 'requests') {
        const { data } = await supabase.from('special_requests').select('*').order('created_at', { ascending: false });
        setRequests(data || []);
      } else {
        const { data, error } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
        if (error) console.error('Erro ao carregar ads:', error);
        setAds(data || []);
      }
    } catch (err) { console.error('Erro geral:', err); }
    setLoading(false);
  };

  const uploadToSupabase = async (file: File | null, type: 'image' | 'video', index?: number) => {
    if (!file) return null;
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}${index !== undefined ? `_${index}` : ''}.${fileExt}`;
    const filePath = `${type}s/${fileName}`;
    const { error } = await supabase.storage.from('evita-media').upload(filePath, file);
    setUploading(false);
    if (error) { alert('Erro ao enviar: ' + error.message); return null; }
    const { data } = supabase.storage.from('evita-media').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) return alert('Preencha Nome e Preço');
    if (imageFiles.length === 0) return alert('Selecione pelo menos uma imagem');
    setLoading(true);
    const imageUrls: string[] = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const url = await uploadToSupabase(imageFiles[i], 'image', i);
      if (url) imageUrls.push(url);
    }
    const videoUrl = await uploadToSupabase(videoFile, 'video');
    const { error } = await supabase.from('products').insert({
      name: newProduct.name, price: Number(newProduct.price), image: imageUrls[0] || null,
      images: imageUrls, video: videoUrl || null, discount: Number(newProduct.discount) || 0,
      category: newProduct.category, description: newProduct.description || null
    });
    setLoading(false);
    if (error) alert('Erro ao salvar produto: ' + error.message);
    else {
      alert(`✅ Produto salvo!`);
      setNewProduct({ name: '', price: '', discount: '', category: 'Eletrônicos', description: '' });
      setImageFiles([]); setVideoFile(null);
      loadData();
    }
  };

  const handleCreateSocialAd = async () => {
    if (selectedProducts.length === 0) return alert('Selecione pelo menos 1 produto');
    if (!adTitle) return alert('Adicione um título para a promoção');
    
    setLoading(true);
    const selectedProds = products.filter(p => selectedProducts.includes(p.id));
    const firstProduct = selectedProds[0];
    
    const { error } = await supabase.from('ads').insert({
      image_url: firstProduct.images?.[0] || firstProduct.image || 'https://via.placeholder.com/300',
      link_url: '/',
      title: adTitle.trim(),
      discount: adDiscount.trim() || null,
      product_ids: JSON.stringify(selectedProducts),
      type: 'social_media',
      is_active: true
    });
    
    setLoading(false);
    if (error) alert(`❌ Erro ao criar publicidade:\n${error.message}`);
    else {
      alert(`✅ Publicidade criada! Use o ícone 🗑️ para apagar.`);
      setSelectedProducts([]); setAdTitle(''); setAdDiscount('');
      loadData();
    }
  };

  const toggleProductSelection = (id: number) => setSelectedProducts(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);

  const deleteItem = async (table: string, id: number) => {
    if (!confirm('Eliminar este registo?')) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) alert('Erro ao eliminar'); else loadData();
  };

  const handleDownloadAd = async (type: 'feed' | 'story') => {
    if (selectedProducts.length === 0) return alert('Selecione produtos primeiro');
    setPreviewType(type);
    setGenerating(true);
    await new Promise(res => setTimeout(res, 500));
    
    if (previewRef.current) {
      try {
        const canvas = await html2canvas(previewRef.current, {
          useCORS: true,
          scale: 2,
          backgroundColor: null,
          logging: false,
        });
        const link = document.createElement('a');
        link.download = `evita-promo-${type}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error('Erro ao gerar imagem:', err);
        alert('Falha ao gerar imagem. Verifique se as imagens dos produtos são públicas.');
      }
    }
    setGenerating(false);
  };

  const mainProduct = products.find(p => selectedProducts.includes(p.id)) || { name: 'Produto', price: 0, discount: 0, image: 'https://via.placeholder.com/300', images: [] };
  const mainImageUrl = mainProduct.images?.[0] || mainProduct.image || 'https://via.placeholder.com/300';
  const finalPrice = mainProduct.price * (1 - (mainProduct.discount || 0) / 100);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-3"><LayoutDashboard className="text-blue-600"/> Painel Administrativo</h1>
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[{id:'products', label:'📦 Produtos'}, {id:'orders', label:'🛒 Pedidos'}, {id:'requests', label:'📄 Encomendas'}, {id:'ads', label:'📢 Publicidade'}, {id:'social', label:'📱 Redes Sociais'}].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`px-4 py-2 rounded font-medium whitespace-nowrap transition ${activeTab===t.id ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-200'}`}>{t.label}</button>
          ))}
        </div>

        {loading && <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600" size={32}/></div>}

        {activeTab === 'products' && !loading && (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Novo Produto</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input placeholder="Nome" className="border p-2 rounded" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              <input type="number" placeholder="Preço (AOA)" className="border p-2 rounded" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
              <input placeholder="Desconto %" className="border p-2 rounded" value={newProduct.discount} onChange={e => setNewProduct({...newProduct, discount: e.target.value})} />
              <select className="border p-2 rounded" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                <option>Eletrônicos</option><option>Moda</option><option>Casa</option><option>Outros</option>
              </select>
            </div>
            <textarea placeholder="Descrição do Produto" className="w-full border p-3 rounded mb-4 h-24" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
            <div className="flex gap-4 mb-4">
              <label className="flex-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50"><ImageIcon className="mx-auto mb-2 text-gray-400" size={24}/><span className="text-sm text-gray-600">{imageFiles.length > 0 ? `${imageFiles.length} imagens` : 'Carregar Fotos'}</span><input type="file" accept="image/*" multiple className="hidden" onChange={e => setImageFiles(Array.from(e.target.files || []))} /></label>
              <label className="flex-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50"><Video className="mx-auto mb-2 text-gray-400" size={24}/><span className="text-sm text-gray-600">{videoFile ? videoFile.name : 'Vídeo'}</span><input type="file" accept="video/*" className="hidden" onChange={e => setVideoFile(e.target.files?.[0] || null)} /></label>
            </div>
            <button onClick={handleAddProduct} disabled={uploading} className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 disabled:opacity-50">{uploading ? 'Enviando...' : '💾 Salvar Produto'}</button>
            <h3 className="font-bold mt-8 mb-2">Lista</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {products.map(p => (<div key={p.id} className="flex justify-between items-center border p-3 rounded bg-gray-50"><div className="flex items-center gap-3"><img src={p.images?.[0] || p.image} className="w-12 h-12 object-cover rounded"/><div><span className="font-medium block">{p.name}</span><span className="text-sm text-gray-500">AOA {p.price}</span></div></div><button onClick={() => deleteItem('products', p.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18}/></button></div>))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && !loading && (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Pedidos Recebidos</h2>
            {orders.length === 0 ? <p className="text-gray-500 text-center py-8">Nenhum pedido ainda.</p> : 
            <div className="space-y-4">{orders.map(o => (<div key={o.id} className="border-2 border-blue-100 rounded-lg p-4 bg-blue-50/30"><div className="flex justify-between items-start mb-3"><div><h3 className="font-bold text-lg flex items-center gap-2"><Package size={18} className="text-blue-600"/> Pedido #{o.id}</h3><p className="text-sm text-gray-600 mt-1">{new Date(o.created_at).toLocaleString('pt-AO')}</p></div><div className="text-right"><p className="text-xl font-bold text-green-700">AOA {o.total?.toLocaleString()}</p><span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Pago na Entrega</span></div></div><div className="grid md:grid-cols-2 gap-3 mb-3 text-sm"><div className="flex items-center gap-2"><span className="font-medium">👤 Cliente:</span><span>{o.customer_name}</span></div><div className="flex items-center gap-2"><span className="font-medium">📞 Telefone:</span><span>{o.phone}</span></div><div className="md:col-span-2 flex items-start gap-2"><span className="font-medium">📍 Endereço:</span><span className="flex-1">{o.address}</span></div></div><div className="border-t pt-3"><p className="font-medium mb-2 text-sm">Itens do Pedido:</p><div className="space-y-1">{o.items?.map((item: any, idx: number) => (<div key={idx} className="flex justify-between text-sm bg-white p-2 rounded"><span>{item.name} x{item.quantity}</span><span className="font-medium">AOA {(item.price * item.quantity).toLocaleString()}</span></div>))}</div></div><div className="flex justify-end mt-3"><button onClick={() => deleteItem('orders', o.id)} className="text-red-500 hover:bg-red-50 px-3 py-1 rounded text-sm flex items-center gap-1"><Trash2 size={14}/> Eliminar</button></div></div>))}</div>}
          </div>
        )}

        {activeTab === 'requests' && !loading && (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Encomendas Especiais</h2>
            {requests.length === 0 ? <p className="text-gray-500 text-center py-8">Nenhuma encomenda especial.</p> : 
            <div className="space-y-3">{requests.map(r => (<div key={r.id} className="border-2 border-yellow-200 rounded-lg p-4 bg-yellow-50/50"><div className="flex justify-between items-start"><div className="flex-1"><div className="flex items-center gap-2 mb-2"><FileText size={18} className="text-yellow-600"/><h3 className="font-bold text-lg">{r.customer_name}</h3></div><p className="text-blue-700 font-medium mb-2">Procura: {r.item_name}</p><div className="grid md:grid-cols-2 gap-2 text-sm mb-2"><p className="flex items-center gap-1">📞 {r.phone || 'N/A'}</p><p className="flex items-center gap-1">✉️ {r.email || 'N/A'}</p></div>{r.details && <p className="text-sm text-gray-600 italic bg-white p-2 rounded">"{r.details}"</p>}<p className="text-xs text-gray-500 mt-2">{new Date(r.created_at).toLocaleString('pt-AO')}</p></div><button onClick={() => deleteItem('special_requests', r.id)} className="text-red-500 hover:bg-red-50 p-2 rounded ml-3"><Trash2 size={18}/></button></div></div>))}</div>}
          </div>
        )}

        {activeTab === 'ads' && !loading && (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Publicidade Simples</h2>
            {ads.filter(ad => !ad.type || ad.type === 'simple').length === 0 ? <p className="text-gray-500 text-center py-8">Nenhuma publicidade simples.</p> :
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">{ads.filter(ad => !ad.type || ad.type === 'simple').map(ad => (<div key={ad.id} className="relative group border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"><img src={ad.image_url} className="w-full h-48 object-cover"/><div className="p-3 bg-white"><p className="text-sm font-medium truncate">{ad.title || 'Banner'}</p></div><button onClick={() => deleteItem('ads', ad.id)} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"><Trash2 size={16}/></button></div>))}</div>}
          </div>
        )}

        {activeTab === 'social' && !loading && (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><Zap className="text-yellow-500"/> Gerador de Publicidades Premium</h2>
            <p className="text-gray-600 mb-6 text-sm">Selecione um produto, preencha os dados e baixe uma imagem profissional que destaca automaticamente a foto do artigo.</p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold mb-3 flex items-center gap-2"><Package size={18}/> Selecione o Produto Destaque</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                  {products.map(p => (
                    <div key={p.id} onClick={() => setSelectedProducts([p.id])} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${selectedProducts.includes(p.id) ? 'bg-yellow-50 border-2 border-yellow-500' : 'bg-white border-2 border-transparent hover:bg-gray-100'}`}>
                      <img src={p.images?.[0] || p.image} className="w-14 h-14 object-cover rounded"/>
                      <div className="flex-1"><p className="font-medium text-sm">{p.name}</p><p className="text-xs text-gray-600">AOA {p.price.toLocaleString()}</p></div>
                      {selectedProducts.includes(p.id) && <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">{selectedProducts.length} produto(s) selecionado(s)</p>
              </div>
              <div>
                <h3 className="font-bold mb-3">Configuração da Promoção</h3>
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium mb-1">Título da Promoção</label><input placeholder="Ex: Super Oferta de Verão" className="w-full border p-3 rounded-lg" value={adTitle} onChange={e => setAdTitle(e.target.value)} /></div>
                  <div><label className="block text-sm font-medium mb-1">Desconto (opcional)</label><input placeholder="Ex: 30% OFF" className="w-full border p-3 rounded-lg" value={adDiscount} onChange={e => setAdDiscount(e.target.value)} /></div>
                  
                  <div className="flex gap-3">
                    <button onClick={() => handleDownloadAd('feed')} disabled={generating || selectedProducts.length === 0} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                      {generating ? <Loader2 className="animate-spin"/> : <><Download size={16}/> Baixar Feed (1:1)</>}
                    </button>
                    <button onClick={() => handleDownloadAd('story')} disabled={generating || selectedProducts.length === 0} className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                      {generating ? <Loader2 className="animate-spin"/> : <><Download size={16}/> Baixar Story (9:16)</>}
                    </button>
                  </div>

                  <button onClick={handleCreateSocialAd} disabled={loading || selectedProducts.length === 0 || !adTitle} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2">{loading ? <Loader2 className="animate-spin"/> : <><Share2 size={18}/> Salvar no Banco</>}</button>
                </div>

                <div className="mt-8 border-t pt-6">
                  <h3 className="font-bold mb-3 flex items-center gap-2"><FileText size={18}/> Publicidades Criadas</h3>
                  {ads.filter(ad => ad.type === 'social_media').length === 0 ? <p className="text-gray-500 text-sm">Nenhuma publicidade social criada ainda.</p> :
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {ads.filter(ad => ad.type === 'social_media').map(ad => (
                      <div key={ad.id} className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                        <div className="flex items-center gap-3"><img src={ad.image_url} className="w-10 h-10 object-cover rounded"/><div><p className="font-medium text-sm">{ad.title}</p><p className="text-xs text-gray-500">{ad.discount} • {new Date(ad.created_at).toLocaleDateString('pt-AO')}</p></div></div>
                        <button onClick={() => deleteItem('ads', ad.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18}/></button>
                      </div>
                    ))}
                  </div>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🖼️ TEMPLATE PREMIUM DE PUBLICIDADE (Oculto, usado apenas para gerar a imagem) */}
      <div ref={previewRef} style={{ 
        position: 'absolute', left: '-9999px', top: 0, 
        width: previewType === 'feed' ? '1080px' : '1080px', 
        height: previewType === 'feed' ? '1080px' : '1920px', 
        background: '#0b0f19', 
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', 
        color: 'white', 
        overflow: 'hidden', 
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Fundo desfocado da própria imagem do produto para harmonia visual */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <img src={mainImageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(60px) brightness(0.35) saturate(1.2)', transform: 'scale(1.3)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)' }}></div>
        </div>

        {/* Conteúdo Principal */}
        <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '40px' }}>
          
          {/* Header: Logo + Título */}
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', padding: '16px 32px', borderRadius: '60px', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ width: '48px', height: '48px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#0b0f19', fontSize: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>E</div>
              <span style={{ fontWeight: '700', fontSize: '24px', letterSpacing: '2px', textTransform: 'uppercase' }}>EVITA.AO</span>
            </div>
            <h1 style={{ fontSize: previewType === 'feed' ? '64px' : '84px', fontWeight: '800', lineHeight: '1.05', margin: '0 0 20px 0', textShadow: '0 6px 20px rgba(0,0,0,0.6)' }}>{adTitle || 'PROMOÇÃO ESPECIAL'}</h1>
            {adDiscount && (
              <span style={{ 
                display: 'inline-block', 
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)', 
                color: 'white', 
                fontSize: '36px', 
                fontWeight: '800', 
                padding: '12px 36px', 
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.4)',
                transform: 'rotate(-2deg)'
              }}>
                {adDiscount}
              </span>
            )}
          </div>

          {/* Imagem do Produto em Destaque */}
          <div style={{ 
            width: previewType === 'feed' ? '85%' : '80%', 
            height: previewType === 'feed' ? '45%' : '50%', 
            borderRadius: '32px', 
            overflow: 'hidden', 
            boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.15)',
            position: 'relative',
            background: '#111',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img src={mainImageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            
            {/* Card de Preço Glassmorphism */}
            <div style={{ 
              position: 'absolute', 
              bottom: '32px', 
              left: '32px', 
              right: '32px', 
              background: 'rgba(15, 23, 42, 0.75)', 
              backdropFilter: 'blur(20px)', 
              borderRadius: '24px', 
              padding: '28px 36px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
            }}>
              <div>
                <p style={{ fontSize: '32px', fontWeight: '700', margin: '0 0 8px 0', color: '#fff' }}>{mainProduct.name}</p>
                <p style={{ fontSize: '20px', color: '#94a3b8', margin: 0 }}>Em stock • Entrega rápida</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                {mainProduct.discount > 0 && <p style={{ fontSize: '22px', textDecoration: 'line-through', color: '#64748b', margin: '0 0 4px 0' }}>AOA {mainProduct.price.toLocaleString()}</p>}
                <p style={{ fontSize: '48px', fontWeight: '900', margin: 0, color: '#38bdf8', textShadow: '0 0 24px rgba(56,189,248,0.5)' }}>AOA {finalPrice.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          position: 'relative', 
          zIndex: 10, 
          textAlign: 'center', 
          padding: '32px', 
          background: 'rgba(0,0,0,0.4)', 
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          <p style={{ fontSize: '26px', fontWeight: '600', letterSpacing: '3px', margin: 0, color: '#e2e8f0' }}>
            🛒 DISPONÍVEL EM EVITA.AO • ENTREGA RÁPIDA 🇦🇴
          </p>
        </div>
      </div>
    </div>
  );
}