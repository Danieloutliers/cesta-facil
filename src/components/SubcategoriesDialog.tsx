import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Category, SubCategory } from '@/types';
import { useSubcategories, createSubcategory, updateSubcategory, deleteSubcategory } from '@/hooks/useData';
import { Plus, Trash2, Pencil, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SubcategoriesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    category: Category | null;
}

export function SubcategoriesDialog({ open, onOpenChange, category }: SubcategoriesDialogProps) {
    const { subcategories, refetch } = useSubcategories();
    const { toast } = useToast();
    const [newItemLabel, setNewItemLabel] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState('');
    const [loading, setLoading] = useState(false);

    if (!category) return null;

    // Filter subcategories for this category
    const categorySubcategories = subcategories.filter(sub => sub.category_id === category.id);

    const handleAdd = async () => {
        const label = newItemLabel.trim();
        if (!label) return;
        setLoading(true);
        try {
            await createSubcategory({
                label,
                category_id: category.id
            });
            setNewItemLabel('');
            await refetch();
            toast({ title: 'Subcategoria adicionada!' });
        } catch (error) {
            console.error(error);
            toast({
                title: 'Erro ao adicionar subcategoria',
                description: error instanceof Error ? error.message : 'Tente novamente.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta subcategoria?')) return;
        try {
            await deleteSubcategory(id);
            await refetch();
            toast({ title: 'Subcategoria excluída.' });
        } catch (error) {
            console.error(error);
            toast({
                title: 'Erro ao excluir',
                description: error instanceof Error ? error.message : 'Tente novamente.',
                variant: 'destructive',
            });
        }
    };

    const startEdit = (sub: SubCategory) => {
        setEditingId(sub.id);
        setEditLabel(sub.label);
    };

    const saveEdit = async () => {
        const label = editLabel.trim();
        if (!editingId || !label) return;
        setLoading(true);
        try {
            await updateSubcategory(editingId, { label });
            setEditingId(null);
            await refetch();
            toast({ title: 'Subcategoria atualizada!' });
        } catch (error) {
            console.error(error);
            toast({
                title: 'Erro ao atualizar',
                description: error instanceof Error ? error.message : 'Tente novamente.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Gerenciar Subcategorias</DialogTitle>
                    <DialogDescription>
                        Categoria: <span className="font-semibold text-primary">{category.label}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 my-4">
                    {/* List */}
                    <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
                        {categorySubcategories.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground text-sm">
                                Nenhuma subcategoria cadastrada.
                            </div>
                        ) : (
                            categorySubcategories.map(sub => (
                                <div key={sub.id} className="p-2 flex items-center justify-between hover:bg-slate-50">
                                    {editingId === sub.id ? (
                                        <div className="flex items-center gap-2 flex-1">
                                            <Input
                                                value={editLabel}
                                                onChange={e => setEditLabel(e.target.value)}
                                                className="h-8 text-sm"
                                            />
                                            <Button size="icon" variant="ghost" onClick={saveEdit} className="h-8 w-8 text-green-600">
                                                <Save className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} className="h-8 w-8 text-slate-500">
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-sm font-medium">{sub.label}</span>
                                            <div className="flex items-center gap-1">
                                                <Button size="icon" variant="ghost" onClick={() => startEdit(sub)} className="h-8 w-8 text-blue-500">
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => handleDelete(sub.id)} className="h-8 w-8 text-red-500">
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Add New */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                        <Input
                            placeholder="Nova subcategoria..."
                            value={newItemLabel}
                            onChange={e => setNewItemLabel(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        />
                        <Button onClick={handleAdd} disabled={!newItemLabel.trim() || loading}>
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar
                        </Button>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
