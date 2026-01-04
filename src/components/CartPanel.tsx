import { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ChevronUp, ChevronDown, Trash2, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

const CartPanelComponent = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const { items, total, budget, remaining, itemCount, isOverBudget, removeItem, updateQuantity } = useCart();

  const progressPercentage = Math.min((total / budget) * 100, 100);

  if (itemCount === 0) return null;

  return (
    <AnimatePresence>
      {/* Backdrop for expanded state */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <div className={cn(
        "fixed left-0 right-0 z-[70] pointer-events-none flex justify-center",
        "bottom-[calc(env(safe-area-inset-bottom,0px))] md:bottom-6"
      )}>
        <motion.div
          layout
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={cn(
            "w-full md:w-[600px] pointer-events-auto",
            "bg-background/80 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl",
            "md:rounded-[2rem] rounded-t-[2rem]",
            isExpanded ? "md:mb-0" : "mb-0"
          )}
        >
          {/* Header / Collapse Toggle */}
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className="relative flex items-center justify-between p-4 cursor-pointer group"
          >
            {/* Decorative top pill indicator */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-muted-foreground/20 rounded-full md:hidden" />

            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-lg",
                  isOverBudget
                    ? "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-red-500/30"
                    : "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-primary/30"
                )}>
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <span className={cn(
                  "absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shadow-sm border-2 border-background",
                  isOverBudget ? "bg-red-500 text-white" : "bg-white text-primary"
                )}>
                  {itemCount}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-0.5">
                  Total Estimado
                </span>
                <div className="flex items-baseline gap-2">
                  <span className={cn(
                    "text-xl font-black tracking-tight",
                    isOverBudget ? "text-red-500" : "text-foreground"
                  )}>
                    R$ {total.toFixed(2).replace('.', ',')}
                  </span>
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
                size="sm"
                className={cn(
                  "h-10 px-6 rounded-xl font-bold shadow-lg transition-transform active:scale-95 text-base",
                  isOverBudget
                    ? "opacity-50"
                    : "bg-foreground text-background hover:bg-foreground/90"
                )}
              >
                Finalizar
              </Button>
              <div className="bg-secondary/50 p-2 rounded-full hover:bg-secondary transition-colors">
                {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
              </div>
            </div>
          </div>

          {/* Progress Bar (Always Visible if not empty) */}
          <div className="px-4 pb-1">
            <div className="flex justify-between text-[10px] mb-1.5 font-medium uppercase tracking-wider text-muted-foreground">
              <span>Meta: R$ {budget.toFixed(2)}</span>
              <span className={isOverBudget ? "text-red-500" : "text-emerald-500"}>
                {isOverBudget ? 'Orçamento Excedido' : 'Dentro do Orçamento'}
              </span>
            </div>
            <Progress
              value={progressPercentage}
              className={cn(
                "h-2 rounded-full bg-secondary/50 overflow-hidden",
                isOverBudget ? "[&>div]:bg-red-500" : "[&>div]:bg-primary"
              )}
            />
            {isOverBudget && (
              <motion.p
                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-500 font-medium text-center mt-2 flex items-center justify-center gap-1"
              >
                <AlertCircle className="w-3 h-3" />
                Você ultrapassou o limite em R$ {Math.abs(remaining).toFixed(2)}
              </motion.p>
            )}
          </div>

          {/* Expanded Content */}
          <motion.div
            initial={false}
            animate={{
              height: isExpanded ? "auto" : 0,
              opacity: isExpanded ? 1 : 0
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="max-h-[50vh] overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-secondary">
              {items.map((item) => (
                <motion.div
                  layout
                  key={item.id}
                  className="flex items-center gap-4 bg-secondary/30 p-2 rounded-2xl hover:bg-secondary/50 transition-colors group"
                >
                  <div className="h-14 w-14 rounded-xl overflow-hidden bg-background shadow-sm shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate leading-tight mb-1">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="bg-background px-1.5 py-0.5 rounded text-[10px] font-medium border border-border/50">
                        {item.unit}
                      </span>
                      <span>Subtotal: <span className="text-primary font-bold">R$ {(item.price * item.quantity).toFixed(2)}</span></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-background rounded-lg border border-border/50 shadow-sm h-8">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-l-lg transition-colors"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold text-sm tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-r-lg transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="p-4 bg-muted/20 text-center text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3 inline-block mr-1 text-amber-500" />
              Finalize agora para garantir os melhores produtos
            </div>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const CartPanel = memo(CartPanelComponent);
