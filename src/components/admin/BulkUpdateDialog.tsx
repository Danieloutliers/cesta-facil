import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';

interface BulkUpdateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function BulkUpdateDialog({ open, onOpenChange, onSuccess }: BulkUpdateDialogProps) {
    const [delta, setDelta] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const handleUpdate = async () => {
        const deltaValue = parseFloat(delta);
        if (isNaN(deltaValue) || deltaValue === 0) {
            alert('Digite uma variação válida (ex: 5 ou -2)');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.rpc('bulk_update_margin', {
                delta_percent: deltaValue
            });

            if (error) throw error;

            alert('Margens atualizadas com sucesso!');
            onSuccess();
            onOpenChange(false);
            setDelta('');
        } catch (error) {
            console.error('Error updating margins:', error);
            alert('Erro ao atualizar margens.');
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
