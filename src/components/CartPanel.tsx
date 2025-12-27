import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ChevronUp, ChevronDown, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

export function CartPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const { items, total, budget, remaining, itemCount, isOverBudget, removeItem, updateQuantity } = useCart();

  const progressPercentage = Math.min((total / budget) * 100, 100);

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-0 md:bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-2xl animate-slide-up" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 64px)' }}>
      {/* Expandable Items List */}
      {isExpanded && (
        <div className="max-h-64 overflow-y-auto border-b border-border">
          <div className="container py-4 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 bg-muted/50 rounded-lg p-2">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-12 w-12 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity}x R$ {item.price.toFixed(2).replace('.', ',')}
                  </p>
                </div>
                <p className="font-semibold text-primary">
                  R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                </p>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => updateQuantity(item.id, 0)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Panel */}
      <div className="container py-4">
        <div className="flex items-center gap-4">
          {/* Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="relative">
              <ShoppingCart className="h-6 w-6" />
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {itemCount}
              </span>
            </div>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>

          {/* Progress Section */}
          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Total: <span className="font-semibold text-foreground">R$ {total.toFixed(2).replace('.', ',')}</span>
              </span>
              <span className={cn(
                "font-semibold",
                isOverBudget ? "text-destructive" : "text-primary"
              )}>
                {isOverBudget ? (
                  <span className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Excedido em R$ {Math.abs(remaining).toFixed(2).replace('.', ',')}
                  </span>
                ) : (
                  `Restam R$ ${remaining.toFixed(2).replace('.', ',')}`
                )}
              </span>
            </div>
            <Progress
              value={progressPercentage}
              className={cn(
                "h-2",
                isOverBudget && "[&>div]:bg-destructive"
              )}
            />
          </div>

          {/* Checkout Button */}
          <Button
            onClick={() => navigate('/checkout')}
            disabled={isOverBudget || itemCount === 0}
            className="whitespace-nowrap"
          >
            Finalizar
          </Button>
        </div>
      </div>
    </div>
  );
}
