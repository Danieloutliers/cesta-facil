import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product } from '@/types';
import { useCategories, useSubcategories } from '@/hooks/useData';
import { ProductPriceHistory } from '@/components/admin/ProductPriceHistory';
import { Search, ExternalLink, Package, DollarSign, Image as ImageIcon } from 'lucide-react';


interface ProductFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product?: Product | null;
    onSave: (product: Omit<Product, 'id'> | Product) => Promise<void>;
    defaultProfitMargin: number;
}

export function ProductFormDialog({ open, onOpenChange, product, onSave, defaultProfitMargin }: ProductFormDialogProps) {
    const { categories } = useCategories();
    const { subcategories } = useSubcategories();
    const [formData, setFormData] = useState<Omit<Product, 'id'>>({
        name: '',
        price: 0,
        cost_price: 0,
        image: '',
        category: 'alimentos',
        unit: '',
        description: '',
        subcategory_id: undefined,
    });
    const [margin, setMargin] = useState<number>(0);
    const [loading, setLoading] = useState(false);

    // Update form data and calculations when product/open changes
    useEffect(() => {
        if (open) {
            if (product) {
                // Edit mode
                const currentPrice = product.price || 0;
                let currentCost = product.cost_price || 0;
                let currentMargin = 0;

                if (currentCost > 0) {
                    currentMargin = ((currentPrice - currentCost) / currentCost) * 100;
                } else {
                    currentCost = currentPrice;
                    currentMargin = 0;
                }

                setFormData({
                    name: product.name,
                    price: currentPrice,
                    cost_price: Number(currentCost.toFixed(2)),
                    image: product.image,
                    category: product.category,
                    unit: product.unit,
                    description: product.description || '',
                    subcategory_id: product.subcategory_id,
                });
                setMargin(Number(currentMargin.toFixed(2)));
            } else {
                // New mode
                setFormData({
                    name: '',
                    price: 0,
                    cost_price: 0,
                    image: '',
                    category: 'alimentos',
                    unit: '',
                    description: '',
                    subcategory_id: undefined,
                });
                setMargin(defaultProfitMargin);
            }
        }
    }, [product, open, defaultProfitMargin]);

    // Calculation Handlers
    const handleCostChange = (value: string) => {
        const cost = parseFloat(value) || 0;
        const price = cost * (1 + margin / 100);

        setFormData(prev => ({
            ...prev,
            cost_price: cost,
            price: Number(price.toFixed(2))
        }));
    };

    const handleMarginChange = (value: string) => {
        const newMargin = parseFloat(value) || 0;
        setMargin(newMargin);
        const cost = formData.cost_price || 0;
        const price = cost * (1 + newMargin / 100);

        setFormData(prev => ({
            ...prev,
            price: Number(price.toFixed(2))
        }));
    };

    const handlePriceChange = (value: string) => {
        const price = parseFloat(value) || 0;
        const cost = formData.cost_price || 0;

        setFormData(prev => ({ ...prev, price: price }));

        if (cost > 0) {
            const newMargin = ((price - cost) / cost) * 100;
            setMargin(Number(newMargin.toFixed(2)));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (product) {
                await onSave({ ...formData, id: product.id } as Product);
            } else {
                await onSave(formData);
            }
            onOpenChange(false);
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Erro ao salvar produto');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">{product ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
                    <DialogDescription>
                        Preencha as informações abaixo para {product ? 'editar o' : 'adicionar um novo'} produto.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Grid Layout - Two columns */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Basic Info */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b">
                                <Package className="h-4 w-4 text-primary" />
                                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Informações Básicas</h3>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Nome do Produto</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Arroz Integral 1kg"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="unit">Unidade</Label>
                                    <Input
                                        id="unit"
                                        placeholder="1kg, 500ml..."
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category">Categoria</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) => setFormData({
                                            ...formData,
                                            category: value as Product['category'],
                                            subcategory_id: undefined
                                        })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.filter(c => c.id !== 'todos').map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id}>
                                                    {cat.icon} {cat.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subcategory">Subcategoria (Opcional)</Label>
                                <Select
                                    value={formData.subcategory_id || "none"}
                                    onValueChange={(value) => setFormData({ ...formData, subcategory_id: value === "none" ? undefined : value })}
                                    disabled={!formData.category}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Nenhuma" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhuma</SelectItem>
                                        {subcategories
                                            .filter(sub => sub.category_id === formData.category)
                                            .map((sub) => (
                                                <SelectItem key={sub.id} value={sub.id}>
                                                    {sub.label}
                                                </SelectItem>
                                            ))
                                        }
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Detalhes sobre o produto..."
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    className="resize-none"
                                />
                            </div>
                        </div>

                        {/* Right Column - Pricing & Image */}
                        <div className="space-y-4">
                            {/* Pricing Section */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 pb-2 border-b">
                                    <DollarSign className="h-4 w-4 text-primary" />
                                    <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Precificação</h3>
                                </div>

                                <div className="grid grid-cols-3 gap-3 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="cost_price" className="text-xs text-muted-foreground">Custo</Label>
                                        <Input
                                            id="cost_price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.cost_price || ''}
                                            onChange={(e) => handleCostChange(e.target.value)}
                                            placeholder="0.00"
                                            className="h-9 bg-background"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="margin" className="text-xs text-muted-foreground">Margem</Label>
                                        <div className="relative">
                                            <Input
                                                id="margin"
                                                type="number"
                                                step="0.1"
                                                value={margin}
                                                onChange={(e) => handleMarginChange(e.target.value)}
                                                className="h-9 pr-6 bg-background"
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">%</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="price" className="text-xs font-bold text-primary">Venda</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            step="0.01"
                                            value={formData.price}
                                            onChange={(e) => handlePriceChange(e.target.value)}
                                            required
                                            className="h-9 font-bold bg-background border-primary/50"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Image Section */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 pb-2 border-b">
                                    <ImageIcon className="h-4 w-4 text-primary" />
                                    <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Imagem</h3>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="image">URL da Imagem</Label>
                                    <Input
                                        id="image"
                                        type="url"
                                        placeholder="https://exemplo.com/imagem.jpg"
                                        value={formData.image}
                                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                        required
                                    />
                                    {formData.name && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full h-auto py-2 px-3 whitespace-normal text-left flex items-start gap-2 bg-blue-50/50 hover:bg-blue-50 hover:text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:hover:bg-blue-950/30 dark:border-blue-900"
                                            onClick={() => window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(formData.name)}`, '_blank')}
                                        >
                                            <Search className="h-4 w-4 mt-0.5 shrink-0" />
                                            <span className="flex-1 text-xs">
                                                Buscar <strong>"{formData.name}"</strong> no Google Imagens
                                            </span>
                                            <ExternalLink className="h-3 w-3 mt-0.5 shrink-0 opacity-50" />
                                        </Button>
                                    )}
                                </div>

                                {formData.image && (
                                    <div className="relative w-full h-48 rounded-xl border-2 border-dashed border-border/50 bg-muted/30 overflow-hidden group">
                                        <img
                                            src={formData.image}
                                            alt="Preview"
                                            className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Erro+na+Imagem';
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Price History - Full Width */}
                    {product?.id && (
                        <div className="pt-4 border-t">
                            <ProductPriceHistory productId={product.id} />
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
