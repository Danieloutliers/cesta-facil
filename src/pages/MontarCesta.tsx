import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { PromoBanner } from '@/components/PromoBanner';
import { CartPanel } from '@/components/CartPanel';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import { useProducts, useCategories, seedDatabase } from '@/hooks/useData';

const MontarCesta = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const { budget } = useCart();

  const { products, loading: loadingProducts, refetch } = useProducts();
  const { categories, loading: loadingCategories } = useCategories();

  const handleSeed = async () => {
    if (confirm('Deseja popular o banco de dados com os produtos padrão?')) {
      await seedDatabase();
      refetch();
    }
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'todos' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const isLoading = loadingProducts || loadingCategories;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 md:px-6 py-6 pb-40 md:pb-32">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-8">
          <div className="flex-1">
            <PromoBanner />
          </div>


          {/* Search Input */}
          <div className="w-full md:w-auto relative">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
              <Input
                type="text"
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-80 h-12 pl-12 rounded-xl bg-background border-input focus-visible:ring-primary focus-visible:border-primary transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Categories Scroll Area (Horizontal Snap) */}
        <div className="mb-8 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex overflow-x-auto pb-4 gap-2 snap-x hide-scrollbar">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'secondary'}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "snap-start shrink-0 rounded-full h-8 px-3 text-xs font-medium",
                  selectedCategory === category.id && "shadow-md"
                )}
              >
                <span className="mr-1.5 text-sm">{category.icon}</span>
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground animate-pulse font-medium">Carregando produtos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {!isLoading && filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground max-w-xs mx-auto mb-6">
              Tente buscar por outro termo ou selecione outra categoria.
            </p>
            {products.length === 0 && (
              <Button
                onClick={handleSeed}
                variant="outline"
                className="border-dashed"
              >
                Popular Banco de Dados (Seed)
              </Button>
            )}
          </div>
        )}
      </main>

      <CartPanel />
      <Footer />
    </div>
  );
};

export default MontarCesta;
