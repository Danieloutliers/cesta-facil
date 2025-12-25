import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Tag, TrendingUp, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
    totalProducts: number;
    activeCategories: number;
    averagePrice: number;
    alerts: number;
}

const Dashboard = () => {
    const [stats, setStats] = useState<DashboardStats>({
        totalProducts: 0,
        activeCategories: 0,
        averagePrice: 0,
        alerts: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { count: productsCount } = await supabase
                    .from('products')
                    .select('*', { count: 'exact', head: true })
                    .eq('active', true);

                const { count: categoriesCount } = await supabase
                    .from('categories')
                    .select('*', { count: 'exact', head: true })
                    .neq('id', 'todos');

                const { data: products } = await supabase
                    .from('products')
                    .select('price')
                    .eq('active', true);

                const avgPrice = products && products.length > 0
                    ? products.reduce((sum, p) => sum + p.price, 0) / products.length
                    : 0;

                setStats({
                    totalProducts: productsCount || 0,
                    activeCategories: categoriesCount || 0,
                    averagePrice: avgPrice,
                    alerts: 0
                });
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? '...' : stats.totalProducts}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.totalProducts > 0 ? 'Produtos ativos' : 'Nenhum produto cadastrado'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Categorias Ativas</CardTitle>
                        <Tag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? '...' : stats.activeCategories}
                        </div>
                        <p className="text-xs text-muted-foreground">Todas visíveis</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? '...' : `R$ ${stats.averagePrice.toFixed(2).replace('.', ',')}`}
                        </div>
                        <p className="text-xs text-muted-foreground">Por produto</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Alertas</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.alerts}</div>
                        <p className="text-xs text-muted-foreground">Sistema operando normalmente</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Visão Geral</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p className="text-sm text-muted-foreground">Carregando dados...</p>
                        ) : stats.totalProducts === 0 ? (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Seu banco de dados está vazio.
                                </p>
                                <p className="text-sm">
                                    Vá para <strong>Produtos</strong> e clique em <strong>"Novo Produto"</strong> para começar,
                                    ou acesse <strong>/montar-cesta</strong> e clique em <strong>"Popular Banco de Dados"</strong>.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-sm">
                                    ✅ Você tem <strong>{stats.totalProducts} produtos</strong> cadastrados em{' '}
                                    <strong>{stats.activeCategories} categorias</strong>.
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Sistema conectado ao Supabase e funcionando corretamente.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
