import { memo, useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import { ProductDetailsModal } from '@/components/ProductDetailsModal';

interface ProductCardProps {
  product: Product;
}

const ProductCardComponent = ({ product }: ProductCardProps) => {
  const { items, addItem, removeItem } = useCart();
  const [showDetails, setShowDetails] = useState(false);
  const cartItem = items.find((item) => item.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open modal if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    setShowDetails(true);
  };

  return (
    <>
      <div
        className={cn(
          "group relative bg-card rounded-xl border transition-all duration-300 cursor-pointer",
          quantity > 0 ? "border-primary shadow-sm" : "border-border hover:shadow-md"
        )}
        onClick={handleCardClick}
      >
        {/* Image Container */}
        <div className="aspect-square overflow-hidden bg-muted relative rounded-t-xl">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
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
                onClick={(e) => {
                  e.stopPropagation();
                  addItem(product);
                }}
                className="w-full h-7 text-xs rounded-lg font-medium shadow-sm active:scale-95 transition-transform px-0"
              >
                Adicionar
              </Button>
            ) : (
              <div className="flex items-center justify-between w-full bg-muted/50 rounded-lg p-0.5 border border-muted">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(product.id);
                  }}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    addItem(product);
                  }}
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

      <ProductDetailsModal
        product={product}
        open={showDetails}
        onOpenChange={setShowDetails}
      />
    </>
  );
};

// Memoize with custom comparison to prevent re-renders when cart changes
// but product data stays the same
export const ProductCard = memo(ProductCardComponent, (prevProps, nextProps) => {
  // Only re-render if product id or price changed
  return prevProps.product.id === nextProps.product.id &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.name === nextProps.product.name &&
    prevProps.product.image === nextProps.product.image;
});
