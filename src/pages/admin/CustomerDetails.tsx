
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, User, Phone, MapPin, ShoppingBag, Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Customer {
    id: string;
    phone: string;
    name?: string;
    email?: string;
    avatar_url?: string;
    photo_url?: string;
    created_at: string;
}

interface Order {
    id: string;
    order_number: string;
    created_at: string;
    total: number;
    status: string;
    items: any[];
    address?: any;
}

export default function CustomerDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [lastAddress, setLastAddress] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchCustomerDetails();
        }
    }, [id]);

    const fetchCustomerDetails = async () => {
        try {
            // Fetch customer profile
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', id)
                .single();

            if (userError) throw userError;
            setCustomer(user);

            // Fetch customer orders
            const { data: userOrders, error: ordersError } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', id)
                .order('created_at', { ascending: false });

            if (ordersError) throw ordersError;
            setOrders(userOrders || []);

            // Get address from last order that has one
            if (userOrders && userOrders.length > 0) {
                const lastOrderWithAddress = userOrders.find((o: any) => o.address);
                if (lastOrderWithAddress) {
                    setLastAddress(lastOrderWithAddress.address);
                }
            }

        } catch (error) {
            console.error('Error fetching customer details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Carregando detalhes do cliente...</div>;
    }

    if (!customer) {
        return (
            <div className="p-8 text-center">
                <p className="mb-4">Cliente não encontrado.</p>
                <Button onClick={() => navigate('/admin/customers')}>Voltar para Clientes</Button>
            </div>
        );
    }

    // Calculate stats
    const totalSpent = orders.reduce((acc, order) => acc + (Number(order.total) || 0), 0);
    const averageOrder = orders.length > 0 ? totalSpent / orders.length : 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/customers')} className="self-start sm:self-auto">
                    <ArrowLeft className="h-4 w-4" />
                </Button>

                <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
                    {/* Avatar / Photo */}
                    <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200 overflow-hidden shadow-sm shrink-0">
                        {customer.avatar_url || customer.photo_url ? (
                            <img
                                src={customer.avatar_url || customer.photo_url}
                                alt={customer.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <User className="h-10 w-10 text-gray-400" />
                        )}
                    </div>

                    <div className="text-center sm:text-left flex-1 space-y-2">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">{customer.name || 'Cliente sem nome'}</h2>
                            <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-2">
                                <Phone className="h-4 w-4" /> {customer.phone}
                            </p>
                        </div>

                        {/* Address Badge - If available */}
                        {lastAddress && (
                            <div className="flex items-center justify-center sm:justify-start gap-2 text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full w-fit mx-auto sm:mx-0">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span>
                                    {lastAddress.street}, {lastAddress.number} - {lastAddress.neighborhood}, {lastAddress.city}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ {totalSpent.toFixed(2).replace('.', ',')}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pedidos Realizados</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{orders.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ {averageOrder.toFixed(2).replace('.', ',')}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Pedidos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {orders.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">Nenhum pedido realizado.</p>
                        ) : (
                            orders.map((order) => (
                                <div key={order.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">Pedido #{order.order_number?.slice(-6) || order.id.slice(0, 8)}</span>
                                            <Badge variant={
                                                order.status === 'entregue' ? 'default' :
                                                    order.status === 'cancelado' ? 'destructive' : 'secondary'
                                            }>
                                                {order.status}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-4">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(order.created_at).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="font-bold">R$ {Number(order.total).toFixed(2).replace('.', ',')}</p>
                                        <Button variant="outline" size="sm" onClick={() => navigate('/admin/orders')}>
                                            Ver no Painel
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
