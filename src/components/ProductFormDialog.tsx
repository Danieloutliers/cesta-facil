import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product } from '@/types';
import { useCategories, useSubcategories } from '@/hooks/useData';
import { ProductPriceHistory } from '@/components/admin/ProductPriceHistory';


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
                    // Se não tiver custo definido, assume que o custo é o preço atual (margem 0)
                    // Atendendo pedido do usuário para considerar o preço original como custo
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
                    subcategory_id: undefined,
                });
                setMargin(defaultProfitMargin); // Set default margin
            }
        }
    }, [product, open, defaultProfitMargin]);

    // Calculation Handlers
    const handleCostChange = (value: string) => {
        const cost = parseFloat(value) || 0;
        // Keep Margin, Calculate Price
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
        // Keep Cost, Calculate Price
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

        // Keep Price, Calculate Margin (if Cost exists)
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
            // Reset logic handled by useEffect on open
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Erro ao salvar produto');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{product ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    {/* Pricing Section */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg border">
                        <div className="space-y-2">
                            <Label htmlFor="cost_price" className="text-xs">Preço de Custo</Label>
                            <Input
                                id="cost_price"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.cost_price || ''}
                                onChange={(e) => handleCostChange(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="margin" className="text-xs">Margem (%)</Label>
                            <div className="relative">
                                <Input
                                    id="margin"
                                    type="number"
                                    step="0.1"
                                    value={margin}
                                    onChange={(e) => handleMarginChange(e.target.value)}
                                    className="pr-6"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="price" className="text-xs font-bold">Preço de Venda</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => handlePriceChange(e.target.value)}
                                required
                                className="font-bold"
                            />
                        </div>
                    </div>


                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="unit">Unidade</Label>
                            <Input
                                id="unit"
                                placeholder="ex: 1kg, 500ml"
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="image">URL da Imagem</Label>
                            <Input
                                id="image"
                                type="url"
                                placeholder="https://..."
                                value={formData.image}
                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                required
                            />
                        </div>
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
                                <SelectValue placeholder="Selecione uma categoria" />
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

                    <div className="space-y-2">
                        <Label htmlFor="subcategory">Subcategoria (Opcional)</Label>
                        <Select
                            value={formData.subcategory_id || "none"}
                            onValueChange={(value) => setFormData({ ...formData, subcategory_id: value === "none" ? undefined : value })}
                            disabled={!formData.category}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione uma subcategoria" />
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

                    {product?.id && (
                        <ProductPriceHistory productId={product.id} />
                    )}

                    <DialogFooter>
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
