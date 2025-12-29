import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { User, ShoppingBag, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface Customer {
    id: string;
    phone: string;
    name?: string;
    email?: string;
}

export default function Customers() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [stats, setStats] = useState({ total: 0, totalOrders: 0, totalRevenue: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            // Fetch customers
            const { data: users } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            // Fetch orders for stats
            const { data: orders } = await supabase
                .from('orders')
                .select('*');

            const totalOrders = orders?.length || 0;
            const totalRevenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0;

            setCustomers(users || []);
            setStats({
                total: users?.length || 0,
                totalOrders,
                totalRevenue
            });
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
                <p className="text-muted-foreground">Gerencie seus clientes cadastrados</p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? '...' : stats.total}</div>
                        <p className="text-xs text-muted-foreground">Cadastrados no sistema</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? '...' : stats.totalOrders}</div>
                        <p className="text-xs text-muted-foreground">De todos os clientes</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? '...' : `R$ ${stats.totalRevenue.toFixed(2).replace('.', ',')}`}
                        </div>
                        <p className="text-xs text-muted-foreground">De todos os pedidos</p>
                    </CardContent>
                </Card>
            </div>

            {/* Customers List */}
            <Card>
                <CardHeader>
                    <CardTitle>Todos os Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Carregando...</p>
                    ) : customers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado</p>
                    ) : (
                        <div className="space-y-2">
                            {customers.map((customer) => (
                                <div
                                    key={customer.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                                >
                                    <div>
                                        <p className="font-medium">{customer.name || 'Sem nome'}</p>
                                        <p className="text-sm text-muted-foreground">{customer.phone}</p>
                                    </div>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link to={`/admin/customers/${customer.id}`}>Ver Detalhes</Link>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
