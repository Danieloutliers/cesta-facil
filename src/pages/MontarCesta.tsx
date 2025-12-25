import { useState, useMemo } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { CartPanel } from '@/components/CartPanel';
import { useCart } from '@/contexts/CartContext';
import { products, categories } from '@/data/products';
import { cn } from '@/lib/utils';

const MontarCesta = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const { budget } = useCart();

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'todos' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 pb-32">
        {/* Title */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground rounded-full px-4 py-1 text-sm font-medium mb-4">
            🛒 Sua Cesta
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Escolha Seus Produtos
          </h1>
          <p className="text-muted-foreground">
            Monte sua cesta dentro do orçamento de{' '}
            <span className="font-semibold text-primary">R$ {budget.toFixed(2).replace('.', ',')}</span>
          </p>
        </div>

        {/* Search and Filters */}
        {/* Search and Filters */}
        <div className="flex flex-col gap-6 mb-8">
          {/* Categories */}
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="whitespace-nowrap rounded-full px-6"
              >
                <span className="mr-2">{category.icon}</span>
                {category.label}
              </Button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-xl bg-background border-border/60 focus-visible:ring-primary/20"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Nenhum produto encontrado.</p>
          </div>
        )}
      </main>

      <CartPanel />
      <Footer />
    </div>
  );
};

export default MontarCesta;
