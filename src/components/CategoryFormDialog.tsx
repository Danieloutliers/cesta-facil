import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Category } from '@/types';

interface CategoryFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    category?: Category | null;
    onSave: (category: Omit<Category, 'id'> | Category) => Promise<void>;
}

export function CategoryFormDialog({ open, onOpenChange, category, onSave }: CategoryFormDialogProps) {
    const [formData, setFormData] = useState<Omit<Category, 'id'>>({
        label: category?.label || '',
        icon: category?.icon || '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (category) {
                await onSave({ ...formData, id: category.id } as Category);
            } else {
                await onSave(formData);
            }
            onOpenChange(false);
            setFormData({ label: '', icon: '' });
        } catch (error) {
            console.error('Error saving category:', error);
            alert('Erro ao salvar categoria');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>{category ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="label">Nome da Categoria</Label>
                        <Input
                            id="label"
                            value={formData.label}
                            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                            placeholder="ex: Alimentos"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="icon">Ícone (Emoji)</Label>
                        <Input
                            id="icon"
                            value={formData.icon}
                            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                            placeholder="ex: 🍚"
                            required
                            maxLength={2}
                        />
                        <p className="text-xs text-muted-foreground">
                            Use um emoji para representar a categoria
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
