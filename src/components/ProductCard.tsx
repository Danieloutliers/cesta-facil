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
      "group relative bg-card rounded-xl border transition-all duration-300",
      quantity > 0 ? "border-primary shadow-sm" : "border-border hover:shadow-md"
    )}>
      {/* Image Container */}
      <div className="aspect-square overflow-hidden bg-muted relative rounded-t-xl">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Unit Badge */}
        <div className="absolute top-1 right-1 bg-background/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-medium text-muted-foreground shadow-sm">
          {product.unit}
        </div>

        {/* Quantity Badge */}
        {quantity > 0 && (
          <div className="absolute top-1 left-1 bg-primary text-primary-foreground h-5 w-5 flex items-center justify-center rounded-full text-[10px] font-bold shadow-sm animate-in zoom-in duration-200">
            {quantity}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2">
        <h3 className="font-medium text-foreground line-clamp-2 mb-1 min-h-[2rem] text-xs leading-tight">
          {product.name}
        </h3>

        {/* Price */}
        <div className="mb-2">
          <p className="text-[14px] font-bold text-primary">
            R$ {product.price.toFixed(2).replace('.', ',')}
          </p>
        </div>

        {/* Actions */}
        <div className="w-full">
          {quantity === 0 ? (
            <Button
              size="sm"
              onClick={() => addItem(product)}
              className="w-full h-7 text-xs rounded-lg font-medium shadow-sm active:scale-95 transition-transform px-0"
            >
              Adicionar
            </Button>
          ) : (
            <div className="flex items-center justify-between w-full bg-muted/50 rounded-lg p-0.5 border border-muted">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeItem(product.id)}
                className="h-6 w-6 rounded-md hover:bg-background hover:text-destructive text-muted-foreground transition-colors"
                aria-label="Remover"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="flex-1 text-center font-semibold text-xs tabular-nums text-foreground">
                {quantity}
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => addItem(product)}
                className="h-6 w-6 rounded-md hover:bg-background hover:text-primary text-primary transition-colors"
                aria-label="Adicionar"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
