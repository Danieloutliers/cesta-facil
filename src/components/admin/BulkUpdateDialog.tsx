import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { updateProduct } from '@/hooks/useData';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/errors';

interface BulkUpdateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

/**
 * Adjusts the margin/price of every product with a defined cost.
 * Prefers the database RPC (fast, atomic) and falls back to a client-side
 * recalculation when the RPC has not been deployed.
 */
export function BulkUpdateDialog({ open, onOpenChange, onSuccess }: BulkUpdateDialogProps) {
    const [delta, setDelta] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const applyClientSide = async (deltaValue: number) => {
        const { data, error } = await supabase
            .from('products')
            .select('id, price, cost_price')
            .eq('active', true);

        if (error) throw error;
        if (!data || data.length === 0) throw new Error('Nenhum produto ativo encontrado.');

        let updated = 0;
        for (const product of data) {
            const price = Number(product.price) || 0;
            const cost = Number(product.cost_price) || 0;

            let newPrice: number;
            if (cost > 0) {
                // Current margin, then apply the requested variation.
                const currentMargin = ((price - cost) / cost) * 100;
                newPrice = cost * (1 + (currentMargin + deltaValue) / 100);
            } else {
                newPrice = price * (1 + deltaValue / 100);
            }

            newPrice = Math.max(0, Math.round(newPrice * 100) / 100);
            if (newPrice === price) continue;

            await updateProduct(product.id, { price: newPrice });
            updated += 1;
        }

        return updated;
    };

    const handleUpdate = async () => {
        const deltaValue = parseFloat(delta.replace(',', '.'));
        if (!Number.isFinite(deltaValue) || deltaValue === 0) {
            toast({
                title: 'Variação inválida',
                description: 'Digite um valor diferente de zero (ex: 5 ou -2).',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.rpc('bulk_update_margin', {
                delta_percent: deltaValue
            });

            if (error) {
                // RPC not deployed in this project: apply the same rule locally.
                const updated = await applyClientSide(deltaValue);
                toast({
                    title: 'Margens atualizadas!',
                    description: `${updated} produto(s) reajustado(s).`,
                });
            } else {
                toast({ title: 'Margens atualizadas com sucesso!' });
            }

            onSuccess();
            onOpenChange(false);
            setDelta('');
        } catch (error) {
            console.error('Error updating margins:', error);
            toast({
                title: 'Erro ao atualizar margens',
                description: getErrorMessage(error),
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Reajuste de Margem em Massa</DialogTitle>
                    <DialogDescription>
                        Ajuste o preço de venda de TODOS os produtos com custo definido baseando-se em um aumento ou redução da margem.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="delta">Variação da Margem (%)</Label>
                        <Input
                            id="delta"
                            type="number"
                            placeholder="Ex: 5 para aumentar 5%, -2 para reduzir"
                            value={delta}
                            onChange={(e) => setDelta(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            <strong>Com Custo:</strong> Aumenta a margem em X% (Custo base).<br />
                            <strong>Sem Custo:</strong> Aumenta o preço final em X% direto.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleUpdate} disabled={loading}>
                        {loading ? 'Atualizando...' : 'Confirmar Reajuste'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
