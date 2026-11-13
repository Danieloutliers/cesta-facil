import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, User, Phone, MapPin, Calendar, CreditCard, Package, Pencil, Truck } from 'lucide-react';
import { OrderEditDialog } from '@/components/admin/OrderEditDialog';
import { Order, CartItem, Address, PaymentMethod } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { calculatePaymentSchedule } from '@/lib/financial';
import { getPaymentMethodLabel } from '@/lib/payment';

interface LocalOrder {
    id: string;
    order_number: string;
    created_at: string;
    total: number;
    status: Order['status'];
    items: CartItem[];
    address: Address;
    delivery_date?: string;
    payment_day?: number;
    payment_date?: string;
    payment_method?: PaymentMethod;
    installments?: number;
    user_id: string;
}

interface User {
    id: string;
    name?: string;
    full_name?: string;
    phone: string;
    payment_day?: number;
    last_order_number?: string;
}

const toGlobalOrder = (local: LocalOrder): Order => ({
    id: local.order_number || local.id,
    items: local.items ?? [],
    budget: 0,
    total: Number(local.total) || 0,
    savings: 0,
    status: local.status,
    address: local.address,
    missingItemPreference: 'substituir',
    createdAt: local.created_at,
    paymentMethod: local.payment_method,
    installments: local.installments,
    paymentDay: local.payment_day,
    paymentDate: local.payment_date,
});

