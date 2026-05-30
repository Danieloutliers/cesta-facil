import { useState, useEffect } from 'react';
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
        label: '',
        icon: '',
    });
    const [loading, setLoading] = useState(false);

    // Update form data when category changes or dialog opens
    useEffect(() => {
        if (open) {
            if (category) {
                setFormData({
                    label: category.label,
                    icon: category.icon,
                });
            } else {
                setFormData({
                    label: '',
                    icon: '',
                });
            }
        }
    }, [category, open]);

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
                        <div className="flex gap-2 mb-2">
                            <Input
                                id="icon"
                                value={formData.icon}
                                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                placeholder="ex: 🍚"
                                required
                                maxLength={2}
                                className="w-20 text-center text-xl"
                            />
                            <div className="flex-1 flex flex-wrap gap-1 p-2 border rounded-md bg-slate-50/50">
                                {['🍚', '🍞', '🍎', '🥩', '🥛', '🧼', '📦', '🎁', '🧺', '🛒', '🥬', '🍗', '🧴', '🍪', '🥤'].map(emoji => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, icon: emoji })}
                                        className={`w-8 h-8 flex items-center justify-center rounded hover:bg-white hover:shadow-sm transition-all text-lg ${formData.icon === emoji ? 'bg-white shadow-sm border-primary/20 border' : ''}`}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Escolha um emoji acima ou digite o seu preferido
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
