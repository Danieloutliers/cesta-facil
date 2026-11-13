import { useState, useEffect, useMemo } from 'react';
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
    Pencil,
    LayoutList,
    Kanban,
    Search,
    Filter,
    Download,
    Plus,
    Printer,
    DollarSign,
    RefreshCw,
    Calendar,
    ArrowUpDown,
    Check,
    CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrderEditDialog } from '@/components/admin/OrderEditDialog';
import { ReceiptModal } from '@/components/admin/ReceiptModal';
import { Link } from 'react-router-dom';
import { onOrderDelivered } from '@/services/referralService';
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
    rawId?: string;
    deliveryDate?: string;
    user: {
        phone: string;
        name?: string;
    };
}

const statusConfig = {
    processando: {
        label: 'Processando',
        accentBar: 'bg-amber-500',
        color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800',
        badgeBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
        textColor: 'text-amber-700 dark:text-amber-400',
        icon: Clock,
        next: 'separando' as const
    },
    separando: {
        label: 'Separando',
        accentBar: 'bg-blue-500',
        color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800',
        badgeBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
        textColor: 'text-blue-700 dark:text-blue-400',
        icon: Package,
        next: 'em_rota' as const
    },
    em_rota: {
        label: 'Em Rota',
        accentBar: 'bg-purple-500',
        color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-800',
        badgeBg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800',
        textColor: 'text-purple-700 dark:text-purple-400',
        icon: MapPin,
        next: 'entregue' as const
    },
    entregue: {
        label: 'Entregue',
        accentBar: 'bg-emerald-500',
        color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
        textColor: 'text-emerald-700 dark:text-emerald-400',
        icon: CheckCircle2,
        next: null
    },
    cancelado: {
        label: 'Cancelado',
        accentBar: 'bg-red-500',
        color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800',
        badgeBg: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800',
        textColor: 'text-red-700 dark:text-red-400',
        icon: XCircle,
        next: null
    },
};

