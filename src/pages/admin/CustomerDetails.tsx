import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import {
    ArrowLeft, User, Phone, MapPin, ShoppingBag, Calendar,
    Clock, CreditCard, FileText, TrendingUp, Package
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ReceiptModal } from '@/components/admin/ReceiptModal';
import { getRiskStatusLabel } from '@/utils/financial';
// Local order interface matching database schema
interface LocalOrder {
    id: string;
    order_number: string;
    created_at: string;
    total: number;
    status: string;
    items: any[];
    address?: any;
    delivery_date?: string;
    payment_day?: number;
    payment_date?: string;
    payment_method?: string;
    installments?: number;
}

export default function CustomerDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState<any>(null);
    const [orders, setOrders] = useState<LocalOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchCustomerDetails();
        }
    }, [id]);

    const fetchCustomerDetails = async () => {
        try {
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', id)
                .single();

            if (userError) throw userError;

            const { data: userOrders, error: ordersError } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', id)
                .order('created_at', { ascending: false });

            if (ordersError) throw ordersError;
            if (ordersError) throw ordersError;
            setOrders(userOrders || []);

            if (userData?.phone) {
                try {
                    const { data: consumerData, error: consumerError } = await supabase
                        .from('consumers')
                        .select('*')
                        .eq('phone', userData.phone)
                        .single();

                    // Only merge consumer data if query succeeded and data exists
                    if (!consumerError && consumerData) {
                        setCustomer({ ...userData, ...consumerData });
                    } else {
                        setCustomer(userData);
                    }
                } catch (err) {
                    // If consumers table doesn't exist or RLS blocks access, just use user data
                    console.warn('Could not fetch consumer data:', err);
                    setCustomer(userData);
                }
            } else {
                setCustomer(userData);
            }
        } catch (error) {
            console.error('Error fetching customer details:', error);
        } finally {
            setLoading(false);
        }
    };



    if (loading) {
        return <div className="flex items-center justify-center h-96"><div className="text-lg">Carregando...</div></div>;
    }

    if (!customer) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Cliente não encontrado.</p>
                <Button onClick={() => navigate('/admin/customers')}>Voltar</Button>
            </div>
        );
    }

    const totalSpent = orders.reduce((acc, order) => acc + (Number(order.total) || 0), 0);
    const averageOrder = orders.length > 0 ? totalSpent / orders.length : 0;
    const deliveredOrders = orders.filter(o => o.status === 'entregue').length;

    const getPaymentBadgeColor = (method: string) => {
        switch (method) {
            case 'credit_card': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'debit_card': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'money': return 'bg-green-100 text-green-800 border-green-200';
            case 'carnet': return 'bg-orange-100 text-orange-800 border-orange-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const riskInfo = getRiskStatusLabel(customer.risk_status || 'safe');

    const OrderItem = ({ order, showReceipt = true }: { order: LocalOrder, showReceipt?: boolean }) => {
        const isLastOrder = customer?.last_order_number === order.id || customer?.last_order_number === order.order_number;
        const deliveryDate = order.delivery_date || (isLastOrder ? customer?.last_delivery_date : null);
        const paymentDay = order.payment_day || (isLastOrder ? customer?.payment_day : null);

        const getPaymentMethodLabel = (method?: string) => {
            if (!method) return null;
            switch (method) {
                case 'credit_card': return 'Crédito';
                case 'debit_card': return 'Débito';
                case 'money': return 'Dinheiro';
                case 'carnet': return 'Carnê';
                case 'pix': return 'PIX';
                default: return method;
            }
        };

        return (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-2 rounded-lg hover:border-primary transition-colors gap-4">
                <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-bold text-lg">
                            #{order.order_number?.slice(-6) || order.id.slice(0, 8)}
                        </span>
                        <Badge
                            variant={order.status === 'entregue' ? 'default' : order.status === 'cancelado' ? 'destructive' : 'secondary'}
                        >
                            {order.status}
                        </Badge>
                        {showReceipt && order.status === 'entregue' && (
                            <ReceiptModal order={order} customer={customer} />
                        )}
                        {order.payment_method && (
                            <Badge className={`border ${getPaymentBadgeColor(order.payment_method)}`}>
                                {getPaymentMethodLabel(order.payment_method)}
                            </Badge>
                        )}
                    </div>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground mt-2">
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Pedido: {new Date(order.created_at).toLocaleDateString()} • {new Date(order.created_at).toLocaleTimeString().slice(0, 5)}
                        </span>

                        {deliveryDate && (
                            <span className="flex items-center gap-1 text-blue-600 font-medium">
                                <Calendar className="h-3.5 w-3.5" />
                                Entrega: {new Date(deliveryDate).toLocaleDateString()}
                            </span>
                        )}

                        {(order.payment_date || paymentDay || order.installments) && (
                            <div className="flex items-center gap-3 mt-1">
                                {order.payment_date ? (
                                    <span className="flex items-center gap-1 text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Venc: {new Date(order.payment_date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                                    </span>
                                ) : paymentDay ? (
                                    <span className="flex items-center gap-1 text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Venc: Dia {paymentDay}
                                    </span>
                                ) : null}
                                {order.installments && order.installments > 1 && (
                                    <span className="flex items-center gap-1 text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded">
                                        <CreditCard className="h-3.5 w-3.5" />
                                        {order.installments}x
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                            R$ {Number(order.total).toFixed(2).replace('.', ',')}
                        </p>
                        {order.installments && order.installments > 1 && (
                            <p className="text-xs text-muted-foreground">
                                {order.installments}x de R$ {(Number(order.total) / order.installments).toFixed(2).replace('.', ',')}
                            </p>
                        )}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/admin/orders/${order.order_number}`)}>
                        Ver Detalhes
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 pb-8">
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/admin/customers')}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Detalhes do Cliente</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-muted-foreground">Informações completas e histórico</p>
                        <Badge className={`${riskInfo.color} border-0`}>
                            {riskInfo.icon} {riskInfo.label}
                        </Badge>
                    </div>
                </div>
            </div>

            <Card className="border-2">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex justify-center md:justify-start">
                            <div className="h-32 w-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg relative">
                                <User className="h-16 w-16 text-white" />
                                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-md" title={riskInfo.label}>
                                    <span className="text-2xl">{riskInfo.icon}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div>
                                <h2 className="text-2xl font-bold">
                                    {customer.full_name || customer.name || 'Cliente sem nome'}
                                </h2>
                                <div className="flex flex-wrap gap-3 mt-2">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Phone className="h-4 w-4" />
                                        <span className="text-sm font-medium">{customer.phone}</span>
                                    </div>
                                    {customer.cpf && (
                                        <div className="flex items-center gap-1.5 text-muted-foreground border-l pl-3">
                                            <FileText className="h-4 w-4" />
                                            <span className="text-sm">CPF: {customer.cpf}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {customer.address && (
                                <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                                    <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                                    <div className="text-sm">
                                        <p className="font-medium text-blue-900 dark:text-blue-100">
                                            {customer.address.street}, {customer.address.number}
                                        </p>
                                        <p className="text-blue-700 dark:text-blue-300">
                                            {customer.address.neighborhood} - {customer.address.city}
                                        </p>
                                        {customer.address.complement && (
                                            <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                                                Complemento: {customer.address.complement}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-4">
                <Card className={customer.risk_status === 'risk' ? 'border-red-200 bg-red-50' : ''}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Status Financeiro</CardTitle>
                        <TrendingUp className={`h-4 w-4 ${riskInfo.color.split(' ')[1]}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${riskInfo.color.split(' ')[1]}`}>
                            {riskInfo.label}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Score de Crédito</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            R$ {totalSpent.toFixed(2).replace('.', ',')}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Em {orders.length} pedidos</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                        <CreditCard className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            R$ {averageOrder.toFixed(2).replace('.', ',')}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Por pedido</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Último Pedido</CardTitle>
                        <Calendar className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        {customer.last_order_total ? (
                            <>
                                <div className="text-2xl font-bold text-orange-600">
                                    R$ {Number(customer.last_order_total).toFixed(2).replace('.', ',')}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {customer.last_delivery_date && new Date(customer.last_delivery_date).toLocaleDateString()}
                                </p>
                            </>
                        ) : (
                            <div className="text-sm text-muted-foreground">Nenhum pedido</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        <CardTitle>Histórico de Pedidos</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="all">Todos ({orders.length})</TabsTrigger>
                            <TabsTrigger value="delivered">Entregues ({deliveredOrders})</TabsTrigger>
                            <TabsTrigger value="pending">
                                Pendentes ({orders.length - deliveredOrders})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="all" className="space-y-4 mt-4">
                            {orders.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">Nenhum pedido encontrado.</p>
                            ) : (
                                orders.map((order) => (
                                    <OrderItem key={order.id} order={order} />
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="delivered" className="space-y-4 mt-4">
                            {orders.filter(o => o.status === 'entregue').map((order) => (
                                <OrderItem key={order.id} order={order} />
                            ))}
                        </TabsContent>

                        <TabsContent value="pending" className="space-y-4 mt-4">
                            {orders.filter(o => o.status !== 'entregue').map((order) => (
                                <OrderItem key={order.id} order={order} showReceipt={false} />
                            ))}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
