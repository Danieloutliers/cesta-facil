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
    <div className="group relative bg-card rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300">
      {/* Image */}
      <div className="aspect-square overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{product.unit}</p>
        <h3 className="font-semibold text-foreground line-clamp-2 mb-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-primary">
            R$ {product.price.toFixed(2).replace('.', ',')}
          </p>

          {quantity === 0 ? (
            <Button
              size="icon-sm"
              onClick={() => addItem(product)}
              className="rounded-full"
            >
              <Plus className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                size="icon-sm"
                variant="outline"
                onClick={() => removeItem(product.id)}
                className="rounded-full h-8 w-8"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-6 text-center font-semibold">{quantity}</span>
              <Button
                size="icon-sm"
                onClick={() => addItem(product)}
                className="rounded-full h-8 w-8"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Quantity Badge */}
      {quantity > 0 && (
        <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground animate-scale-in">
          {quantity}
        </div>
      )}
    </div>
  );
}
