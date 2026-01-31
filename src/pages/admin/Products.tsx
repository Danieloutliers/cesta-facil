import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2, Package, LayoutList, LayoutGrid, Link } from 'lucide-react';
import { useProducts, useCategories, createProduct, updateProduct, deleteProduct } from '@/hooks/useData';
import { ProductFormDialog } from '@/components/ProductFormDialog';
import { BulkUpdateDialog } from '@/components/admin/BulkUpdateDialog';
import { supabase } from '@/lib/supabase';

import { Product } from '@/types';

const Products = () => {
  const { products, loading, refetch } = useProducts();
  const { categories } = useCategories();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [defaultProfitMargin, setDefaultProfitMargin] = useState(30);
  const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'profitMargin')
        .single();
      if (data?.value) {
        setDefaultProfitMargin(Number(data.value));
      }
    };
    fetchSettings();
  }, []);

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'todos' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Group products by category
  const productsByCategory = useMemo(() => {
    const grouped: { [key: string]: Product[] } = {};

    products.forEach(product => {
      if (!grouped[product.category]) {
        grouped[product.category] = [];
      }
      grouped[product.category].push(product);
    });

    return grouped;
  }, [products]);

  const handleSave = async (productData: Omit<Product, 'id'> | Product) => {
    try {
      if ('id' in productData) {
        await updateProduct(productData.id, productData);
      } else {
        await createProduct(productData);
      }
      refetch();
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      throw error;
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir "${name}"?`)) {
      try {
        await deleteProduct(id);
        refetch();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Erro ao excluir produto');
      }
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const handleQuickImageUpdate = async (product: Product) => {
    try {
      const clipboardText = await navigator.clipboard.readText();

      if (!clipboardText) {
        alert('Área de transferência vazia!');
        return;
      }

      if (!clipboardText.startsWith('http') && !clipboardText.startsWith('data:image')) {
        alert('O texto copiado não parece ser um link válido ou uma imagem em base64.');
        return;
      }

      await updateProduct(product.id, { image: clipboardText });
      refetch();
    } catch (error) {
      console.error('Clipboard error or update failed:', error);
      // Fallback to manual input
      const newImage = prompt('Não foi possível ler a área de transferência. Cole o link aqui:', product.image);
      if (newImage && newImage !== product.image) {
        try {
          await updateProduct(product.id, { image: newImage });
          refetch();
        } catch (e) {
          alert('Erro ao atualizar imagem.');
        }
      }
    }
  };

  const ProductTable = ({ products }: { products: Product[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">Imagem</TableHead>
          <TableHead>Nome</TableHead>
          <TableHead className="hidden md:table-cell">Categoria</TableHead>
          <TableHead>Preço</TableHead>
          <TableHead>Margem</TableHead>
          <TableHead>Unidade</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
              Nenhum produto encontrado.
            </TableCell>
          </TableRow>
        ) : (
          products.map((product) => {
            const cost = product.cost_price || 0;
            const margin = cost > 0 ? ((product.price - cost) / cost) * 100 : 0;

            return (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="h-10 w-10 rounded-md overflow-hidden bg-muted">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="hidden md:table-cell capitalize">{product.category}</TableCell>
                <TableCell>R$ {product.price.toFixed(2).replace('.', ',')}</TableCell>
                <TableCell>
                  {cost > 0 ? (
                    <span className={margin < 30 ? "text-red-500 font-medium" : "text-emerald-600 font-medium"}>
                      {margin.toFixed(0)}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{product.unit}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => handleEdit(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(product.id, product.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  );

  const ProductGrid = ({ products }: { products: Product[] }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
      {products.length === 0 ? (
        <div className="col-span-full h-24 flex items-center justify-center text-muted-foreground">
          Nenhum produto encontrado.
        </div>
      ) : (
        products.map((product) => {
          const cost = product.cost_price || 0;
          const margin = cost > 0 ? ((product.price - cost) / cost) * 100 : 0;

          return (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col group">
              <div className="aspect-square relative bg-muted overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 shadow-sm"
                    onClick={() => window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(product.name)}`, '_blank')}
                    title="Buscar imagem no Google"
                  >
                    <Search className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 shadow-sm"
                    onClick={() => handleQuickImageUpdate(product)}
                    title="Colar link da imagem"
                  >
                    <Link className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 shadow-sm"
                    onClick={() => handleEdit(product)}
                    title="Editar produto"
                  >
                    <Pencil className="h-4 w-4 text-orange-600" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8 shadow-sm"
                    onClick={() => handleDelete(product.id, product.name)}
                    title="Excluir produto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-3 flex-1 flex flex-col gap-1">
                <span className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                  {categories.find(c => c.id === product.category)?.label || product.category}
                </span>
                <h3 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem]" title={product.name}>
                  {product.name}
                </h3>
                <div className="flex items-end justify-between mt-auto pt-2">
                  <div>
                    <p className="text-lg font-bold text-primary">
                      R$ {product.price.toFixed(2).replace('.', ',')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {product.unit}
                    </p>
                  </div>
                  {cost > 0 && (
                    <div className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${margin < 30 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                      {margin.toFixed(0)}%
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );

  const CurrentView = ({ products }: { products: Product[] }) => {
    return viewMode === 'list' ? <ProductTable products={products} /> : <ProductGrid products={products} />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Produtos</h2>
          <p className="text-muted-foreground">Gerencie o catálogo de produtos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBulkUpdateOpen(true)}>
            Reajustar Margens
          </Button>
          <Button onClick={handleNewProduct}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar produtos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 px-2 lg:px-3"
            onClick={() => setViewMode('list')}
          >
            <LayoutList className="h-4 w-4 mr-2" />
            <span className="hidden lg:inline">Lista</span>
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 px-2 lg:px-3"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            <span className="hidden lg:inline">Grade</span>
          </Button>
        </div>
      </div>

      {/* Category Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        {Object.entries(productsByCategory).slice(0, 3).map(([category, items]) => (
          <Card key={category}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium capitalize">{category}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{items.length}</div>
              <p className="text-xs text-muted-foreground">produtos</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs by Category */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="mb-4 flex-wrap h-auto gap-2">
          <TabsTrigger value="todos">
            Todos ({products.length})
          </TabsTrigger>
          {categories
            .filter(cat => cat.id !== 'todos')
            .map(category => (
              <TabsTrigger key={category.id} value={category.id}>
                <span className="capitalize">{category.label}</span> ({productsByCategory[category.id]?.length || 0})
              </TabsTrigger>
            ))}
        </TabsList>

        <TabsContent value="todos" className="border rounded-lg bg-background overflow-hidden mt-4">
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <CurrentView products={filteredProducts} />
          )}
        </TabsContent>

        {categories
          .filter(cat => cat.id !== 'todos')
          .map(category => (
            <TabsContent
              key={category.id}
              value={category.id}
              className="border rounded-lg bg-background overflow-hidden mt-4"
            >
              {loading ? (
                <div className="flex items-center justify-center h-24">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : (
                <CurrentView
                  products={filteredProducts.filter(p => p.category === category.id)}
                />
              )}
            </TabsContent>
          ))}
      </Tabs>

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editingProduct}
        onSave={handleSave}
        defaultProfitMargin={defaultProfitMargin}
      />

      <BulkUpdateDialog
        open={bulkUpdateOpen}
        onOpenChange={setBulkUpdateOpen}
        onSuccess={refetch}
      />
    </div>
  );
};

export default Products;
