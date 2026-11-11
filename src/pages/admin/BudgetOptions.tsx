import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Save, X, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface BudgetOption {
    id: string;
    value: number;
    label: string;
    description: string;
    popular: boolean;
    active: boolean;
}

export default function BudgetOptions() {
    const [options, setOptions] = useState<BudgetOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingOption, setEditingOption] = useState<BudgetOption | null>(null);
    const [formData, setFormData] = useState<Partial<BudgetOption>>({
        value: 0,
        label: '',
        description: '',
        popular: false,
        active: true
    });
    const { toast } = useToast();

    useEffect(() => {
        fetchOptions();
    }, []);

    const fetchOptions = async () => {
        try {
            const { data, error } = await supabase
                .from('budget_options')
                .select('*')
                .order('value', { ascending: true });

            if (error) throw error;
            setOptions(data || []);
        } catch (error) {
            console.error('Error fetching budget options:', error);
            // Fallback for demo if table doesn't exist yet
            if (options.length === 0) {
                // We could load from file here, but let's encourage DB setup
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (option?: BudgetOption) => {
        if (option) {
            setEditingOption(option);
            setFormData(option);
        } else {
            setEditingOption(null);
            setFormData({
                value: 0,
                label: 'R$ ',
                description: '',
                popular: false,
                active: true
            });
        }
        setDialogOpen(true);
    };

    const handleSave = async () => {
        try {
            if (!formData.value || !formData.label) {
                toast({ title: 'Erro', description: 'Preencha valor e rótulo', variant: 'destructive' });
                return;
            }

            const payload = {
                value: formData.value,
                label: formData.label,
                description: formData.description,
                popular: formData.popular,
                active: formData.active
            };

            if (editingOption) {
                const { error } = await supabase
                    .from('budget_options')
                    .update(payload)
                    .eq('id', editingOption.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('budget_options')
                    .insert([payload]);
                if (error) throw error;
            }

            toast({ title: 'Sucesso', description: 'Opção de orçamento salva' });
            setDialogOpen(false);
            fetchOptions();
        } catch (error) {
            console.error('Error saving option:', error);
            toast({ title: 'Erro', description: 'Falha ao salvar opção', variant: 'destructive' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta opção?')) return;

        try {
            const { error } = await supabase
                .from('budget_options')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast({ title: 'Sucesso', description: 'Opção removida' });
            fetchOptions();
        } catch (error) {
            console.error('Error deleting option:', error);
            toast({ title: 'Erro', description: 'Falha ao excluir', variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Orçamentos</h2>
                    <p className="text-muted-foreground">Gerencie as opções de valor das cestas</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Orçamento
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Valor</TableHead>
                                <TableHead>Rótulo</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Popular</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">Carregando...</TableCell>
                                </TableRow>
                            ) : options.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        Nenhuma opção encontrada. Verifique se criou a tabela no Supabase.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                options.map((option) => (
                                    <TableRow key={option.id}>
                                        <TableCell className="font-medium">R$ {option.value}</TableCell>
                                        <TableCell>{option.label}</TableCell>
                                        <TableCell>{option.description}</TableCell>
                                        <TableCell>
                                            {option.popular && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    Popular
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${option.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {option.active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(option)}>
                                                    <Pencil className="h-4 w-4 text-blue-500" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(option.id)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingOption ? 'Editar Orçamento' : 'Novo Orçamento'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="value">Valor (R$)</Label>
                                <Input
                                    id="value"
                                    type="number"
                                    value={formData.value}
                                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="label">Rótulo</Label>
                                <Input
                                    id="label"
                                    value={formData.label}
                                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                    placeholder="Ex: R$ 200"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Ex: Ideal para casal"
                            />
                        </div>

                        <div className="flex items-center justify-between space-x-2 pt-2">
                            <Label htmlFor="popular" className="flex flex-col space-y-1">
                                <span>Destacar como Popular</span>
                                <span className="font-normal text-xs text-muted-foreground">Exibe badge "Mais Popular"</span>
                            </Label>
                            <Switch
                                id="popular"
                                checked={formData.popular}
                                onCheckedChange={(checked) => setFormData({ ...formData, popular: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="active" className="flex flex-col space-y-1">
                                <span>Ativo</span>
                                <span className="font-normal text-xs text-muted-foreground">Visível na página inicial</span>
                            </Label>
                            <Switch
                                id="active"
                                checked={formData.active}
                                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSave}>Salvar</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
