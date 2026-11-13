import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Layers } from 'lucide-react';
import { useCategories, createCategory, updateCategory, deleteCategory, useSubcategories } from '@/hooks/useData';
import { CategoryFormDialog } from '@/components/CategoryFormDialog';
import { SubcategoriesDialog } from '@/components/SubcategoriesDialog';
import { Category } from '@/types';
import { useToast } from '@/hooks/use-toast';

const Categories = () => {
    const { categories, loading, refetch } = useCategories();
    const { subcategories, refetch: refetchSubcategories } = useSubcategories();
    const { toast } = useToast();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [subDialogOpen, setSubDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [selectedCategoryForSubs, setSelectedCategoryForSubs] = useState<Category | null>(null);

    const handleSave = async (categoryData: Omit<Category, 'id'> | Category) => {
        try {
            if ('id' in categoryData) {
                await updateCategory(categoryData.id, categoryData);
            } else {
                await createCategory(categoryData);
            }
            await refetch();
            setEditingCategory(null);
            toast({ title: 'Categoria salva com sucesso!' });
        } catch (error) {
            console.error('Error saving category:', error);
            toast({
                title: 'Erro ao salvar categoria',
                description: error instanceof Error ? error.message : 'Tente novamente.',
                variant: 'destructive',
            });
            throw error;
        }
    };

    const handleDelete = async (id: string, label: string) => {
        if (id === 'todos') {
            toast({
                title: 'Ação não permitida',
                description: 'A categoria "Todos" é usada pela loja e não pode ser excluída.',
                variant: 'destructive',
            });
            return;
        }

        if (!confirm(`Tem certeza que deseja excluir "${label}"?`)) return;

        try {
            await deleteCategory(id);
            await Promise.all([refetch(), refetchSubcategories()]);
            toast({ title: 'Categoria excluída.' });
        } catch (error) {
            console.error('Error deleting category:', error);
            toast({
                title: 'Não foi possível excluir',
                description: error instanceof Error ? error.message : 'Tente novamente.',
                variant: 'destructive',
            });
        }
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setDialogOpen(true);
    };

    const handleNewCategory = () => {
        setEditingCategory(null);
        setDialogOpen(true);
    };

    const editableCategories = categories.filter(c => c.id !== 'todos');

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-3xl font-bold tracking-tight">Categorias</h2>
                <Button onClick={handleNewCategory}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Categoria
                </Button>
            </div>

            <div className="border rounded-lg bg-white overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Ícone</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>ID (Slug)</TableHead>
                            <TableHead>Subcategorias</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Carregando...
                                </TableCell>
                            </TableRow>
                        ) : editableCategories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    Nenhuma categoria encontrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            editableCategories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell className="text-2xl">{category.icon}</TableCell>
                                    <TableCell className="font-medium">{category.label}</TableCell>
                                    <TableCell className="text-muted-foreground font-mono text-sm">{category.id}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">
                                                {subcategories.filter(s => s.category_id === category.id).length} itens
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 text-xs"
                                                onClick={() => {
                                                    setSelectedCategoryForSubs(category);
                                                    setSubDialogOpen(true);
                                                }}
                                            >
                                                <Layers className="h-3 w-3 mr-1" />
                                                Subcategorias
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                onClick={() => handleEdit(category)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDelete(category.id, category.label)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <CategoryFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                category={editingCategory}
                onSave={handleSave}
            />

            <SubcategoriesDialog
                open={subDialogOpen}
                onOpenChange={setSubDialogOpen}
                category={selectedCategoryForSubs}
            />
        </div>
    );
};

export default Categories;
