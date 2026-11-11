import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface BulkUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BulkUpdateDialog({ open, onOpenChange, onSuccess }: BulkUpdateDialogProps) {
  const [marginPercent, setMarginPercent] = useState<number>(30);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleApply = async () => {
    try {
      setLoading(true);
      // Fetch active products with cost_price > 0
      const { data: prods, error } = await supabase
        .from('products')
        .select('id, cost_price, price')
        .eq('active', true)
        .gt('cost_price', 0);

      if (error) throw error;

      if (prods && prods.length > 0) {
        for (const p of prods) {
          const newPrice = Number((p.cost_price * (1 + marginPercent / 100)).toFixed(2));
          await supabase.from('products').update({ price: newPrice }).eq('id', p.id);
        }
      }

      toast({
        title: "Margens reajustadas",
        description: `Margem de ${marginPercent}% aplicada aos produtos com preço de custo.`
      });
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Erro ao reajustar",
        description: "Não foi possível atualizar as margens.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reajustar Margens em Massa</DialogTitle>
          <DialogDescription>
            Ajuste automaticamente o preço de venda de todos os produtos com base no preço de custo e na margem de lucro desejada.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <Label>Nova Margem de Lucro Desejada (%)</Label>
          <div className="relative">
            <Input
              type="number"
              value={marginPercent}
              onChange={(e) => setMarginPercent(parseFloat(e.target.value) || 0)}
              min={0}
              max={500}
            />
            <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">%</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleApply} disabled={loading}>
            {loading ? 'Aplicando...' : 'Aplicar Reajuste'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
