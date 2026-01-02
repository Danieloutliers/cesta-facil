import React, { useState, useEffect } from 'react';
import { Camera, Upload, Check, Edit2, Loader2, Sparkles, Database, Plus, Home } from 'lucide-react';
import { AppView, Product, ScannedData } from './types';
import { CameraCapture } from './components/CameraCapture';
import { analyzeProductImage } from './services/geminiService';
import { supabase, PRODUCT_BUCKET } from './services/supabase';

export default function App() {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scanResult, setScanResult] = useState<ScannedData | null>(null);

  // States for animation simulation
  const [processingStep, setProcessingStep] = useState<string>('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      setProducts(data || []);
    } catch (e) {
      console.error('Exception fetching products:', e);
    }
  };

  const handleCapture = (imageData: string) => {
    setCurrentImage(imageData);
    setView(AppView.PREVIEW);
  };

  const startAnalysis = async () => {
    if (!currentImage) return;

    setView(AppView.PROCESSING);
    setIsProcessing(true);

    // Simulate steps for UX
    setProcessingStep('Enviando para IA...');
    await new Promise(r => setTimeout(r, 800));
    setProcessingStep('Identificando produto...');

    // Real Gemini Call
    const data = await analyzeProductImage(currentImage);

    setProcessingStep('Melhorando qualidade da imagem...');
    await new Promise(r => setTimeout(r, 1000)); // Fake processing time for "image enhancement"

    setScanResult(data);
    setIsProcessing(false);
    setView(AppView.RESULT);
  };

  const uploadImage = async (base64Image: string): Promise<string | null> => {
    try {
      // Convert base64 to blob
      const res = await fetch(base64Image);
      const blob = await res.blob();

      const fileName = `scan-${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from(PRODUCT_BUCKET)
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(PRODUCT_BUCKET)
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const saveProduct = async () => {
    if (!scanResult || !currentImage) return;

    setIsSaving(true);

    try {
      // 1. Upload Image
      const imageUrl = await uploadImage(currentImage);

      if (!imageUrl) {
        alert('Erro ao fazer upload da imagem. Tente novamente.');
        setIsSaving(false);
        return;
      }

      // 2. Insert to Database
      const newProduct = {
        name: scanResult.name,
        price: scanResult.price,
        category: scanResult.category.toLowerCase(), // Ensure lowercase for enum match if strict
        image: imageUrl,
        description: scanResult.description,
        unit: 'un', // Default unit, AI doesn't guess this well yet
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('products')
        .insert([newProduct]);

      if (error) {
        console.error('Error saving product:', error);
        alert(`Erro ao salvar no banco de dados: ${error.message}`);
        setIsSaving(false);
        return;
      }

      // 3. Refresh and Redirect
      fetchProducts();
      setView(AppView.DASHBOARD);
      setCurrentImage(null);
      setScanResult(null);

    } catch (error) {
      console.error('Unexpected error:', error);
      alert('Ocorreu um erro inesperado.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderDashboard = () => (
    <div className="flex flex-col h-full bg-gray-50">
      <header className="bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-green-700 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            SuperScan AI
          </h1>
          <p className="text-xs text-gray-500">Gestão Inteligente de Gôndola</p>
        </div>
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
          JD
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-xl p-4 text-white shadow-lg">
          <h2 className="font-semibold text-lg mb-1">Status do Sistema</h2>
          <div className="flex items-center gap-2 text-sm opacity-90">
            <div className="w-2 h-2 bg-green-200 rounded-full animate-pulse" />
            Banco de dados conectado
          </div>
          <p className="mt-4 text-2xl font-bold">{products.length} Produtos</p>
          <p className="text-xs opacity-75">Sincronizados recentemente</p>
        </div>

        <h3 className="font-semibold text-gray-700 mt-6">Últimas Atualizações</h3>
        <div className="space-y-3">
          {products.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nenhum produto recente.</p>
          ) : (
            products.map(product => (
              <div key={product.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex gap-3">
                <div className="w-20 h-20 rounded-md overflow-hidden bg-gray-100 relative group">
                  <img
                    src={product.image || 'https://via.placeholder.com/150'}
                    alt={product.name}
                    className="w-full h-full object-cover transition-all duration-500"
                  />
                  {product.isEnhanced && (
                    <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-tl-lg">
                      <Sparkles size={10} />
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h4 className="font-medium text-gray-800 line-clamp-2 leading-tight">{product.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="font-bold text-lg text-green-700">R$ {product.price.toFixed(2)}</span>
                    <span className="text-[10px] text-gray-400">
                      {product.created_at ? new Date(product.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <button
        onClick={() => setView(AppView.CAMERA)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-green-700 transition-all active:scale-95 z-50"
      >
        <Plus size={28} />
      </button>
    </div>
  );

  const renderPreview = () => (
    <div className="flex flex-col h-full bg-black">
      <div className="flex-1 flex items-center justify-center relative">
        {currentImage && (
          <img src={currentImage} alt="Preview" className="max-w-full max-h-full object-contain" />
        )}
      </div>
      <div className="p-6 bg-white rounded-t-2xl space-y-4">
        <h3 className="text-lg font-bold text-center">Foto Capturada</h3>
        <p className="text-sm text-center text-gray-500">A imagem está nítida e o produto visível?</p>
        <div className="flex gap-4">
          <button
            onClick={() => setView(AppView.CAMERA)}
            className="flex-1 py-3 px-4 rounded-xl border border-gray-300 font-semibold text-gray-700"
          >
            Tirar Outra
          </button>
          <button
            onClick={startAnalysis}
            className="flex-1 py-3 px-4 rounded-xl bg-green-600 text-white font-semibold flex items-center justify-center gap-2"
          >
            Usar Foto <Check size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="flex flex-col h-full items-center justify-center bg-white p-8 space-y-6">
      <div className="relative">
        <div className="w-24 h-24 rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-green-600">
          <Sparkles size={32} className="animate-pulse" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-gray-800">Processando Imagem</h3>
        <p className="text-green-600 font-medium animate-pulse">{processingStep}</p>
        <p className="text-xs text-gray-400 max-w-xs mx-auto pt-4">
          A IA está analisando rótulos, etiquetas de preço e melhorando a iluminação da foto.
        </p>
      </div>
    </div>
  );

  const renderResult = () => (
    <div className="flex flex-col h-full bg-gray-50">
      <header className="bg-white p-4 shadow-sm flex items-center gap-4">
        <button onClick={() => setView(AppView.DASHBOARD)} className="text-gray-500">
          <Home size={24} />
        </button>
        <h1 className="font-bold text-lg">Revisão do Produto</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="relative h-64 bg-gray-100">
            {currentImage && (
              <img
                src={currentImage}
                alt="Product"
                className="w-full h-full object-contain filter contrast-125 brightness-110 saturate-110" // Simulating image enhancement
              />
            )}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-blue-600 flex items-center gap-1 shadow-sm">
              <Sparkles size={12} />
              Imagem Tratada
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Produto Identificado</label>
              <div className="flex items-start gap-2">
                <input
                  type="text"
                  value={scanResult?.name}
                  onChange={(e) => setScanResult(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full text-lg font-bold text-gray-800 border-b border-dashed border-gray-300 focus:border-green-500 focus:outline-none py-1 bg-transparent"
                />
                <Edit2 size={16} className="text-gray-400 mt-2 shrink-0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Preço (R$)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={scanResult?.price}
                    onChange={(e) => setScanResult(prev => prev ? { ...prev, price: parseFloat(e.target.value) } : null)}
                    className="w-full text-2xl font-bold text-green-700 border-b border-dashed border-gray-300 focus:border-green-500 focus:outline-none py-1 bg-transparent"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Categoria</label>
                <select
                  value={scanResult?.category || 'alimentos'}
                  onChange={(e) => setScanResult(prev => prev ? { ...prev, category: e.target.value } : null)}
                  className="w-full text-lg text-gray-700 border border-gray-300 rounded-lg px-3 py-2 focus:border-green-500 focus:outline-none bg-white"
                >
                  <option value="alimentos">🍎 Alimentos</option>
                  <option value="bebidas">🥤 Bebidas</option>
                  <option value="limpeza">🧹 Limpeza</option>
                  <option value="higiene">🧼 Higiene</option>
                </select>
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <label className="text-xs font-bold text-gray-400 uppercase">Descrição Automática</label>
              <textarea
                value={scanResult?.description}
                onChange={(e) => setScanResult(prev => prev ? { ...prev, description: e.target.value } : null)}
                rows={3}
                className="w-full text-sm text-gray-600 border border-gray-200 rounded-lg p-3 focus:border-green-500 focus:outline-none bg-gray-50"
              />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3 mb-20">
          <Database className="text-blue-600 shrink-0 mt-1" size={20} />
          <div>
            <h4 className="font-bold text-blue-800 text-sm">Integração Ativa</h4>
            <p className="text-xs text-blue-600 mt-1">
              Ao salvar, a imagem e o preço serão atualizados automaticamente no e-commerce.
            </p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg z-20">
        <button
          onClick={saveProduct}
          disabled={isSaving}
          className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg shadow-green-200 shadow-lg hover:bg-green-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Check className="w-6 h-6" />
              Confirmar e Atualizar Site
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <main className="h-screen w-full max-w-md mx-auto bg-white shadow-2xl overflow-hidden relative">
      {view === AppView.DASHBOARD && renderDashboard()}
      {view === AppView.CAMERA && (
        <CameraCapture
          onCapture={handleCapture}
          onClose={() => setView(AppView.DASHBOARD)}
        />
      )}
      {view === AppView.PREVIEW && renderPreview()}
      {view === AppView.PROCESSING && renderProcessing()}
      {view === AppView.RESULT && renderResult()}
    </main>
  );
}