import { Plus, Minus } from 'lucide-react';
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
      "group relative bg-card rounded-2xl border overflow-hidden transition-all duration-300",
      quantity > 0 ? "border-primary/30 shadow-card" : "border-border/40 hover:border-primary/20 hover:shadow-card"
    )}>
      {/* Image Container */}
      <div className="aspect-square overflow-hidden bg-secondary/20 relative">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Unit Badge */}
        <div className="absolute top-2 left-2 bg-background/95 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-medium text-muted-foreground">
          {product.unit}
        </div>

        {/* Quantity Badge */}
        {quantity > 0 && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold shadow-sm">
            {quantity}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground line-clamp-2 mb-3 min-h-[2.5rem] text-sm leading-tight">
          {product.name}
        </h3>

        {/* Price */}
        <div className="mb-3">
          <p className="text-xl font-bold text-primary">
            R$ {product.price.toFixed(2).replace('.', ',')}
          </p>
        </div>

        {/* Actions */}
        <div className="w-full">
          {quantity === 0 ? (
            <Button
              size="sm"
              onClick={() => addItem(product)}
              className="w-full rounded-xl h-9 font-medium"
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          ) : (
            <div className="flex items-center justify-between w-full bg-secondary/50 rounded-xl p-0.5">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeItem(product.id)}
                className="rounded-lg h-8 w-8 hover:bg-background hover:text-destructive"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="flex-1 text-center font-semibold text-sm tabular-nums">
                {quantity}
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => addItem(product)}
                className="rounded-lg h-8 w-8 hover:bg-primary hover:text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
