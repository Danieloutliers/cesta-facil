import { useState, useMemo, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { budget } = useCart();

  const { products, loading: loadingProducts, refetch } = useProducts();
  const { categories, loading: loadingCategories } = useCategories();

  // Hide/Show Header based on sticky bar position
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Header visível apenas no topo (antes da sticky bar grudar)
          if (currentScrollY < 150) {
            setShowHeader(true);
          } else {
            setShowHeader(false);
          }

          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      {/* Sticky Header with auto-hide */}
      <div
        className={cn(
          "sticky top-0 z-50 transition-transform duration-300",
          !showHeader && "-translate-y-full"
        )}
      >
        <Header />
      </div>

      <main className="container px-4 md:px-6 py-6 pb-40 md:pb-32">
        {/* Banner */}
        <div className="mb-6">
          <PromoBanner />
        </div>

        {/* Sticky Search Input & Categories - Agora juntos como barra fixa */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md py-3 -mx-4 px-4 shadow-sm mb-6 border-b border-border/40 md:static md:shadow-none md:p-0 md:bg-transparent md:mx-0 md:border-0">
          {/* Search */}
          <div className="w-full relative max-w-2xl mx-auto mb-3">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="text"
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-11 text-sm rounded-xl bg-background border-input focus-visible:ring-primary focus-visible:border-primary transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Categories Scroll Area (Horizontal Snap) */}
          {/* Categories Scroll Area (Horizontal Snap) */}
          <div className="relative group/categories">
            {/* Left Scroll Gradient & Button */}
            <div className="absolute left-0 top-0 bottom-2 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none md:hidden" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20 hidden md:flex">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full bg-background/80 hover:bg-background shadow-sm border border-border opacity-0 group-hover/categories:opacity-100 transition-opacity"
                onClick={() => {
                  const container = document.getElementById('categories-container');
                  if (container) container.scrollBy({ left: -200, behavior: 'smooth' });
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            {/* Scroll Container */}
            <div
              id="categories-container"
              className="flex overflow-x-auto pb-2 gap-2 snap-x hide-scrollbar px-1"
            >
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'secondary'}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "snap-start shrink-0 rounded-full h-8 px-3 text-xs font-medium transition-all",
                    selectedCategory === category.id
                      ? "shadow-md scale-105"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <span className="mr-1.5 text-sm">{category.icon}</span>
                  {category.label}
                </Button>
              ))}
              {/* Padding-right spacer to ensure last item is not cut off by gradient */}
              <div className="w-8 shrink-0 md:hidden" />
            </div>

            {/* Right Scroll Gradient & Button */}
            <div className="absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none flex items-center justify-end pr-2 md:hidden">
              <ChevronRight className="h-5 w-5 text-muted-foreground animate-pulse" />
            </div>

            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20 hidden md:flex">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full bg-background/80 hover:bg-background shadow-sm border border-border opacity-0 group-hover/categories:opacity-100 transition-opacity"
                onClick={() => {
                  const container = document.getElementById('categories-container');
                  if (container) container.scrollBy({ left: 200, behavior: 'smooth' });
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
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
