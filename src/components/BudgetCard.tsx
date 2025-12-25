import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BudgetCardProps {
  value: number;
  label: string;
  description: string;
  popular?: boolean;
  selected: boolean;
  onSelect: () => void;
}

export function BudgetCard({ value, label, description, popular, selected, onSelect }: BudgetCardProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative flex flex-col items-center p-4 md:p-6 rounded-xl md:rounded-2xl border-2 transition-all duration-300 hover:shadow-card-hover",
        selected
          ? "border-primary bg-secondary shadow-primary"
          : "border-border bg-card hover:border-primary/50"
      )}
    >
      {popular && (
        <div className="absolute -top-2.5 md:-top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-[10px] md:text-xs font-semibold px-2 md:px-3 py-0.5 md:py-1 rounded-full whitespace-nowrap">
            Mais Popular
          </span>
        </div>
      )}

      {selected && (
        <div className="absolute top-2 right-2 md:top-3 md:right-3">
          <div className="flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-full bg-primary">
            <Check className="h-3 w-3 md:h-4 md:w-4 text-primary-foreground" />
          </div>
        </div>
      )}

      <span className={cn(
        "text-2xl md:text-3xl font-bold mb-1",
        selected ? "text-primary" : "text-foreground"
      )}>
        {label}
      </span>
      <span className="text-xs md:text-sm text-muted-foreground text-center">{description}</span>
    </button>
  );
}
