import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { Plus, Minus, ShoppingCart, X, Star, Heart, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface ProductDetailsModalProps {
    product: Product | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// Helper to generate description if missing
const getDescription = (product: Product) => {
    if (product.description) return product.description;

    const baseDescriptions: Record<string, string[]> = {
        alimentos: [
            `Uma opção deliciosa de ${product.name} para sua mesa.`,
            `Qualidade superior em ${product.name}, ideal para o dia a dia.`,
            `Sabor autêntico e frescor garantido.`
        ],
        bebidas: [
            `Refresque seu dia com ${product.name}.`,
            `O sabor ideal para acompanhar suas refeições.`,
            `Bebida selecionada para momentos especiais.`
        ],
        higiene: [
            `Cuidado e proteção com ${product.name}.`,
            `Essencial para sua rotina de cuidados pessoais.`,
            `Qualidade e eficiência em higiene.`
        ],
        limpeza: [
            `Mantenha sua casa brilhando com ${product.name}.`,
            `Eficiência máxima na limpeza.`
        ]
    };

    const categoryDescriptions = baseDescriptions[product.category] || baseDescriptions['alimentos'];
    const index = product.name.length % categoryDescriptions.length;
    return categoryDescriptions[index];
};

export function ProductDetailsModal({ product, open, onOpenChange }: ProductDetailsModalProps) {
    const { items, addItem, removeItem } = useCart();
    const [isFavorite, setIsFavorite] = useState(false);

    // Load favorite state
    useEffect(() => {
        if (product) {
            const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
            setIsFavorite(favorites.includes(product.id));
        }
    }, [product, open]);

    const toggleFavorite = () => {
        if (!product) return;

        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        let newFavorites;

        if (favorites.includes(product.id)) {
            newFavorites = favorites.filter((id: string) => id !== product.id);
            setIsFavorite(false);
            toast.success('Removido dos favoritos');
        } else {
            newFavorites = [...favorites, product.id];
            setIsFavorite(true);
            toast.success('Adicionado aos favoritos ❤️');
        }

        localStorage.setItem('favorites', JSON.stringify(newFavorites));
    };

    if (!product) return null;

    const cartItem = items.find((item) => item.id === product.id);
    const quantity = cartItem?.quantity || 0;
    const total = product.price * quantity;
    const description = getDescription(product);

    const handleAddToCart = () => {
        addItem(product);
        toast.success(`Adicionado à cesta: ${product.name}`);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* Added [&>button]:hidden to hide the default ShadCN close button */}
            <DialogContent className="sm:max-w-[400px] p-0 overflow-visible border-none bg-transparent shadow-none [&>button]:hidden">

                <div className="bg-background rounded-[2rem] shadow-2xl overflow-hidden relative border border-white/10 dark:border-white/5 ring-1 ring-black/5 mx-4 sm:mx-0">

                    {/* Header Background Pattern */}
                    <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-background relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/40 to-transparent dark:from-white/10" />
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
                        <div className="absolute -left-10 top-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
                    </div>

                    {/* Custom Close Button */}
                    <DialogClose className="absolute right-4 top-4 z-50 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 p-2 transition-all backdrop-blur-sm">
                        <X className="h-5 w-5 text-muted-foreground" />
                        <span className="sr-only">Fechar</span>
                    </DialogClose>

                    <div className="px-6 pb-8 -mt-20 relative">
                        {/* Floating Product Image */}
                        <div className="relative mb-6 flex justify-center">
                            <div className="w-40 h-40 rounded-full p-1.5 bg-background shadow-xl ring-4 ring-background/50 relative z-10">
                                <div className="w-full h-full rounded-full overflow-hidden bg-muted relative group">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                </div>
                                {/* Category Badge Floating */}
                                <div className="absolute bottom-0 right-0 translate-x-1/4 -translate-y-1/4">
                                    <Badge className="bg-primary hover:bg-primary text-primary-foreground shadow-lg border-2 border-background px-3 py-1 text-xs rounded-full capitalize">
                                        {product.category}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Product Info */}
                        <div className="text-center space-y-2 mb-8">
                            <h2 className="text-2xl font-bold leading-tight tracking-tight text-foreground">
                                {product.name}
                            </h2>
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                <span className="bg-secondary/50 px-2 py-0.5 rounded-md text-xs font-medium">
                                    {product.unit}
                                </span>
                                <span>•</span>
                                <div className="flex items-center text-amber-500 text-xs font-medium">
                                    <Star className="w-3 h-3 mr-1 fill-amber-500" />
                                    4.8 (120)
                                </div>
                            </div>
                            <p className="text-muted-foreground text-sm leading-relaxed max-w-[280px] mx-auto pt-2">
                                {description}
                            </p>
                        </div>

                        {/* Price & Actions Card */}
                        <div className="bg-secondary/30 rounded-2xl p-4 backdrop-blur-sm border border-border/50">

                            <div className="flex items-center justify-between mb-4 px-2">
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Preço</span>
                                    <div className="flex items-baseline text-primary">
                                        <span className="text-lg font-bold">R$</span>
                                        <span className="text-3xl font-extrabold tracking-tighter ml-1">
                                            {product.price.toFixed(2).replace('.', ',')}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {/* Like Button */}
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={toggleFavorite}
                                        className={cn(
                                            "rounded-full bg-background/50 hover:bg-background transition-colors h-10 w-10",
                                            isFavorite ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-red-500"
                                        )}
                                    >
                                        <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
                                    </Button>
                                    {/* Share Button (Visual Only) */}
                                    <Button size="icon" variant="ghost" className="rounded-full bg-background/50 hover:bg-background text-muted-foreground hover:text-blue-500 transition-colors h-10 w-10">
                                        <Share2 className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>

                            {quantity === 0 ? (
                                <Button
                                    size="lg"
                                    onClick={handleAddToCart}
                                    className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary text-primary-foreground"
                                >
                                    <ShoppingCart className="h-5 w-5 mr-2" />
                                    Adicionar à Cesta
                                </Button>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between bg-background rounded-xl p-1.5 shadow-sm border border-border/50">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => removeItem(product.id)}
                                            className="h-11 w-11 rounded-lg hover:bg-secondary text-destructive hover:text-destructive transition-colors"
                                        >
                                            <Minus className="h-5 w-5" />
                                        </Button>
                                        <div className="flex flex-col items-center leading-none px-4">
                                            <span className="text-2xl font-black tabular-nums text-foreground">
                                                {quantity}
                                            </span>
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                                                Unid
                                            </span>
                                        </div>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => addItem(product)}
                                            className="h-11 w-11 rounded-lg hover:bg-secondary text-primary hover:text-primary transition-colors"
                                        >
                                            <Plus className="h-5 w-5" />
                                        </Button>
                                    </div>
                                    <div className="flex justify-center items-center gap-2 pt-1 text-sm bg-primary/10 rounded-lg py-2 text-primary font-medium">
                                        <span>Total:</span>
                                        <span className="font-bold">R$ {total.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
