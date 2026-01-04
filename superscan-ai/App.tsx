import React, { useState, useEffect } from 'react';
import { Camera, Sparkles, CheckCircle, XCircle, Edit2, Loader2, Plus, Check, Upload, Database, Home, WifiOff, RefreshCw, ChevronDown, ChevronUp, Trash2, Pencil } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import imageCompression from 'browser-image-compression';
import { AppView, Product, ScannedData } from './types';
import { CameraCapture } from './components/CameraCapture';
import { ImageEditor } from './components/ImageEditor';
import { Statistics } from './components/Statistics';
import { analyzeProductImage } from './services/geminiService';
import { supabase, PRODUCT_BUCKET } from './services/supabase';
import { saveProductOffline, getPendingProducts, syncPendingProducts, isOnline } from './utils/offline';
import { exportToCSV } from './utils/export';

export default function App() {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scanResult, setScanResult] = useState<ScannedData | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [online, setOnline] = useState(isOnline());
  const [pendingCount, setPendingCount] = useState(0);
  const [duplicateProduct, setDuplicateProduct] = useState<Product | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // States for animation simulation
  const [processingStep, setProcessingStep] = useState<string>('');

  useEffect(() => {
    fetchProducts();
    updatePendingCount();

    // Monitor online/offline status
    const handleOnline = () => {
      setOnline(true);
      toast.success('Conexão restaurada!');
      handleSync();
    };
    const handleOffline = () => {
      setOnline(false);
      toast.warning('Modo offline ativado');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
      } else {
        console.log('Produtos carregados:', data?.length, data);
        setProducts(data || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  const handleCapture = async (imageSrc: string) => {
    try {
      // Compress image before processing
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      };

      const compressedFile = await imageCompression(file, options);
      const compressedBase64 = await imageCompression.getDataUrlFromFile(compressedFile);

      setCurrentImage(compressedBase64);
      setView(AppView.PREVIEW);
      toast.success('Foto capturada com sucesso!');
    } catch (error) {
      console.error('Error compressing image:', error);
      toast.error('Erro ao processar imagem');
    }
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

      const fileName = `${Math.random().toString(36).substring(2)}.jpg`;
      const filePath = `products/${fileName}`; // Mesmo caminho do admin

      const { data, error } = await supabase.storage
        .from(PRODUCT_BUCKET)
        .upload(filePath, blob, {
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
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const updatePendingCount = async () => {
    try {
      const pending = await getPendingProducts();
      setPendingCount(pending.length);
    } catch (error) {
      console.error('Error getting pending products:', error);
    }
  };

  const handleSync = async () => {
    if (!online) {
      toast.error('Sem conexão com a internet');
      return;
    }

    const pending = await getPendingProducts();
    if (pending.length === 0) {
      toast.info('Nenhum produto pendente para sincronizar');
      return;
    }

    toast.loading(`Sincronizando ${pending.length} produto(s)...`, { id: 'sync' });

    try {
      const { success, failed } = await syncPendingProducts(supabase);

      if (failed > 0) {
        toast.error(`${failed} produto(s) falharam na sincronização`, { id: 'sync' });
      } else {
        toast.success(`${success} produto(s) sincronizados!`, { id: 'sync' });
      }

      await updatePendingCount();
      await fetchProducts();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Erro ao sincronizar', { id: 'sync' });
    }
  };

  const checkForDuplicate = async (productName: string): Promise<Product | null> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .ilike('name', productName)
        .limit(1);

      if (error) {
        console.error('Error checking duplicate:', error);
        return null;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error in checkForDuplicate:', error);
      return null;
    }
  };

  const saveProduct = async (forceAction?: 'add' | 'update') => {
    if (!scanResult || !currentImage) return;

    setIsSaving(true);

    try {
      // Check for duplicate unless forceAction is set
      if (!forceAction && online) {
        const duplicate = await checkForDuplicate(scanResult.name);
        if (duplicate) {
          setDuplicateProduct(duplicate);
          setShowDuplicateDialog(true);
          setIsSaving(false);
          return;
        }
      }

      // If offline, save to IndexedDB
      if (!online) {
        await saveProductOffline({
          name: scanResult.name,
          price: scanResult.price,
          category: scanResult.category.toLowerCase(),
          image: currentImage,
          unit: scanResult.unit || 'un',
        });

        await updatePendingCount();
        toast.success('Produto salvo offline! Será sincronizado quando voltar online.');
        setView(AppView.DASHBOARD);
        setCurrentImage(null);
        setScanResult(null);
        setIsSaving(false);
        return;
      }
      // 1. Upload Image
      const imageUrl = await uploadImage(currentImage);

      if (!imageUrl) {
        toast.error('Erro ao fazer upload da imagem');
        setIsSaving(false);
        return;
      }

      // 2. Insert to Database
      // Garantir que a categoria seja válida
      const validCategories = ['alimentos', 'bebidas', 'limpeza', 'higiene'];
      let categoryToSave = scanResult.category.toLowerCase().trim();

      // Se a categoria não for válida, tentar mapear
      if (!validCategories.includes(categoryToSave)) {
        // Mapeamentos comuns
        if (categoryToSave.includes('aliment') || categoryToSave.includes('comida')) categoryToSave = 'alimentos';
        else if (categoryToSave.includes('bebida') || categoryToSave.includes('drink')) categoryToSave = 'bebidas';
        else if (categoryToSave.includes('limpeza') || categoryToSave.includes('cleaning')) categoryToSave = 'limpeza';
        else if (categoryToSave.includes('higiene') || categoryToSave.includes('hygiene')) categoryToSave = 'higiene';
        else categoryToSave = 'alimentos'; // Default para alimentos
      }

      const newProduct = {
        name: scanResult.name,
        price: scanResult.price,
        category: categoryToSave,
        image: imageUrl,
        unit: scanResult.unit || 'un',
      };

      let error;

      if (forceAction === 'update' && duplicateProduct) {
        // Update existing product
        const result = await supabase
          .from('products')
          .update(newProduct)
          .eq('id', duplicateProduct.id);
        error = result.error;
      } else {
        // Insert new product
        const result = await supabase
          .from('products')
          .insert([newProduct]);
        error = result.error;
      }

      if (error) {
        console.error('Error saving product:', error);
        toast.error(`Erro ao salvar: ${error.message}`);
        setIsSaving(false);
        return;
      }

      // 3. Refresh and Redirect
      await fetchProducts();
      const message = forceAction === 'update' ? 'Produto atualizado! ✨' : 'Produto salvo com sucesso! 🎉';
      toast.success(message);
      setView(AppView.DASHBOARD);
      setCurrentImage(null);
      setScanResult(null);
      setDuplicateProduct(null);

    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const deleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('Error deleting product:', error);
        toast.error('Erro ao deletar produto');
      } else {
        toast.success('Produto deletado com sucesso!');
        fetchProducts();
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Erro ao deletar produto');
    } finally {
      setProductToDelete(null);
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
        <div className="flex items-center gap-2">
          {!online && (
            <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs">
              <WifiOff size={12} />
              Offline
            </div>
          )}
          {pendingCount > 0 && (
            <button
              onClick={handleSync}
              className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs"
            >
              <RefreshCw size={12} />
              {pendingCount}
            </button>
          )}
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
            JD
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-xl p-4 text-white shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-semibold text-lg mb-1">Status do Sistema</h2>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <div className="w-2 h-2 bg-green-200 rounded-full animate-pulse" />
                Banco de dados conectado
              </div>
              <p className="mt-4 text-2xl font-bold">{products.length} Produtos</p>
              <p className="text-xs opacity-75">Sincronizados recentemente</p>
            </div>
            <button
              onClick={() => setShowStatistics(true)}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              📊 Ver Stats
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center mt-6">
          <h3 className="font-semibold text-gray-700">Últimas Atualizações</h3>
          {products.length > 0 && (
            <button
              onClick={() => {
                exportToCSV(products);
                toast.success('Catálogo exportado!');
              }}
              className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors"
            >
              📥 Exportar CSV
            </button>
          )}
        </div>
        <div className="space-y-4">
          {products.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nenhum produto cadastrado.</p>
          ) : (
            <>
              {/* Alimentos */}
              {products.filter(p => p.category === 'alimentos').length > 0 && (
                <div>
                  <button
                    onClick={() => toggleCategory('alimentos')}
                    className="w-full text-left text-sm font-bold text-gray-600 mb-2 flex items-center justify-between gap-2 hover:text-gray-800 transition-colors p-2 rounded-lg hover:bg-gray-50"
                  >
                    <span>🍎 Alimentos ({products.filter(p => p.category === 'alimentos').length})</span>
                    {expandedCategories['alimentos'] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {expandedCategories['alimentos'] && (
                    <div className="space-y-2">
                      {products.filter(p => p.category === 'alimentos').map(product => (
                        <div key={product.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex gap-3 group">
                          <div className="w-20 h-20 rounded-md overflow-hidden bg-gray-100 relative group">
                            <img
                              src={product.image || 'https://via.placeholder.com/150'}
                              alt={product.name}
                              className="w-full h-full object-cover transition-all duration-500"
                            />
                          </div>
                          <div className="flex-1 flex flex-col justify-between min-w-0">
                            <div>
                              <h4 className="font-medium text-gray-800 line-clamp-2 leading-tight">{product.name}</h4>
                              <p className="text-xs text-gray-500 mt-1">{product.unit || 'un'}</p>
                            </div>
                            <div className="flex justify-between items-end">
                              <span className="font-bold text-lg text-green-700">R$ {product.price.toFixed(2)}</span>
                              <span className="text-[10px] text-gray-400">
                                {product.created_at ? new Date(product.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setProductToDelete(product)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Deletar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Bebidas */}
              {products.filter(p => p.category === 'bebidas').length > 0 && (
                <div>
                  <button
                    onClick={() => toggleCategory('bebidas')}
                    className="w-full text-left text-sm font-bold text-gray-600 mb-2 flex items-center justify-between gap-2 hover:text-gray-800 transition-colors p-2 rounded-lg hover:bg-gray-50"
                  >
                    <span>🥤 Bebidas ({products.filter(p => p.category === 'bebidas').length})</span>
                    {expandedCategories['bebidas'] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {expandedCategories['bebidas'] && (
                    <div className="space-y-2">
                      {products.filter(p => p.category === 'bebidas').map(product => (
                        <div key={product.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex gap-3 group">
                          <div className="w-20 h-20 rounded-md overflow-hidden bg-gray-100 relative group">
                            <img
                              src={product.image || 'https://via.placeholder.com/150'}
                              alt={product.name}
                              className="w-full h-full object-cover transition-all duration-500"
                            />
                          </div>
                          <div className="flex-1 flex flex-col justify-between min-w-0">
                            <div>
                              <h4 className="font-medium text-gray-800 line-clamp-2 leading-tight">{product.name}</h4>
                              <p className="text-xs text-gray-500 mt-1">{product.unit || 'un'}</p>
                            </div>
                            <div className="flex justify-between items-end">
                              <span className="font-bold text-lg text-green-700">R$ {product.price.toFixed(2)}</span>
                              <span className="text-[10px] text-gray-400">
                                {product.created_at ? new Date(product.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setProductToDelete(product)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Deletar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Limpeza */}
              {products.filter(p => p.category === 'limpeza').length > 0 && (
                <div>
                  <button
                    onClick={() => toggleCategory('limpeza')}
                    className="w-full text-left text-sm font-bold text-gray-600 mb-2 flex items-center justify-between gap-2 hover:text-gray-800 transition-colors p-2 rounded-lg hover:bg-gray-50"
                  >
                    <span>🧹 Limpeza ({products.filter(p => p.category === 'limpeza').length})</span>
                    {expandedCategories['limpeza'] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {expandedCategories['limpeza'] && (
                    <div className="space-y-2">
                      {products.filter(p => p.category === 'limpeza').map(product => (
                        <div key={product.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex gap-3 group">
                          <div className="w-20 h-20 rounded-md overflow-hidden bg-gray-100 relative group">
                            <img
                              src={product.image || 'https://via.placeholder.com/150'}
                              alt={product.name}
                              className="w-full h-full object-cover transition-all duration-500"
                            />
                          </div>
                          <div className="flex-1 flex flex-col justify-between min-w-0">
                            <div>
                              <h4 className="font-medium text-gray-800 line-clamp-2 leading-tight">{product.name}</h4>
                              <p className="text-xs text-gray-500 mt-1">{product.unit || 'un'}</p>
                            </div>
                            <div className="flex justify-between items-end">
                              <span className="font-bold text-lg text-green-700">R$ {product.price.toFixed(2)}</span>
                              <span className="text-[10px] text-gray-400">
                                {product.created_at ? new Date(product.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setProductToDelete(product)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Deletar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Higiene */}
              {products.filter(p => p.category === 'higiene').length > 0 && (
                <div>
                  <button
                    onClick={() => toggleCategory('higiene')}
                    className="w-full text-left text-sm font-bold text-gray-600 mb-2 flex items-center justify-between gap-2 hover:text-gray-800 transition-colors p-2 rounded-lg hover:bg-gray-50"
                  >
                    <span>🧼 Higiene ({products.filter(p => p.category === 'higiene').length})</span>
                    {expandedCategories['higiene'] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {expandedCategories['higiene'] && (
                    <div className="space-y-2">
                      {products.filter(p => p.category === 'higiene').map(product => (
                        <div key={product.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex gap-3 group">
                          <div className="w-20 h-20 rounded-md overflow-hidden bg-gray-100 relative group">
                            <img
                              src={product.image || 'https://via.placeholder.com/150'}
                              alt={product.name}
                              className="w-full h-full object-cover transition-all duration-500"
                            />
                          </div>
                          <div className="flex-1 flex flex-col justify-between min-w-0">
                            <div>
                              <h4 className="font-medium text-gray-800 line-clamp-2 leading-tight">{product.name}</h4>
                              <p className="text-xs text-gray-500 mt-1">{product.unit || 'un'}</p>
                            </div>
                            <div className="flex justify-between items-end">
                              <span className="font-bold text-lg text-green-700">R$ {product.price.toFixed(2)}</span>
                              <span className="text-[10px] text-gray-400">
                                {product.created_at ? new Date(product.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setProductToDelete(product)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Deletar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Outros (produtos que não se encaixam nas categorias) */}
              {products.filter(p => !['alimentos', 'bebidas', 'limpeza', 'higiene'].includes(p.category?.toLowerCase())).length > 0 && (
                <div>
                  <button
                    onClick={() => toggleCategory('outros')}
                    className="w-full text-left text-sm font-bold text-gray-600 mb-2 flex items-center justify-between gap-2 hover:text-gray-800 transition-colors p-2 rounded-lg hover:bg-gray-50"
                  >
                    <span>📦 Outros ({products.filter(p => !['alimentos', 'bebidas', 'limpeza', 'higiene'].includes(p.category?.toLowerCase())).length})</span>
                    {expandedCategories['outros'] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {expandedCategories['outros'] && (
                    <div className="space-y-2">
                      {products.filter(p => !['alimentos', 'bebidas', 'limpeza', 'higiene'].includes(p.category?.toLowerCase())).map(product => (
                        <div key={product.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex gap-3 group">
                          <div className="w-20 h-20 rounded-md overflow-hidden bg-gray-100 relative group">
                            <img
                              src={product.image || 'https://via.placeholder.com/150'}
                              alt={product.name}
                              className="w-full h-full object-cover transition-all duration-500"
                            />
                          </div>
                          <div className="flex-1 flex flex-col justify-between min-w-0">
                            <div>
                              <h4 className="font-medium text-gray-800 line-clamp-2 leading-tight">{product.name}</h4>
                              <p className="text-xs text-gray-500 mt-1">{product.category} • {product.unit || 'un'}</p>
                            </div>
                            <div className="flex justify-between items-end">
                              <span className="font-bold text-lg text-green-700">R$ {product.price.toFixed(2)}</span>
                              <span className="text-[10px] text-gray-400">
                                {product.created_at ? new Date(product.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setProductToDelete(product)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Deletar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )
          }
        </div >
      </div >

      <button
        onClick={() => setView(AppView.CAMERA)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-green-700 transition-all active:scale-95 z-50"
      >
        <Plus size={28} />
      </button>
    </div >
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
            onClick={() => setShowEditor(true)}
            className="flex-1 py-3 px-4 rounded-xl border border-green-600 text-green-600 font-semibold flex items-center justify-center gap-2"
          >
            <Edit2 size={18} /> Editar
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

            <div className="grid grid-cols-3 gap-4">
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
                <label className="text-xs font-bold text-gray-400 uppercase">Unidade</label>
                <input
                  type="text"
                  placeholder="ex: 1kg, un"
                  value={scanResult?.unit || 'un'}
                  onChange={(e) => setScanResult(prev => prev ? { ...prev, unit: e.target.value } : null)}
                  className="w-full text-lg text-gray-700 border-b border-dashed border-gray-300 focus:border-green-500 focus:outline-none py-1 bg-transparent"
                />
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
          onClick={() => saveProduct()}
          disabled={isSaving}
          className="w-full py-4 rounded-xl bg-green-600 text-white font-bold text-lg flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
      <Toaster position="top-center" richColors />
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
      {showEditor && currentImage && (
        <ImageEditor
          image={currentImage}
          onSave={(editedImage) => {
            setCurrentImage(editedImage);
            setShowEditor(false);
            toast.success('Imagem editada!');
          }}
          onCancel={() => setShowEditor(false)}
        />
      )}

      {/* Duplicate Product Dialog */}
      {showDuplicateDialog && duplicateProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Database className="text-orange-600" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Produto Já Existe!</h3>
                <p className="text-sm text-gray-500">O que deseja fazer?</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Produto encontrado:</p>
              <div className="flex items-center gap-3">
                <img
                  src={duplicateProduct.image || 'https://via.placeholder.com/80'}
                  alt={duplicateProduct.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="font-bold text-sm">{duplicateProduct.name}</p>
                  <p className="text-green-600 font-semibold">R$ {duplicateProduct.price.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{duplicateProduct.unit}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowDuplicateDialog(false);
                  saveProduct('update');
                }}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                ✨ Atualizar Produto Existente
              </button>
              <button
                onClick={() => {
                  setShowDuplicateDialog(false);
                  saveProduct('add');
                }}
                className="w-full py-3 px-4 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
              >
                ➕ Adicionar Como Novo Produto
              </button>
              <button
                onClick={() => {
                  setShowDuplicateDialog(false);
                  setDuplicateProduct(null);
                }}
                className="w-full py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Modal */}
      {showStatistics && (
        <Statistics
          products={products}
          onClose={() => setShowStatistics(false)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-2xl">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Deletar Produto</h3>
              <p className="text-sm text-gray-600 mb-5">
                Tem certeza que deseja deletar <strong>{productToDelete.name}</strong>?
                <br />
                Esta ação não pode ser desfeita.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 py-2 px-3 rounded-lg border border-gray-300 text-sm text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => deleteProduct(productToDelete.id)}
                  className="flex-1 py-2 px-3 rounded-lg bg-red-600 text-sm text-white font-semibold hover:bg-red-700 transition-colors"
                >
                  Deletar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}