export default function OrderDetail() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<LocalOrder | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const { toast } = useToast();

    const fetchOrderDetails = useCallback(async () => {
        if (!orderId) return;
        try {
            setLoading(true);

            let { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('*')
                .eq('order_number', orderId)
                .maybeSingle();

            // Deep links may use the UUID instead of the order number.
            if (!orderData && !orderError && /^[0-9a-f-]{36}$/i.test(orderId)) {
                const byId = await supabase
                    .from('orders')
                    .select('*')
                    .eq('id', orderId)
                    .maybeSingle();
                orderData = byId.data;
                orderError = byId.error;
            }

            if (orderError) throw orderError;
            if (!orderData) {
                setOrder(null);
                return;
            }

            setOrder(orderData as LocalOrder);

            if (orderData.user_id) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', orderData.user_id)
                    .maybeSingle();

                if (userData) setUser(userData as User);
            }
        } catch (error) {
            console.error('Error fetching order details:', error);
            toast({
                title: "Erro ao carregar pedido",
                description: "Não foi possível carregar os detalhes do pedido.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [orderId, toast]);

    useEffect(() => {
        void fetchOrderDetails();
    }, [fetchOrderDetails]);

    const handleSaveOrder = async (updatedOrder: Order) => {
        try {
            if (!order) throw new Error('Pedido não carregado');

            const { data, error } = await supabase
                .from('orders')
                .update({
                    items: updatedOrder.items,
                    total: updatedOrder.total,
                    status: updatedOrder.status,
                    payment_method: updatedOrder.paymentMethod,
                    installments: updatedOrder.installments,
                    address: updatedOrder.address,
                })
                .eq('id', order.id)
                .select('id');

            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Pedido não encontrado');

            // Update local state
            if (order) {
                setOrder({
                    ...order,
                    total: updatedOrder.total,
                    status: updatedOrder.status,
                    payment_method: updatedOrder.paymentMethod,
                    installments: updatedOrder.installments,
                    items: updatedOrder.items,
                    address: updatedOrder.address
                });
            }

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

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'secondary' | 'default' | 'destructive'> = {
            'processando': 'secondary',
            'separando': 'default',
            'em_rota': 'default',
            'saiu_para_entrega': 'default',
            'entregue': 'default',
            'cancelado': 'destructive'
        };
        return variants[status] || 'secondary';
    };

    const getPaymentBadgeColor = (method?: string) => {
        switch (method) {
            case 'credit_card':
            case 'cartao': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'debit_card': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'money':
            case 'dinheiro': return 'bg-green-100 text-green-800 border-green-200';
            case 'carnet':
            case 'carne': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'pix': return 'bg-teal-100 text-teal-800 border-teal-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-96"><div className="text-lg">Carregando...</div></div>;
    }

    if (!order) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Pedido não encontrado.</p>
                <Button onClick={() => navigate(-1)}>Voltar</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Detalhes do Pedido</h1>
                        <p className="text-muted-foreground">#{order.order_number?.slice(-6) || order.id.slice(0, 8)}</p>
                    </div>
                </div>
                <Button
                    onClick={() => setEditingOrder(toGlobalOrder(order))}
                    className="gap-2"
                >
                    <Pencil className="h-4 w-4" />
                    Editar Pedido
                </Button>
            </div>

            {/* Order Summary */}
            <Card className="border-2">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Resumo do Pedido
                        </CardTitle>
                        <Badge variant={getStatusBadge(order.status)}>{order.status}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Data do Pedido</p>
                            <p className="font-medium flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(order.created_at).toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="font-bold text-xl text-green-600">
                                R$ {Number(order.total).toFixed(2).replace('.', ',')}
                            </p>
                        </div>
                        {order.payment_method && (
                            <div>
                                <p className="text-sm text-muted-foreground">Pagamento</p>
                                <Badge className={`border ${getPaymentBadgeColor(order.payment_method)}`}>
                                    {getPaymentMethodLabel(order.payment_method)}
                                </Badge>
                            </div>
                        )}
                        {order.installments && order.installments > 1 && (
                            <div>
                                <p className="text-sm text-muted-foreground">Parcelas</p>
                                <p className="font-medium flex items-center gap-1">
                                    <CreditCard className="h-4 w-4" />
                                    {order.installments}x de R$ {(Number(order.total) / order.installments).toFixed(2).replace('.', ',')}
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Payment Schedule */}
            {(() => {
                const schedule = calculatePaymentSchedule(
                    { ...order, total: Number(order.total) },
                    user
                );
                if (schedule.length > 0) {
                    return (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Cronograma de Vencimentos
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {schedule.map((inst) => (
                                        <div key={inst.number} className="flex justify-between items-center p-3 border rounded-lg bg-muted/20">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{inst.number}ª Parcela</span>
                                                <span className="text-xs text-muted-foreground">
                                                    Vence em: {inst.date.toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                            <span className="font-bold text-primary">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inst.value)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    );
                }
                return null;
            })()}

            {/* Customer Info */}
            {user && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Cliente
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="font-medium text-lg">{user.full_name || user.name || 'Cliente'}</p>
                        <p className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            {user.phone}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Delivery Address */}
            {order.address && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Endereço de Entrega
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            <p className="font-medium">{order.address.street}, {order.address.number}</p>
                            <p className="text-muted-foreground">{order.address.neighborhood}</p>
                            <p className="text-muted-foreground">{order.address.city} - {order.address.state}</p>
                            <p className="text-muted-foreground">CEP: {order.address.cep}</p>
                            {order.address.complement && (
                                <p className="text-sm text-muted-foreground">Complemento: {order.address.complement}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Items */}
            <Card>
                <CardHeader>
                    <CardTitle>Itens do Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {order.items?.map((item: CartItem, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    {item.image && (
                                        <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                                    )}
                                    <div>
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {item.quantity} x R$ {Number(item.price).toFixed(2).replace('.', ',')}
                                        </p>
                                    </div>
                                </div>
                                <p className="font-bold">
                                    R$ {(item.quantity * item.price).toFixed(2).replace('.', ',')}
                                </p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Delivery Info */}
            {order.delivery_date && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Truck className="h-5 w-5" />
                            Informações de Entrega
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Data de Entrega: {new Date(order.delivery_date).toLocaleDateString()}
                        </p>
                    </CardContent>
                </Card>
            )}

            <OrderEditDialog
                open={!!editingOrder}
                onOpenChange={(open) => !open && setEditingOrder(null)}
                order={editingOrder}
                onSave={handleSaveOrder}
            />
        </div>
    );
}
