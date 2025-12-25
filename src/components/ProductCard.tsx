import { Plus, Minus, ShoppingBasket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { items, addItem, removeItem } = useCart();
  const cartItem = items.find((item) => item.id === product.id);
  const quantity = cartItem?.quantity || 0;

  return (
    <div className={cn(
      "group relative bg-card rounded-3xl border border-border/50 overflow-hidden transition-all duration-300",
      "hover:shadow-xl hover:-translate-y-1 hover:border-primary/20",
      quantity > 0 ? "border-primary/50 shadow-md ring-1 ring-primary/20" : "shadow-sm"
    )}>
      {/* Image Container */}
      <div className="aspect-square overflow-hidden bg-secondary/30 relative">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Ingredient/Unit Badge */}
        <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-muted-foreground border border-border/50 shadow-sm">
          {product.unit}
        </div>

        {/* Quantity Badge on Image */}
        {quantity > 0 && (
          <div className="absolute top-3 right-3 bg-primary text-primary-foreground h-7 w-7 flex items-center justify-center rounded-full text-xs font-bold shadow-lg animate-scale-in">
            {quantity}
          </div>
        )}

        {/* Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-foreground line-clamp-2 mb-2 min-h-[2.5rem] text-base group-hover:text-primary transition-colors duration-200">
          {product.name}
        </h3>

        <div className="flex items-end justify-between gap-2">
          <div className="flex flex-col shrink-0">
            <span className="text-xs text-muted-foreground">Preço unitário</span>
            <p className="text-xl font-bold text-primary whitespace-nowrap">
              R$ {product.price.toFixed(2).replace('.', ',')}
            </p>
          </div>

          {quantity === 0 ? (
            <Button
              size="sm"
              onClick={() => addItem(product)}
              className="rounded-full h-10 w-10 p-0 shadow-md hover:scale-105 transition-transform duration-200 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-6 w-6" />
              <span className="sr-only">Adicionar</span>
            </Button>
          ) : (
            <div className="flex items-center bg-secondary rounded-full p-1 shadow-inner">
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => removeItem(product.id)}
                className="rounded-full h-8 w-8 hover:bg-background hover:text-destructive hover:shadow-sm transition-all"
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="w-8 text-center font-bold text-sm tabular-nums">
                {quantity}
              </span>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => addItem(product)}
                className="rounded-full h-8 w-8 hover:bg-primary hover:text-primary-foreground hover:shadow-sm transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
