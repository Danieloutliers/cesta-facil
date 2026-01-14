import { useState, useMemo, useEffect } from 'react';
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
import { useProducts, useCategories, useSubcategories, seedDatabase } from '@/hooks/useData';
import { MobileNavBar } from '@/components/MobileNavBar'; // Import added

const MontarCesta = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { budget } = useCart();

  const { products, loading: loadingProducts, refetch } = useProducts();
  const { categories, loading: loadingCategories } = useCategories();
  const { subcategories, loading: loadingSubcategories } = useSubcategories();

  // Reset selected subcategory when main category changes
  useEffect(() => {
    setSelectedSubcategory(null);
  }, [selectedCategory]);

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

  const filteredSubcategories = useMemo(() => {
    if (selectedCategory === 'todos') return [];
    return subcategories.filter(sub => sub.category_id === selectedCategory);
  }, [subcategories, selectedCategory]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'todos' || product.category === selectedCategory;
      const matchesSubcategory = !selectedSubcategory || product.subcategory_id === selectedSubcategory;

      return matchesSearch && matchesCategory && matchesSubcategory;
    });
  }, [products, searchQuery, selectedCategory, selectedSubcategory]);

  const isLoading = loadingProducts || loadingCategories || loadingSubcategories;

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
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md py-3 -mx-4 px-4 shadow-sm mb-6 border-b border-border/40 md:static md:shadow-none md:p-0 md:bg-transparent md:mx-0 md:border-0 transition-all">
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

          {/* Categories Scroll Area */}
          <div
            id="categories-container"
            className="flex overflow-x-auto pb-2 gap-2 snap-x hide-scrollbar"
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
          </div>

          {/* Subcategories Scroll Area (Only nice if category selected and has subcategories) */}
          {filteredSubcategories.length > 0 && (
            <div
              className="flex overflow-x-auto pb-2 gap-2 snap-x hide-scrollbar mt-2 border-t border-border/50 pt-2 animate-in fade-in slide-in-from-top-2"
            >
              <Button
                variant={selectedSubcategory === null ? 'outline' : 'ghost'}
                size="sm"
                onClick={() => setSelectedSubcategory(null)}
                className={cn(
                  "snap-start shrink-0 rounded-full h-7 px-3 text-[10px] font-medium transition-all border",
                  selectedSubcategory === null
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "text-muted-foreground border-transparent hover:bg-secondary"
                )}
              >
                Todos
              </Button>
              {filteredSubcategories.map((sub) => (
                <Button
                  key={sub.id}
                  variant={selectedSubcategory === sub.id ? 'outline' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedSubcategory(sub.id)}
                  className={cn(
                    "snap-start shrink-0 rounded-full h-7 px-3 text-[10px] font-medium transition-all border",
                    selectedSubcategory === sub.id
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "text-muted-foreground border-transparent hover:bg-secondary"
                  )}
                >
                  {sub.label}
                </Button>
              ))}
            </div>
          )}
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
            {filteredProducts.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <p>Nenhum produto encontrado nesta categoria.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <div className="pb-32 md:pb-6">
        <Footer />
      </div>

      <CartPanel />
      <MobileNavBar />
    </div>
  );
};

export default MontarCesta;