// --- Draggable Kanban Card Component ---
const DraggableOrderCard = ({
    order,
    updateOrderStatus,
    expandedOrder,
    setExpandedOrder,
    onEdit
}: {
    order: OrderWithUser;
    updateOrderStatus: (orderId: string, newStatus: Order['status']) => void;
    expandedOrder: string | null;
    setExpandedOrder: (id: string | null) => void;
    onEdit: (order: Order) => void;
}) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: order.id,
        data: { order }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.processando;
    const isExpanded = expandedOrder === order.id;

    const formatPaymentMethod = (method?: string) => {
        if (!method) return 'A Combinar';
        if (method === 'carne') return 'Carnê Digital';
        if (method === 'pix') return 'PIX';
        if (method === 'cartao') return 'Cartão';
        if (method === 'dinheiro') return 'Dinheiro';
        return method;
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={cn(
                "touch-none group/card",
                isDragging && "opacity-30 scale-95 z-50 pointer-events-none"
            )}
        >
            <div className={cn(
                "relative bg-card rounded-xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md hover:border-primary/40",
                isExpanded ? "border-primary/50 shadow-sm ring-1 ring-primary/20" : "border-border/80"
            )}>
                {/* Thin top status indicator bar */}
                <div className={cn("h-1 w-full transition-opacity", config.accentBar)} />

                <div className="p-3.5 space-y-2.5">
                    {/* Header: Order ID + Total */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-mono text-xs font-bold text-foreground bg-muted/60 dark:bg-muted/40 px-2 py-0.5 rounded-md border border-border/60">
                                #{order.id.slice(-6)}
                            </span>
                            {order.paymentMethod && (
                                <span className="text-[10px] font-medium text-muted-foreground truncate">
                                    {formatPaymentMethod(order.paymentMethod)}
                                    {order.installments && order.installments > 1 ? ` (${order.installments}x)` : ''}
                                </span>
                            )}
                        </div>

                        <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">
                            R$ {order.total.toFixed(2).replace('.', ',')}
                        </span>
                    </div>

                    {/* Customer & Location */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground truncate">
                            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{order.user.name || 'Cliente'}</span>
                        </div>

                        {order.address && (
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                <MapPin className="h-3 w-3 shrink-0 opacity-70" />
                                <span className="truncate">
                                    {order.address.neighborhood || order.address.city || 'Endereço não informado'}
                                </span>
                            </div>
                        )}

                        {/* Unboxed Metadata Line with typographic separators */}
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-0.5">
                            <span className="tabular-nums font-medium text-foreground/80">
                                {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'itens'}
                            </span>
                            <span aria-hidden="true" className="opacity-40">·</span>
                            <span className="tabular-nums">
                                {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {order.deliveryDate && (
                                <>
                                    <span aria-hidden="true" className="opacity-40">·</span>
                                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                                        Entrega: {new Date(order.deliveryDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Actions and Workflow Step */}
                    <div className="border-t border-border/60 pt-2.5 space-y-2">
                        {config.next && (
                            <Button
                                size="sm"
                                className="w-full h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs gap-1.5 font-medium transition-all"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={() => updateOrderStatus(order.id, config.next!)}
                            >
                                <span>Avançar para {statusConfig[config.next].label}</span>
                                <ArrowRight className="h-3 w-3" />
                            </Button>
                        )}

                        <div className="flex items-center justify-between gap-1.5">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                            >
                                <ChevronDown className={cn("h-3 w-3 mr-1 transition-transform duration-200", isExpanded && "rotate-180")} />
                                {isExpanded ? 'Ocultar itens' : 'Ver itens'}
                            </Button>

                            <div className="flex items-center gap-1 shrink-0">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border-border/80 cursor-pointer"
                                    title="Editar pedido"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={() => onEdit(order)}
                                >
                                    <Pencil className="h-3 w-3" />
                                </Button>

                                {order.user?.phone && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-border/80 cursor-pointer"
                                        title="WhatsApp do cliente"
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onClick={() => window.open(`https://wa.me/55${order.user.phone.replace(/\D/g, '')}`, '_blank')}
                                    >
                                        <MessageCircle className="h-3 w-3" />
                                    </Button>
                                )}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
                                    asChild
                                    onPointerDown={(e) => e.stopPropagation()}
                                >
                                    <Link to={`/admin/orders/${order.id}`}>
                                        Detalhes
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {/* Collapsible Details Panel */}
                        {isExpanded && (
                            <div className="pt-2 text-[11px] space-y-2 animate-in fade-in-50 duration-150 border-t border-border/60">
                                <div className="space-y-1 bg-muted/40 p-2.5 rounded-lg border border-border/40">
                                    <span className="font-semibold text-foreground text-[10px] uppercase tracking-wider block mb-1">
                                        Itens Selecionados ({order.items?.length || 0})
                                    </span>
                                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                                        {order.items?.map((item: CartItem, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center text-muted-foreground text-xs py-0.5 border-b border-border/20 last:border-0">
                                                <span className="truncate pr-2 font-normal text-foreground">
                                                    <span className="font-semibold text-primary">{item.quantity}x</span> {item.name}
                                                </span>
                                                <span className="tabular-nums shrink-0 font-medium text-foreground text-[11px]">
                                                    R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {order.address && (
                                    <div className="text-muted-foreground bg-muted/20 p-2 rounded-lg border border-border/30 text-[11px]">
                                        <p className="font-medium text-foreground">
                                            {order.address.street}, {order.address.number}
                                        </p>
                                        {order.address.complement && <p>{order.address.complement}</p>}
                                        <p>{order.address.neighborhood} · {order.address.city}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Droppable Column Component ---
const DroppableColumn = ({
    id,
    orders,
    statsConfig,
    expandedOrder,
    setExpandedOrder,
    updateOrderStatus,
    onEdit
}: {
    id: string;
    orders: OrderWithUser[];
    statsConfig: typeof statusConfig[keyof typeof statusConfig];
    expandedOrder: string | null;
    setExpandedOrder: (id: string | null) => void;
    updateOrderStatus: (orderId: string, newStatus: Order['status']) => void;
    onEdit: (order: Order) => void;
}) => {
    const { setNodeRef, isOver } = useDroppable({ id });
    const StatusIcon = statsConfig.icon;
    const totalColumnRevenue = orders.reduce((acc, curr) => acc + curr.total, 0);

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex flex-col w-80 shrink-0 rounded-2xl border transition-all duration-200 p-3 h-full min-h-[620px]",
                isOver
                    ? "bg-primary/5 border-primary shadow-md ring-2 ring-primary/20"
                    : "bg-muted/20 dark:bg-muted/10 border-border/70"
            )}
        >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-2 px-1 border-b border-border/60">
                <div className="flex items-center gap-2 min-w-0">
                    <div className={cn("p-1.5 rounded-lg border shadow-xs shrink-0", statsConfig.badgeBg)}>
                        <StatusIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-xs text-foreground leading-tight truncate">
                            {statsConfig.label}
                        </h3>
                        <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
                            R$ {totalColumnRevenue.toFixed(2).replace('.', ',')}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-foreground bg-card dark:bg-muted/40 border border-border/80 px-2.5 py-0.5 rounded-full tabular-nums shadow-xs">
                        {orders.length}
                    </span>
                </div>
            </div>

            {/* Cards Container */}
            <ScrollArea className="flex-1 -mx-1 px-1">
                <div className="space-y-3 pb-4">
                    {orders.map((order) => (
                        <DraggableOrderCard
                            key={order.id}
                            order={order}
                            updateOrderStatus={updateOrderStatus}
                            expandedOrder={expandedOrder}
                            setExpandedOrder={setExpandedOrder}
                            onEdit={onEdit}
                        />
                    ))}
                    {orders.length === 0 && (
                        <div className="text-center py-16 px-4 text-muted-foreground text-xs border border-dashed border-border/60 rounded-xl bg-card/30 flex flex-col items-center justify-center gap-2">
                            <StatusIcon className="h-6 w-6 opacity-30" />
                            <span>Arraste um pedido aqui</span>
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
    const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('todos');
    const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const { toast } = useToast();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const loadOrders = async () => {
        try {
            setLoading(true);
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

            const transformedOrders: OrderWithUser[] = (data || []).map((row: Record<string, unknown>) => ({
                id: String(row.order_number || row.id),
                rawId: row.id ? String(row.id) : undefined,
                items: (row.items as CartItem[]) || [],
                budget: Number(row.budget || 0),
                total: Number(row.total || 0),
                savings: Number(row.savings || 0),
                status: (row.status as Order['status']) || 'processando',
                address: (row.address as Address) || ({} as Address),
                missingItemPreference: row.missing_item_preference as 'substituir' | 'remover',
                createdAt: String(row.created_at || new Date().toISOString()),
                estimatedDelivery: row.estimated_delivery ? String(row.estimated_delivery) : undefined,
                deliveryDate: row.delivery_date ? String(row.delivery_date) : undefined,
                paymentMethod: row.payment_method as Order['paymentMethod'],
                installments: row.installments ? Number(row.installments) : undefined,
                paymentDay: row.payment_day ? Number(row.payment_day) : undefined,
                paymentDate: row.payment_date ? String(row.payment_date) : undefined,
                user: {
                    phone: (row.user as { phone?: string; name?: string })?.phone || 'N/A',
                    name: (row.user as { phone?: string; name?: string })?.name || 'Cliente',
                },
            }));

            setOrders(transformedOrders);
        } catch (error) {
            console.error('Error loading orders:', error);
            toast({
                title: "Erro ao carregar pedidos",
                description: "Verifique a conexão com o Supabase.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();

        // Realtime subscription
        const subscription = supabase
            .channel(`admin-orders-${Math.random().toString(36).slice(2)}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                void loadOrders();
            })
            .subscribe();

        return () => {
            void supabase.removeChannel(subscription);
        };
        // Mount-only subscription; realtime callbacks always use the latest loadOrders.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
        const order = orders.find(o => o.id === orderId);

        // Optimistic update
        setOrders((prev) =>
            prev.map((o) =>
                o.id === orderId ? { ...o, status: newStatus } : o
            )
        );

        try {
            // Prefer the immutable UUID; order_number is a human readable key and
            // older rows may not have one. Falling back covers both schemas.
            let updatedRows: Array<{ id: string }> | null = null;
            let updateError: { message: string } | null = null;

            if (order?.rawId) {
                const { data, error } = await supabase
                    .from('orders')
                    .update({ status: newStatus })
                    .eq('id', order.rawId)
                    .select('id');
                updatedRows = data;
                updateError = error;
            }

            if (!updatedRows || updatedRows.length === 0) {
                const { data, error } = await supabase
                    .from('orders')
                    .update({ status: newStatus })
                    .eq('order_number', orderId)
                    .select('id');
                if (error) updateError = error;
                updatedRows = data ?? updatedRows;
            }

            if (updateError) throw updateError;
            if (!updatedRows || updatedRows.length === 0) {
                throw new Error('Pedido não encontrado no banco de dados.');
            }

            // If order was delivered, release referral cashback for cash/PIX payments
            if (newStatus === 'entregue') {
                await onOrderDelivered(orderId);
                if (order?.rawId && order.rawId !== orderId) {
                    await onOrderDelivered(order.rawId);
                }
            }

            // WhatsApp notification is best-effort and must not block the update.
            if (order?.user.phone) {
                try {
                    const message = await getWhatsAppMessage(newStatus, order);
                    const phoneNumber = `55${order.user.phone.replace(/\D/g, '')}`;
                    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

                    const sentByBot = await sendWhatsAppMessage(phoneNumber, message);

                    if (sentByBot) {
                        toast({
                            title: "Status Atualizado ✅",
                            description: `Mensagem enviada automaticamente para ${order.user.name}`,
                            className: "bg-emerald-50 border-emerald-200 text-emerald-900"
                        });
                    } else {
                        toast({
                            title: `Status: ${statusConfig[newStatus]?.label || newStatus}`,
                            description: `Atualizado no Supabase. Notifique o cliente:`,
                            action: (
                                <ToastAction altText="Enviar WhatsApp" onClick={() => window.open(whatsappUrl, '_blank')}>
                                    <div className="flex items-center gap-1.5 font-medium">
                                        <MessageCircle className="h-4 w-4 text-emerald-600" />
                                        Enviar WhatsApp
                                    </div>
                                </ToastAction>
                            ),
                        });
                    }
                } catch (whatsappError) {
                    console.error('Error sending status notification:', whatsappError);
                }
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast({
                title: "Erro ao atualizar status",
                description: error instanceof Error ? error.message : undefined,
                variant: "destructive"
            });
            await loadOrders(); // Revert on error
        }
    };

    const handleSaveOrder = async (updatedOrder: Order) => {
        try {
            const existing = orders.find(o => o.id === updatedOrder.id);
            const query = supabase
                .from('orders')
                .update({
                    items: updatedOrder.items,
                    total: updatedOrder.total,
                    status: updatedOrder.status,
                    payment_method: updatedOrder.paymentMethod,
                    installments: updatedOrder.installments,
                    address: updatedOrder.address,
                });

            const { data, error } = existing?.rawId
                ? await query.eq('id', existing.rawId).select('id')
                : await query.eq('order_number', updatedOrder.id).select('id');

            if (error) throw error;
            if (!data || data.length === 0) {
                throw new Error('Pedido não encontrado no banco de dados.');
            }

            setOrders(prev =>
                prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o)
            );

            toast({
                title: "Pedido salvo!",
                description: "Alterações gravadas no Supabase com sucesso.",
                className: "bg-emerald-50 border-emerald-200 text-emerald-900"
            });
        } catch (error) {
            console.error('Error updating order:', error);
            toast({
                title: "Erro ao salvar",
                description: error instanceof Error ? error.message : "Não foi possível salvar as alterações.",
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

    // Filtered orders based on search, status and date
    const filteredOrders = useMemo(() => {
        const now = new Date();

        return orders.filter(order => {
            // Text search
            const matchSearch =
                order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.user.phone.includes(searchTerm) ||
                order.address?.street?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.address?.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase());

            // Status filter
            const matchStatus =
                selectedStatusFilter === 'todos' ||
                (selectedStatusFilter === 'em_rota' ? (order.status === 'em_rota' || order.status === 'saiu_para_entrega') : order.status === selectedStatusFilter);

            // Date filter
            let matchDate = true;
            if (dateRangeFilter !== 'all') {
                const orderDate = new Date(order.createdAt);
                const diffHours = (now.getTime() - orderDate.getTime()) / (1000 * 3600);

                if (dateRangeFilter === 'today') {
                    matchDate = orderDate.toDateString() === now.toDateString();
                } else if (dateRangeFilter === '7days') {
                    matchDate = diffHours <= 24 * 7;
                } else if (dateRangeFilter === '30days') {
                    matchDate = diffHours <= 24 * 30;
                }
            }

            return matchSearch && matchStatus && matchDate;
        });
    }, [orders, searchTerm, selectedStatusFilter, dateRangeFilter]);

    // Grouping for Kanban columns
    const kanbanColumns = useMemo(() => ({
        processando: filteredOrders.filter((o) => o.status === 'processando'),
        separando: filteredOrders.filter((o) => o.status === 'separando'),
        em_rota: filteredOrders.filter((o) => o.status === 'em_rota' || o.status === 'saiu_para_entrega'),
        entregue: filteredOrders.filter((o) => o.status === 'entregue'),
        cancelado: filteredOrders.filter((o) => o.status === 'cancelado'),
    }), [filteredOrders]);

    // Overall aggregate stats
    const stats = useMemo(() => {
        const totalCount = orders.length;
        const totalRevenue = orders
            .filter((order) => order.status !== 'cancelado')
            .reduce((acc, curr) => acc + curr.total, 0);
        const inProgress = orders.filter(o => ['processando', 'separando', 'em_rota', 'saiu_para_entrega'].includes(o.status)).length;
        const delivered = orders.filter(o => o.status === 'entregue').length;

        return {
            totalCount,
            totalRevenue,
            inProgress,
            delivered,
        };
    }, [orders]);

    const activeOrder = activeDragId ? orders.find(o => o.id === activeDragId) : null;

    // Export orders to CSV
    const exportToCSV = () => {
        if (orders.length === 0) {
            toast({ title: "Nenhum pedido para exportar", variant: "destructive" });
            return;
        }

        const headers = ["ID", "Cliente", "Telefone", "Data", "Status", "Forma_Pagamento", "Total_R$", "Itens_Qtd"];
        const rows = orders.map(o => [
            o.id,
            `"${o.user.name || 'Cliente'}"`,
            o.user.phone,
            new Date(o.createdAt).toLocaleDateString('pt-BR'),
            o.status,
            o.paymentMethod || 'Não informado',
            o.total.toFixed(2),
            o.items.length
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `pedidos_cesta_facil_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
            title: "Exportação Concluída 📄",
            description: `${orders.length} pedidos exportados para CSV com sucesso.`
        });
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4.5rem)] space-y-4">
            {/* Top Bar / Header */}
            <div className="flex-none space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                                Gestão & Esteira de Pedidos
                            </h1>
                            <Badge variant="outline" className="font-mono text-xs">
                                {orders.length} pedidos
                            </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                            Visualize, despache e acompanhe todos os pedidos da loja em tempo real
                        </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {/* View Switcher Tabs */}
                        <div className="flex items-center p-0.5 bg-muted rounded-lg border border-border shrink-0">
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer",
                                    viewMode === 'kanban'
                                        ? "bg-card text-foreground shadow-xs font-semibold"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Kanban className="h-3.5 w-3.5" />
                                <span>Esteira</span>
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer",
                                    viewMode === 'table'
                                        ? "bg-card text-foreground shadow-xs font-semibold"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <LayoutList className="h-3.5 w-3.5" />
                                <span>Tabela Geral</span>
                            </button>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={exportToCSV}
                            className="h-9 gap-1.5 text-xs"
                            title="Exportar dados para Excel/CSV"
                        >
                            <Download className="h-3.5 w-3.5" />
                            <span className="hidden md:inline">Exportar</span>
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadOrders}
                            disabled={loading}
                            className="h-9 gap-1.5 text-xs"
                        >
                            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                            <span className="hidden md:inline">Atualizar</span>
                        </Button>
                    </div>
                </div>

                {/* KPI Metrics Strip */}
                <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                    <Card className="border border-border/80 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Total Pedidos
                            </CardTitle>
                            <ShoppingBag className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <div className="text-2xl font-bold tracking-tight tabular-nums">
                                {loading ? '...' : stats.totalCount}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                Cadastrados no sistema
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border border-border/80 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Em Andamento
                            </CardTitle>
                            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
                                {loading ? '...' : stats.inProgress}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                Processando / Separação / Rota
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border border-border/80 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Entregues
                            </CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                                {loading ? '...' : stats.delivered}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                Pedidos finalizados
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border border-border/80 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Receita Total
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <div className="text-2xl font-bold tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400">
                                {loading ? '...' : `R$ ${stats.totalRevenue.toFixed(2).replace('.', ',')}`}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                Volume movimentado
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por ID, cliente, telefone ou bairro..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-9 text-xs"
                        />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                        {/* Status filter dropdown */}
                        <Select
                            value={selectedStatusFilter}
                            onValueChange={setSelectedStatusFilter}
                        >
                            <SelectTrigger className="h-9 w-[150px] text-xs">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos os Status</SelectItem>
                                <SelectItem value="processando">Processando</SelectItem>
                                <SelectItem value="separando">Separando</SelectItem>
                                <SelectItem value="em_rota">Em Rota</SelectItem>
                                <SelectItem value="entregue">Entregue</SelectItem>
                                <SelectItem value="cancelado">Cancelado</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Date filter dropdown */}
                        <Select
                            value={dateRangeFilter}
                            onValueChange={(val: 'all' | 'today' | '7days' | '30days') => setDateRangeFilter(val)}
                        >
                            <SelectTrigger className="h-9 w-[130px] text-xs">
                                <SelectValue placeholder="Período" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todo período</SelectItem>
                                <SelectItem value="today">Hoje</SelectItem>
                                <SelectItem value="7days">Últimos 7 dias</SelectItem>
                                <SelectItem value="30days">Últimos 30 dias</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Main Area: Kanban Mode vs Table Mode */}
            {viewMode === 'kanban' ? (
                <div className="flex-1 min-h-0 overflow-hidden">
                    {/* Desktop Kanban Drag & Drop Board */}
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="hidden md:block h-full overflow-x-auto overflow-y-hidden pb-2">
                            <div className="flex h-full gap-4 min-w-[1300px]">
                                {Object.entries(kanbanColumns).map(([status, columnOrders]) => {
                                    const config = statusConfig[status as keyof typeof statusConfig];
                                    return (
                                        <DroppableColumn
                                            key={status}
                                            id={status}
                                            orders={columnOrders}
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
                                <Card className="bg-card shadow-2xl rotate-2 w-80 opacity-95 cursor-grabbing border-primary/50">
                                    <CardHeader className="p-3.5 pb-2 space-y-1">
                                        <div className="flex justify-between items-start">
                                            <Badge variant="outline" className="font-mono text-xs">
                                                #{activeOrder.id.slice(-6)}
                                            </Badge>
                                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                R$ {activeOrder.total.toFixed(2).replace('.', ',')}
                                            </span>
                                        </div>
                                        <div className="text-xs font-semibold text-foreground truncate">
                                            {activeOrder.user.name || 'Cliente'}
                                        </div>
                                    </CardHeader>
                                </Card>
                            ) : null}
                        </DragOverlay>
                    </DndContext>

                    {/* Mobile List View for Kanban */}
                    <div className="md:hidden flex-1 overflow-y-auto space-y-3 pb-6">
                        {filteredOrders.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground text-xs">
                                Nenhum pedido encontrado com os filtros atuais.
                            </div>
                        ) : (
                            filteredOrders.map((order) => {
                                const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.processando;
                                const StatusIcon = config.icon;

                                return (
                                    <Card key={order.id} className="bg-card border-border/80 shadow-xs">
                                        <CardHeader className="p-4 pb-2 space-y-2">
                                            <div className="flex justify-between items-start">
                                                <Badge variant="outline" className={cn("font-mono text-xs", config.color)}>
                                                    <StatusIcon className="h-3 w-3 mr-1" />
                                                    {config.label}
                                                </Badge>
                                                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                    R$ {order.total.toFixed(2).replace('.', ',')}
                                                </span>
                                            </div>

                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                                                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                                                    <span>{order.user.name || 'Cliente sem nome'}</span>
                                                </div>
                                                {order.address && (
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <MapPin className="h-3 w-3" />
                                                        <span className="truncate">
                                                            {order.address.neighborhood}, {order.address.city}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </CardHeader>

                                        <CardContent className="p-4 pt-1 space-y-2.5">
                                            <Select
                                                value={order.status}
                                                onValueChange={(val) => updateOrderStatus(order.id, val as Order['status'])}
                                            >
                                                <SelectTrigger className="w-full h-9 text-xs">
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

                                            <div className="grid grid-cols-2 gap-2 pt-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 text-xs"
                                                    onClick={() => setEditingOrder(order)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                                                </Button>
                                                {order.user?.phone && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                                                        onClick={() => window.open(`https://wa.me/55${order.user.phone.replace(/\D/g, '')}`, '_blank')}
                                                    >
                                                        <MessageCircle className="h-3.5 w-3.5 mr-1" /> WhatsApp
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </div>
            ) : (
                /* Table View Mode (Complete Management Table) */
                <Card className="flex-1 min-h-0 border-border/80 shadow-xs flex flex-col overflow-hidden">
                    <ScrollArea className="flex-1">
                        <Table>
                            <TableHeader className="bg-muted/40 sticky top-0 z-10">
                                <TableRow className="hover:bg-transparent border-border/70">
                                    <TableHead className="text-xs font-semibold w-24">Pedido</TableHead>
                                    <TableHead className="text-xs font-semibold">Cliente</TableHead>
                                    <TableHead className="text-xs font-semibold">Endereço</TableHead>
                                    <TableHead className="text-xs font-semibold text-center">Itens</TableHead>
                                    <TableHead className="text-xs font-semibold text-right">Total</TableHead>
                                    <TableHead className="text-xs font-semibold">Pagamento</TableHead>
                                    <TableHead className="text-xs font-semibold">Data</TableHead>
                                    <TableHead className="text-xs font-semibold">Status</TableHead>
                                    <TableHead className="text-xs font-semibold text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-32 text-center text-xs text-muted-foreground">
                                            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                                            Carregando pedidos do Supabase...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-32 text-center text-xs text-muted-foreground">
                                            <ShoppingBag className="h-6 w-6 mx-auto mb-2 opacity-40" />
                                            Nenhum pedido encontrado com os filtros aplicados.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredOrders.map((order) => {
                                        const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.processando;
                                        const dateStr = new Date(order.createdAt).toLocaleDateString('pt-BR');

                                        return (
                                            <TableRow key={order.id} className="border-border/60 hover:bg-muted/30 transition-colors">
                                                {/* ID */}
                                                <TableCell className="py-3 font-mono text-xs font-semibold">
                                                    <Link
                                                        to={`/admin/orders/${order.id}`}
                                                        className="text-primary hover:underline"
                                                    >
                                                        #{order.id.slice(-6)}
                                                    </Link>
                                                </TableCell>

                                                {/* Customer */}
                                                <TableCell className="py-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-medium text-foreground truncate max-w-[150px]">
                                                            {order.user.name || 'Cliente'}
                                                        </span>
                                                        <span className="text-[11px] text-muted-foreground font-mono">
                                                            {order.user.phone || 'Sem telefone'}
                                                        </span>
                                                    </div>
                                                </TableCell>

                                                {/* Address */}
                                                <TableCell className="py-3">
                                                    <div className="flex flex-col text-xs text-muted-foreground truncate max-w-[200px]">
                                                        <span className="truncate text-foreground">
                                                            {order.address?.street ? `${order.address.street}, ${order.address.number}` : '-'}
                                                        </span>
                                                        <span className="text-[11px] truncate">
                                                            {order.address?.neighborhood || ''} {order.address?.city ? `· ${order.address.city}` : ''}
                                                        </span>
                                                    </div>
                                                </TableCell>

                                                {/* Items Count */}
                                                <TableCell className="py-3 text-center tabular-nums text-xs font-medium">
                                                    <Badge variant="outline" className="text-[11px] bg-muted/40">
                                                        {order.items?.length || 0}
                                                    </Badge>
                                                </TableCell>

                                                {/* Total */}
                                                <TableCell className="py-3 text-right tabular-nums text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                    R$ {order.total.toFixed(2).replace('.', ',')}
                                                </TableCell>

                                                {/* Payment */}
                                                <TableCell className="py-3">
                                                    <span className="text-xs font-medium capitalize text-muted-foreground">
                                                        {order.paymentMethod === 'carne' ? 'Carnê Digital' :
                                                            order.paymentMethod === 'cartao' ? 'Cartão' :
                                                            order.paymentMethod === 'pix' ? 'PIX' :
                                                            order.paymentMethod === 'dinheiro' ? 'Dinheiro' : (order.paymentMethod || '-')}
                                                        {order.installments && order.installments > 1 ? ` (${order.installments}x)` : ''}
                                                    </span>
                                                </TableCell>

                                                {/* Date */}
                                                <TableCell className="py-3 text-xs text-muted-foreground tabular-nums">
                                                    {dateStr}
                                                </TableCell>

                                                {/* Status Selector */}
                                                <TableCell className="py-3">
                                                    <Select
                                                        value={order.status}
                                                        onValueChange={(val) => updateOrderStatus(order.id, val as Order['status'])}
                                                    >
                                                        <SelectTrigger className={cn("h-7 w-[125px] text-[11px] font-medium border", config.color)}>
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
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell className="py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                                            title="Editar pedido"
                                                            onClick={() => setEditingOrder(order)}
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>

                                                        {order.user?.phone && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                                                title="Abrir WhatsApp"
                                                                onClick={() => window.open(`https://wa.me/55${order.user.phone.replace(/\D/g, '')}`, '_blank')}
                                                            >
                                                                <MessageCircle className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}

                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 px-2 text-[11px]"
                                                            asChild
                                                        >
                                                            <Link to={`/admin/orders/${order.id}`}>
                                                                Detalhes
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </Card>
            )}

            {/* Edit Order Modal */}
            <OrderEditDialog
                open={!!editingOrder}
                onOpenChange={(open) => !open && setEditingOrder(null)}
                order={editingOrder}
                onSave={handleSaveOrder}
            />
        </div>
    );
}
