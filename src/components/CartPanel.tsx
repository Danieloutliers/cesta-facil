import { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ChevronUp, ChevronDown, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';


const CartPanelComponent = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const { items, total, budget, remaining, itemCount, isOverBudget, removeItem, updateQuantity } = useCart();

  const progressPercentage = Math.min((total / budget) * 100, 100);

  if (itemCount === 0) return null;

  return (
    <>
      {/* Backdrop for expanded state */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-md z-[60] transition-opacity duration-300",
          isExpanded ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsExpanded(false)}
      />

      <div
        className={cn(
          "fixed left-0 right-0 z-[70] transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1)",
          "bottom-[calc(env(safe-area-inset-bottom,0px))] md:bottom-0",
          isExpanded ? "translate-y-0" : "translate-y-0"
        )}
      >
        <div className={cn(
          "mx-4 md:mx-auto md:max-w-2xl bg-card border border-border rounded-2xl shadow-xl overflow-hidden transition-all duration-300",
          isExpanded ? "mb-4" : "mb-2 hover:translate-y-[-2px]"
        )}>

          {/* Header / Collapse Toggle */}
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center transition-colors border",
                  isOverBudget
                    ? "bg-destructive/10 text-destructive border-destructive/20"
                    : "bg-primary/10 text-primary border-primary/20"
                )}>
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-sm">
                  {itemCount}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Estimado</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-foreground">
                    R$ {total.toFixed(2).replace('.', ',')}
                  </span>
                  {isOverBudget && (
                    <span className="text-xs text-destructive font-medium flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Excedido
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/checkout');
                }}
                disabled={isOverBudget || itemCount === 0}
                className={cn(
                  "h-10 px-6 rounded-xl font-semibold shadow-sm transition-all duration-300",
                  isOverBudget
                    ? "opacity-50"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                )}
              >
                Finalizar
              </Button>
              {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronUp className="h-5 w-5 text-muted-foreground" />}
            </div>
          </div>

          {/* Expanded Content */}
          <div className={cn(
            "transition-all duration-500 ease-in-out border-t border-border",
            isExpanded ? "max-h-[60vh] opacity-100" : "max-h-0 opacity-0"
          )}>
            {/* Progress Bar */}
            <div className="px-4 py-3 bg-muted/30">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-muted-foreground">Orçamento: <span className="font-medium text-foreground">R$ {budget.toFixed(2)}</span></span>
                <span className={cn(
                  "font-medium",
                  isOverBudget ? "text-destructive" : "text-primary bg-primary/10 px-1.5 py-0.5 rounded"
                )}>
                  {isOverBudget ? `Faltam R$ ${Math.abs(remaining).toFixed(2)}` : `Restam R$ ${remaining.toFixed(2)}`}
                </span>
              </div>
              <Progress
                value={progressPercentage}
                className={cn(
                  "h-1.5",
                  isOverBudget && "[&>div]:bg-destructive"
                )}
              />
            </div>

            {/* Scrollable List */}
            <div className="overflow-y-auto max-h-[40vh] p-2 space-y-2 bg-background">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 bg-card p-2 rounded-xl border border-border hover:border-border/80 transition-colors shadow-sm">
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className="h-12 w-12 rounded-lg object-cover bg-muted"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{item.quantity}x</span>
                      <span className="text-xs font-medium text-primary">R$ {item.price.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <div className="flex items-center bg-muted rounded-lg border border-border">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background rounded-l-lg transition-colors"
                      >
                        -
                      </button>
                      <span className="text-xs w-4 text-center font-medium tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background rounded-r-lg transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg ml-1 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Memoize to prevent re-renders when parent components update
export const CartPanel = memo(CartPanelComponent);
