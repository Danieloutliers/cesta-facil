import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Order, CartItem, Address } from '@/types';
import {
    Package,
    MapPin,
    Phone,
    User,
    ChevronDown,
    ChevronUp,
    TrendingUp,
    Clock,
    CheckCircle2,
    ArrowRight,
    ShoppingBag,
    MessageCircle,
    XCircle,
    Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OrderEditDialog } from '@/components/admin/OrderEditDialog';
import {
    DndContext,
    DragOverlay,
    useDraggable,
    useDroppable,
    DragEndEvent,
    DragStartEvent,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { sendWhatsAppMessage, getWhatsAppMessage } from '@/lib/whatsapp';

interface OrderWithUser extends Order {
    user: {
        phone: string;
        name?: string;
    };
}

const statusConfig = {
    processando: {
        label: 'Processando',
        color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        icon: Clock,
        next: 'separando'
    },
    separando: {
        label: 'Separando',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: Package,
        next: 'em_rota'
    },
    em_rota: {
        label: 'Em Rota',
        color: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: MapPin,
        next: 'entregue'
    },
    entregue: {
        label: 'Entregue',
        color: 'bg-green-50 text-green-700 border-green-200',
        icon: CheckCircle2,
        next: null
    },
    cancelado: {
        label: 'Cancelado',
        color: 'bg-red-50 text-red-700 border-red-200',
        icon: XCircle,
        next: null
    },
};


// --- Draggable Card Component ---
const DraggableOrderCard = ({ order, statusConfig, updateOrderStatus, expandedOrder, setExpandedOrder, onEdit }: any) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: order.id,
        data: { order }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    const config = statusConfig[order.status as keyof typeof statusConfig];

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={cn("touch-none", isDragging && "opacity-50 z-50")}>
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-gray-100 cursor-move">
                <CardHeader className="p-4 pb-2 space-y-2">
                    <div className="flex justify-between items-start">
                        <Badge variant="outline" className="font-mono text-xs">
                            {order.id.slice(-6)}
                        </Badge>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-green-600">
                                R$ {order.total.toFixed(2).replace('.', ',')}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate">{order.user.name || 'Cliente sem nome'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">
                                {order.address.neighborhood}, {order.address.city}
                            </span>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-4 pt-2">
                    <div className="border-t pt-3 mt-2 space-y-3">
                        {/* Quick Action Button (Clickable, stop propagation for drag) */}
                        {config.next && (
                            <Button
                                className="w-full h-8 text-xs bg-primary/90 hover:bg-primary cursor-pointer"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={() => updateOrderStatus(order.id, config.next)}
                            >
                                Mover para {statusConfig[config.next as keyof typeof statusConfig].label}
                                <ArrowRight className="h-3 w-3 ml-2" />
                            </Button>
                        )}

                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-8 text-xs text-muted-foreground cursor-pointer"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        >
                            {expandedOrder === order.id ? 'Ocultar detalhes' : 'Ver detalhes'}
                        </Button>

                        {/* Expanded Details */}
                        {expandedOrder === order.id && (
                            <div className="pt-2 text-xs space-y-3 animate-in slide-in-from-top-2 duration-200">
                                {/* Items List */}
                                <div className="space-y-1 bg-gray-50 p-2 rounded">
                                    {order.items.map((item: CartItem, idx: number) => (
                                        <div key={idx} className="flex justify-between">
                                            <span className="text-gray-600">{item.quantity}x {item.name}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Full Address */}
                                <div className="text-gray-500">
                                    <p>{order.address.street}, {order.address.number}</p>
                                    {order.address.complement && <p>{order.address.complement}</p>}
                                </div>

                                {/* Edit Button */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-8 gap-2 cursor-pointer border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={() => onEdit(order)}
                                >
                                    <Pencil className="h-3 w-3" />
                                    Editar Pedido
                                </Button>

                                {/* Phone Button */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-8 gap-2 cursor-pointer border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={() => window.open(`https://wa.me/55${order.user.phone}`, '_blank')}
                                >
                                    <MessageCircle className="h-3 w-3" />
                                    WhatsApp
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

// --- Droppable Column Component ---
const DroppableColumn = ({ id, status, orders, statsConfig, expandedOrder, setExpandedOrder, updateOrderStatus, onEdit }: any) => {
    const { setNodeRef } = useDroppable({ id });
    const StatusIcon = statsConfig.icon;

    return (
        <div ref={setNodeRef} className="flex flex-col w-80 flex-shrink-0 bg-gray-50/50 rounded-xl border p-4 h-full min-h-[500px]">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className={cn("p-2 rounded-lg bg-white shadow-sm", statsConfig.color.split(' ')[1])}>
                        <StatusIcon className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{statsConfig.label}</h3>
                </div>
                <Badge variant="secondary" className="bg-white">{orders.length}</Badge>
            </div>

            {/* Cards Container */}
            <ScrollArea className="flex-1 -mx-2 px-2">
                <div className="space-y-3 pb-4">
                    {orders.map((order: any) => (
                        <DraggableOrderCard
                            key={order.id}
                            order={order}
                            statusConfig={statusConfig}
                            updateOrderStatus={updateOrderStatus}
                            updatedOrderStatus={updateOrderStatus}
                            expandedOrder={expandedOrder}
                            setExpandedOrder={setExpandedOrder}
                            onEdit={onEdit}
                        />
                    ))}
                    {orders.length === 0 && (
                        <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed rounded-lg">
                            Solte aqui
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};


export default function Orders() {
    const [orders, setOrders] = useState<OrderWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [mobileStatusFilter, setMobileStatusFilter] = useState<Order['status'] | 'todos'>('todos');
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const { toast } = useToast();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    useEffect(() => {
        loadOrders();

        // Subscribe to realtime changes
        const subscription = supabase
            .channel('public:orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                loadOrders();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const loadOrders = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          user:users!user_id (
            phone,
            name
          )
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const transformedOrders: OrderWithUser[] = data.map((row: any) => ({
                id: row.order_number,
                items: row.items as CartItem[],
                budget: Number(row.budget),
                total: Number(row.total),
                savings: Number(row.savings),
                status: row.status as Order['status'],
                address: row.address as Address,
                missingItemPreference: row.missing_item_preference as 'substituir' | 'credito',
                createdAt: row.created_at,
                estimatedDelivery: row.estimated_delivery,
                user: {
                    phone: row.user?.phone || 'N/A',
                    name: row.user?.name,
                },
            }));

            setOrders(transformedOrders);
            setLoading(false);
        } catch (error) {
            console.error('Error loading orders:', error);
            setLoading(false);
        }
    };


    const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
        try {
            // Find the order *before* update for the message
            const order = orders.find(o => o.id === orderId);

            // Optimistic update
            setOrders((prev) =>
                prev.map((o) =>
                    o.id === orderId ? { ...o, status: newStatus } : o
                )
            );

            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('order_number', orderId);

            if (error) throw error;

            // Handle Notification
            if (order) {
                const message = await getWhatsAppMessage(newStatus, order);
                const phoneNumber = `55${order.user.phone}`;
                const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

                // Attempt Bot Send First
                toast({
                    title: "Atualizando status...",
                    description: "Tentando contato com o robô...",
                    duration: 2000,
                });

                const sentByBot = await sendWhatsAppMessage(phoneNumber, message);

                if (sentByBot) {
                    toast({
                        title: "✅ Sucesso Automático!",
                        description: `Mensagem enviada pelo Droide para ${order.user.name}`,
                        variant: "default",
                        className: "bg-green-50 border-green-200 text-green-900"
                    });
                } else {
                    // Fallback to Manual
                    toast({
                        title: "⚠️ Modo Manual",
                        description: `Robô offline. Envie manualmente:`,
                        action: (
                            <ToastAction altText="Enviar WhatsApp" onClick={() => window.open(whatsappUrl, '_blank')}>
                                <div className="flex items-center gap-2">
                                    <MessageCircle className="h-4 w-4" />
                                    Enviar Zap
                                </div>
                            </ToastAction>
                        ),
                    });
                }
            }

        } catch (error) {
            console.error('Error updating status:', error);
            toast({
                title: "Erro ao atualizar",
                variant: "destructive"
            });
            loadOrders(); // Revert on error
        }
    };

    const handleSaveOrder = async (updatedOrder: Order) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({
                    items: updatedOrder.items,
                    total: updatedOrder.total,
                    status: updatedOrder.status,
                    payment_method: updatedOrder.paymentMethod,
                    installments: updatedOrder.installments,
                    address: updatedOrder.address,
                    // Map other fields if necessary
                })
                .eq('order_number', updatedOrder.id);

            if (error) throw error;

            setOrders(prev => prev.map(o => o.id === updatedOrder.id ? { ...updatedOrder, user: (o as OrderWithUser).user } : o));

            toast({
                title: "Pedido atualizado",
                description: "As alterações foram salvas com sucesso.",
                className: "bg-green-50 border-green-200 text-green-900"
            });
        } catch (error) {
            console.error('Error updating order:', error);
            toast({
                title: "Erro ao salvar",
                description: "Não foi possível salvar as alterações.",
                variant: "destructive"
            });
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragId(null);

        if (over && active.id) {
            const orderId = active.id as string;
            const newStatus = over.id as Order['status'];
            const order = orders.find((o) => o.id === orderId);

            if (order && order.status !== newStatus) {
                updateOrderStatus(orderId, newStatus);
            }
        }
    };

    const stats = {
        total: orders.length,
        pending: orders.filter(o => ['processando', 'separando'].includes(o.status)).length,
        revenue: orders.reduce((acc, curr) => acc + curr.total, 0),
    };

    const ordersByStatus = {
        processando: orders.filter((o) => o.status === 'processando'),
        separando: orders.filter((o) => o.status === 'separando'),
        em_rota: orders.filter((o) => o.status === 'em_rota' || o.status === 'saiu_para_entrega'),
        entregue: orders.filter((o) => o.status === 'entregue'),
        cancelado: orders.filter((o) => o.status === 'cancelado'),
    };

    const activeOrder = activeDragId ? orders.find(o => o.id === activeDragId) : null;

    // Mobile filtered orders
    const mobileFilteredOrders = mobileStatusFilter === 'todos'
        ? orders
        : orders.filter(o => o.status === mobileStatusFilter);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] space-y-4 sm:space-y-6">
            {/* Header & Stats */}
            <div className="flex-none space-y-3 sm:space-y-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Painel de Pedidos</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">Gerencie o fluxo de pedidos da loja em tempo real</p>
                </div>

                {/* Stats Cards - 2 columns on mobile, 4 on desktop */}
                <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-yellow-50/50 border-yellow-100">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium text-yellow-800">Processando</CardTitle>
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl sm:text-2xl font-bold text-yellow-900">{ordersByStatus.processando.length}</div>
                            <p className="text-[10px] sm:text-xs text-yellow-700">Aguardando separação</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-50/50 border-blue-100">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium text-blue-800">Separando</CardTitle>
                            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl sm:text-2xl font-bold text-blue-900">{ordersByStatus.separando.length}</div>
                            <p className="text-[10px] sm:text-xs text-blue-700">Em preparação</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-purple-50/50 border-purple-100">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium text-purple-800">Em Rota</CardTitle>
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl sm:text-2xl font-bold text-purple-900">{ordersByStatus.em_rota.length}</div>
                            <p className="text-[10px] sm:text-xs text-purple-700">Saiu para entrega</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-green-50/50 border-green-100">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium text-green-800">Entregues</CardTitle>
                            <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl sm:text-2xl font-bold text-green-900">{ordersByStatus.entregue.length}</div>
                            <p className="text-[10px] sm:text-xs text-green-700">Finalizados hoje</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Mobile Status Filter Tabs */}
                <div className="md:hidden flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                    <Button
                        variant={mobileStatusFilter === 'todos' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMobileStatusFilter('todos')}
                        className="flex-shrink-0 h-9"
                    >
                        Todos ({orders.length})
                    </Button>
                    <Button
                        variant={mobileStatusFilter === 'processando' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMobileStatusFilter('processando')}
                        className="flex-shrink-0 h-9"
                    >
                        <Clock className="h-3 w-3 mr-1" />
                        Processando
                    </Button>
                    <Button
                        variant={mobileStatusFilter === 'separando' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMobileStatusFilter('separando')}
                        className="flex-shrink-0 h-9"
                    >
                        <Package className="h-3 w-3 mr-1" />
                        Separando
                    </Button>
                    <Button
                        variant={mobileStatusFilter === 'em_rota' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMobileStatusFilter('em_rota')}
                        className="flex-shrink-0 h-9"
                    >
                        <MapPin className="h-3 w-3 mr-1" />
                        Em Rota
                    </Button>
                    <Button
                        variant={mobileStatusFilter === 'entregue' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMobileStatusFilter('entregue')}
                        className="flex-shrink-0 h-9"
                    >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Entregues
                    </Button>
                    <Button
                        variant={mobileStatusFilter === 'cancelado' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMobileStatusFilter('cancelado')}
                        className="flex-shrink-0 h-9"
                    >
                        <XCircle className="h-3 w-3 mr-1" />
                        Cancelados
                    </Button>
                </div>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden flex-1 overflow-y-auto space-y-3">
                {mobileFilteredOrders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum pedido encontrado</p>
                    </div>
                ) : (
                    mobileFilteredOrders.map((order) => {
                        const config = statusConfig[order.status as keyof typeof statusConfig];
                        const StatusIcon = config.icon;

                        return (
                            <Card key={order.id} className="bg-white shadow-sm border-gray-100">
                                <CardHeader className="p-4 pb-2 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={cn("font-mono text-xs", config.color)}>
                                                <StatusIcon className="h-3 w-3 mr-1" />
                                                {config.label}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-base font-bold text-green-600">
                                                R$ {order.total.toFixed(2).replace('.', ',')}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 -mr-2"
                                                onClick={() => setEditingOrder(order)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <User className="h-3 w-3 text-muted-foreground" />
                                            <span>{order.user.name || 'Cliente sem nome'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <MapPin className="h-3 w-3" />
                                            <span className="truncate">
                                                {order.address.neighborhood}, {order.address.city}
                                            </span>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-4 pt-2">
                                    <div className="space-y-2">
                                        {/* Status Change Select */}
                                        <Select
                                            value={order.status}
                                            onValueChange={(value) => updateOrderStatus(order.id, value as Order['status'])}
                                        >
                                            <SelectTrigger className="w-full h-10">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="processando">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4" />
                                                        Processando
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="separando">
                                                    <div className="flex items-center gap-2">
                                                        <Package className="h-4 w-4" />
                                                        Separando
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="em_rota">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4" />
                                                        Em Rota
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="entregue">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        Entregue
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full h-9 text-xs"
                                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                        >
                                            {expandedOrder === order.id ? 'Ocultar detalhes' : 'Ver detalhes'}
                                        </Button>

                                        {/* Expanded Details */}
                                        {expandedOrder === order.id && (
                                            <div className="pt-2 text-xs space-y-3 border-t">
                                                {/* Items List */}
                                                <div className="space-y-1 bg-gray-50 p-3 rounded">
                                                    <p className="font-semibold text-gray-700 mb-2">Itens do Pedido:</p>
                                                    {order.items.map((item: CartItem, idx: number) => (
                                                        <div key={idx} className="flex justify-between text-gray-600">
                                                            <span>{item.quantity}x {item.name}</span>
                                                            <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Full Address */}
                                                <div className="text-gray-600 bg-gray-50 p-3 rounded">
                                                    <p className="font-semibold text-gray-700 mb-1">Endereço:</p>
                                                    <p>{order.address.street}, {order.address.number}</p>
                                                    {order.address.complement && <p>{order.address.complement}</p>}
                                                    <p>{order.address.neighborhood}, {order.address.city}</p>
                                                </div>

                                                {/* Whatsapp Button */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full h-10 gap-2 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                                                        onClick={() => window.open(`https://wa.me/55${order.user.phone}`, '_blank')}
                                                    >
                                                        <MessageCircle className="h-4 w-4" />
                                                        WhatsApp
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full h-10 gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                                                        onClick={() => setEditingOrder(order)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                        Editar
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Desktop Kanban Board */}
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="hidden md:block flex-1 overflow-x-auto overflow-y-hidden pb-4">
                    <div className="flex h-full gap-6 min-w-[1000px]">
                        {Object.entries(ordersByStatus).map(([status, statusOrders]) => {
                            const config = statusConfig[status as keyof typeof statusConfig];
                            return (
                                <DroppableColumn
                                    key={status}
                                    id={status}
                                    status={status}
                                    orders={statusOrders}
                                    statsConfig={config}
                                    expandedOrder={expandedOrder}
                                    setExpandedOrder={setExpandedOrder}
                                    updateOrderStatus={updateOrderStatus}
                                    onEdit={setEditingOrder}
                                />
                            );
                        })}
                    </div>
                </div>

                <DragOverlay>
                    {activeOrder ? (
                        <Card className="bg-white shadow-xl rotate-2 w-80 opacity-90 cursor-grabbing">
                            <CardHeader className="p-4 pb-2 space-y-2">
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline" className="font-mono text-xs">
                                        {activeOrder.id.slice(-6)}
                                    </Badge>
                                    <span className="text-sm font-bold text-green-600">
                                        R$ {activeOrder.total.toFixed(2).replace('.', ',')}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <User className="h-3 w-3 text-muted-foreground" />
                                        <span className="truncate">{activeOrder.user.name || 'Cliente sem nome'}</span>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    ) : null}
                </DragOverlay>
            </DndContext>

            <OrderEditDialog
                open={!!editingOrder}
                onOpenChange={(open) => !open && setEditingOrder(null)}
                order={editingOrder}
                onSave={handleSaveOrder}
            />
        </div>
    );
}
