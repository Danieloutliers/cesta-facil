import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, Calculator, Check, ChevronsUpDown } from "lucide-react";
import { Order, Product, CartItem } from '@/types';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface OrderEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: Order | null;
    onSave: (updatedOrder: Order) => Promise<void>;
}

export function OrderEditDialog({ open, onOpenChange, order, onSave }: OrderEditDialogProps) {
    const [editedOrder, setEditedOrder] = useState<Order | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [comboboxOpen, setComboboxOpen] = useState(false);

    useEffect(() => {
        if (order) {
            setEditedOrder(JSON.parse(JSON.stringify(order))); // Deep copy
        }
    }, [order]);

    useEffect(() => {
        if (open) {
            loadProducts();
        }
    }, [open]);

    const loadProducts = async () => {
        const { data } = await supabase.from('products').select('*');
        if (data) setProducts(data);
    };

    const handleItemChange = (index: number, field: keyof CartItem, value: any) => {
        if (!editedOrder) return;
        const newItems = [...editedOrder.items];

        if (field === 'price' || field === 'quantity') {
            newItems[index] = { ...newItems[index], [field]: Number(value) };
        } else {
            newItems[index] = { ...newItems[index], [field]: value };
        }

        // Auto-calculate total when items change
        const newTotal = newItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        setEditedOrder({ ...editedOrder, items: newItems, total: newTotal });
    };

    const handleRemoveItem = (index: number) => {
        if (!editedOrder) return;
        const newItems = [...editedOrder.items];
        newItems.splice(index, 1);
        const newTotal = newItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        setEditedOrder({ ...editedOrder, items: newItems, total: newTotal });
    };

    const handleAddItem = () => {
        if (!editedOrder || !selectedProduct) return;
        const product = products.find(p => p.id === selectedProduct);
        if (!product) return;

        const newItem: CartItem = {
            ...product,
            quantity: 1
        };

        const newItems = [...editedOrder.items, newItem];
        const newTotal = newItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        setEditedOrder({
            ...editedOrder,
            items: newItems,
            total: newTotal
        });
        setSelectedProduct('');
    };

    const calculateTotal = () => {
        if (!editedOrder) return;
        const newTotal = editedOrder.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        setEditedOrder({ ...editedOrder, total: newTotal });
        toast({ title: "Total recalculado", description: `Novo total: R$ ${newTotal.toFixed(2)}` });
    };

    const handleSave = async () => {
        if (!editedOrder) return;
        setLoading(true);
        try {
            await onSave(editedOrder);
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!editedOrder) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Editar Pedido #{editedOrder.id.slice(-6)}</DialogTitle>
                    <DialogDescription>
                        Faça alterações nos itens, valores e status do pedido.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="items" className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="items">Itens do Pedido</TabsTrigger>
                        <TabsTrigger value="payment">Pagamento e Status</TabsTrigger>
                    </TabsList>

                    <TabsContent value="items" className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
                        <div className="flex gap-2 items-end">
                            <div className="flex-1 space-y-2">
                                <Label>Adicionar Produto</Label>
                                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={comboboxOpen}
                                            className="w-full justify-between"
                                        >
                                            {selectedProduct
                                                ? products.find((p) => p.id === selectedProduct)?.name
                                                : "Buscar produto por nome..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Digite para buscar..." />
                                            <CommandList className="max-h-[300px]">
                                                <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                                                <CommandGroup>
                                                    {products.map((product) => (
                                                        <CommandItem
                                                            key={product.id}
                                                            value={`${product.name} ${product.price}`}
                                                            onSelect={() => {
                                                                setSelectedProduct(product.id);
                                                                setComboboxOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedProduct === product.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            <div className="flex justify-between w-full">
                                                                <span>{product.name}</span>
                                                                <span className="text-muted-foreground">R$ {product.price.toFixed(2)}</span>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <Button onClick={handleAddItem} disabled={!selectedProduct}>
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar
                            </Button>
                        </div>

                        <div className="border rounded-md flex-1 overflow-hidden">
                            <div className="bg-muted p-2 grid grid-cols-12 gap-2 text-sm font-medium">
                                <div className="col-span-5">Produto</div>
                                <div className="col-span-2 text-center">Qtd</div>
                                <div className="col-span-3 text-right">Preço Unit.</div>
                                <div className="col-span-2"></div>
                            </div>
                            <ScrollArea className="h-[300px]">
                                <div className="p-2 space-y-2">
                                    {editedOrder.items.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-12 gap-2 items-center text-sm">
                                            <div className="col-span-5 truncate font-medium">{item.name}</div>
                                            <div className="col-span-2">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                                                    className="h-8 text-center"
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={item.price}
                                                    onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                                                    className="h-8 text-right"
                                                />
                                            </div>
                                            <div className="col-span-2 flex justify-end">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemoveItem(idx)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                        <div className="flex justify-between items-center bg-muted/50 p-2 rounded text-sm">
                            <span>Total calculado dos itens: <strong>R$ {editedOrder.items.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)}</strong></span>
                            <Button variant="outline" size="sm" onClick={calculateTotal}>
                                <Calculator className="h-3 w-3 mr-2" />
                                Atualizar Total do Pedido
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="payment" className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Status do Pedido</Label>
                                <Select
                                    value={editedOrder.status}
                                    onValueChange={(v: any) => setEditedOrder({ ...editedOrder, status: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="processando">Processando</SelectItem>
                                        <SelectItem value="separando">Separando</SelectItem>
                                        <SelectItem value="em_rota">Em Rota</SelectItem>
                                        <SelectItem value="entregue">Entregue</SelectItem>
                                        <SelectItem value="cancelado">Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Método de Pagamento</Label>
                                <Select
                                    value={editedOrder.paymentMethod || 'dinheiro'}
                                    onValueChange={(v) => setEditedOrder({ ...editedOrder, paymentMethod: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pix">PIX</SelectItem>
                                        <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                                        <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                                        <SelectItem value="money">Dinheiro</SelectItem>
                                        <SelectItem value="carnet">Carnê</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Parcelas</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={editedOrder.installments || 1}
                                    onChange={(e) => setEditedOrder({ ...editedOrder, installments: Number(e.target.value) })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Total do Pedido (R$)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={editedOrder.total}
                                    onChange={(e) => setEditedOrder({ ...editedOrder, total: Number(e.target.value) })}
                                />
                                <p className="text-xs text-muted-foreground">Você pode sobrescrever o total manualmente.</p>
                            </div>
                        </div>

                        <div className="space-y-2 pt-4 border-t">
                            <Label>Endereço de Entrega</Label>
                            <div className="grid grid-cols-12 gap-2">
                                <div className="col-span-9">
                                    <Input
                                        placeholder="Rua"
                                        value={editedOrder.address.street}
                                        onChange={(e) => setEditedOrder({
                                            ...editedOrder,
                                            address: { ...editedOrder.address, street: e.target.value }
                                        })}
                                    />
                                </div>
                                <div className="col-span-3">
                                    <Input
                                        placeholder="Número"
                                        value={editedOrder.address.number}
                                        onChange={(e) => setEditedOrder({
                                            ...editedOrder,
                                            address: { ...editedOrder.address, number: e.target.value }
                                        })}
                                    />
                                </div>
                                <div className="col-span-6">
                                    <Input
                                        placeholder="Bairro"
                                        value={editedOrder.address.neighborhood}
                                        onChange={(e) => setEditedOrder({
                                            ...editedOrder,
                                            address: { ...editedOrder.address, neighborhood: e.target.value }
                                        })}
                                    />
                                </div>
                                <div className="col-span-6">
                                    <Input
                                        placeholder="Complemento"
                                        value={editedOrder.address.complement || ''}
                                        onChange={(e) => setEditedOrder({
                                            ...editedOrder,
                                            address: { ...editedOrder.address, complement: e.target.value }
                                        })}
                                    />
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
