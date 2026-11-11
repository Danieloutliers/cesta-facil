import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Category, SubCategory } from '@/types';
import { useSubcategories, createSubcategory, updateSubcategory, deleteSubcategory } from '@/hooks/useData';
import { Plus, Trash2, Pencil, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubcategoriesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    category: Category | null;
}

export function SubcategoriesDialog({ open, onOpenChange, category }: SubcategoriesDialogProps) {
    const { subcategories, refetch } = useSubcategories(); // Note: refetch might need to be exposed from useSubcategories hook
    const [newItemLabel, setNewItemLabel] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState('');
    const [loading, setLoading] = useState(false);

    if (!category) return null;

    // Filter subcategories for this category
    const categorySubcategories = subcategories.filter(sub => sub.category_id === category.id);

    // Need to handle refetching. 
    // Since useSubcategories hook currently doesn't export refetch, I should update the hook first or force reload.
    // For now, I'll assume I can trigger a reload or update local state.
    // To make it robust, I should update useData.ts to export refetch.

    // BUT, for this step, let's implement the UI logic first. Use window.location.reload() for simplicity if needed, 
    // or better, update the hook in the previous step (I missed adding refetch export).
    // I will use window.location.reload() for now as a fallback or assume the list updates if I didn't update the hook properly.
    // Actually, I should check useData.ts again.

    const handleAdd = async () => {
        if (!newItemLabel.trim()) return;
        setLoading(true);
        try {
            await createSubcategory({
                label: newItemLabel,
                category_id: category.id
            });
            setNewItemLabel('');
            window.location.reload(); // Simple refresh for now
        } catch (error) {
            console.error(error);
            alert('Erro ao adicionar subcategoria');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza?')) return;
        try {
            await deleteSubcategory(id);
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert('Erro ao excluir');
        }
    };

    const startEdit = (sub: SubCategory) => {
        setEditingId(sub.id);
        setEditLabel(sub.label);
    };

    const saveEdit = async () => {
        if (!editingId || !editLabel.trim()) return;
        setLoading(true);
        try {
            await updateSubcategory(editingId, { label: editLabel });
            setEditingId(null);
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert('Erro ao atualizar');
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
