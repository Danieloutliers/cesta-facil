import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import {
    User,
    ShoppingBag,
    DollarSign,
    Search,
    MessageCircle,
    ArrowUpRight,
    Users,
    Download,
    RefreshCw,
    Share2,
    Calendar,
    ChevronRight,
    Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { getStoredLocalReferrals } from '@/services/referralService';

interface CustomerSummary {
    id: string;
    phone: string;
    name?: string;
    email?: string;
    cpf?: string;
    created_at?: string;
    orderCount: number;
    totalSpent: number;
    lastOrderDate?: string;
    referralsCount: number;
    earnedCashback: number;
}

export default function Customers() {
    const [customers, setCustomers] = useState<CustomerSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<'all' | 'with-orders' | 'no-orders' | 'top-spenders' | 'with-referrals'>('all');
    const [sortBy, setSortBy] = useState<'recent' | 'spent' | 'orders' | 'name'>('recent');

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            setRefreshing(true);

            // Fetch users from Supabase
            const { data: users, error: usersError } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (usersError) throw usersError;

            // Fetch consumers for CPF / profile enrichment
            const consumersMap: Record<string, Record<string, unknown>> = {};
            try {
                const { data: consumers } = await supabase.from('consumers').select('*');
                if (consumers) {
                    consumers.forEach((c: Record<string, unknown>) => {
                        const phone = typeof c.phone === 'string' ? c.phone.replace(/\D/g, '') : '';
                        const key = phone || String(c.id);
                        consumersMap[key] = c;
                    });
                }
            } catch (err) {
                console.warn('Could not load consumers extra data:', err);
            }

            // Fetch orders for customer stats
            const { data: orders } = await supabase
                .from('orders')
                .select('id, user_id, total, created_at, status');

            // Fetch referrals to calculate referral stats per user
            let referralsList: Array<{ referrer_id?: string; referrer_phone?: string; reward_amount?: number }> = [];
            try {
                const { data: refs } = await supabase.from('referrals').select('*');
                if (refs && refs.length > 0) {
                    referralsList = refs as unknown as Array<{ referrer_id?: string; referrer_phone?: string; reward_amount?: number }>;
                } else {
                    referralsList = getStoredLocalReferrals();
                }
            } catch {
                referralsList = getStoredLocalReferrals();
            }

            // Map user orders and referrals
            const ordersByUser: Record<string, { count: number; total: number; lastDate?: string }> = {};
            if (orders) {
                orders.forEach((ord) => {
                    if (!ord.user_id) return;
                    if (!ordersByUser[ord.user_id]) {
                        ordersByUser[ord.user_id] = { count: 0, total: 0, lastDate: ord.created_at };
                    }
                    ordersByUser[ord.user_id].count += 1;
                    ordersByUser[ord.user_id].total += Number(ord.total || 0);

                    if (
                        !ordersByUser[ord.user_id].lastDate ||
                        new Date(ord.created_at) > new Date(ordersByUser[ord.user_id].lastDate!)
                    ) {
                        ordersByUser[ord.user_id].lastDate = ord.created_at;
                    }
                });
            }

            // Map referrals by user id or phone
            const referralsByUser: Record<string, { count: number; reward: number }> = {};
            referralsList.forEach((ref) => {
                const uId = ref.referrer_id;
                const phoneClean = ref.referrer_phone ? ref.referrer_phone.replace(/\D/g, '') : '';
                const keys = [uId, phoneClean].filter(Boolean);

                keys.forEach((k) => {
                    if (!referralsByUser[k]) {
                        referralsByUser[k] = { count: 0, reward: 0 };
                    }
                    referralsByUser[k].count += 1;
                    referralsByUser[k].reward += Number(ref.reward_amount || 0);
                });
            });

            const enriched: CustomerSummary[] = (users || []).map((u) => {
                const cleanPhone = (u.phone || '').replace(/\D/g, '');
                const consumer = consumersMap[cleanPhone] || consumersMap[u.id];
                const userOrderStats = ordersByUser[u.id] || { count: 0, total: 0 };
                const userRefStats = referralsByUser[u.id] || referralsByUser[cleanPhone] || { count: 0, reward: 0 };

                return {
                    id: u.id,
                    phone: u.phone || '',
                    name: u.name || consumer?.full_name || consumer?.name || 'Cliente Sem Nome',
                    email: u.email || consumer?.email || '',
                    cpf: consumer?.cpf ? String(consumer.cpf) : '',
                    created_at: u.created_at,
                    orderCount: userOrderStats.count,
                    totalSpent: userOrderStats.total,
                    lastOrderDate: userOrderStats.lastDate,
                    referralsCount: userRefStats.count,
                    earnedCashback: userRefStats.reward
                };
            });

            setCustomers(enriched);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Filter and sort customers
    const filteredCustomers = useMemo(() => {
        let list = [...customers];

        // Search filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim();
            list = list.filter((c) =>
                (c.name && c.name.toLowerCase().includes(term)) ||
                (c.phone && c.phone.includes(term)) ||
                (c.email && c.email.toLowerCase().includes(term)) ||
                (c.cpf && c.cpf.includes(term))
            );
        }

        // Category filter
        switch (filterCategory) {
            case 'with-orders':
                list = list.filter((c) => c.orderCount > 0);
                break;
            case 'no-orders':
                list = list.filter((c) => c.orderCount === 0);
                break;
            case 'top-spenders':
                list = list.filter((c) => c.totalSpent >= 400);
                break;
            case 'with-referrals':
                list = list.filter((c) => c.referralsCount > 0);
                break;
        }

        // Sort
        list.sort((a, b) => {
            if (sortBy === 'spent') return b.totalSpent - a.totalSpent;
            if (sortBy === 'orders') return b.orderCount - a.orderCount;
            if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
            // default recent
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        });

        return list;
    }, [customers, searchTerm, filterCategory, sortBy]);

    // Aggregate statistics
    const stats = useMemo(() => {
        const total = customers.length;
        const active = customers.filter((c) => c.orderCount > 0).length;
        const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
        const totalOrders = customers.reduce((sum, c) => sum + c.orderCount, 0);
        const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const withReferrals = customers.filter((c) => c.referralsCount > 0).length;

        return {
            total,
            active,
            totalRevenue,
            totalOrders,
            averageTicket,
            withReferrals
        };
    }, [customers]);

    // CSV Exporter
    const exportCSV = () => {
        const headers = ['ID', 'Nome', 'Telefone', 'Email', 'CPF', 'Total Pedidos', 'Total Gasto (R$)', 'Indicações', 'Data Cadastro'];
        const rows = filteredCustomers.map((c) => [
            c.id,
            `"${c.name || ''}"`,
            `"${c.phone || ''}"`,
            `"${c.email || ''}"`,
            `"${c.cpf || ''}"`,
            c.orderCount,
            c.totalSpent.toFixed(2),
            c.referralsCount,
            c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : ''
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `clientes_cesta_facil_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Helper for initials avatar
    const getInitials = (name?: string) => {
        if (!name) return 'CF';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Users className="h-6 w-6 text-emerald-600" />
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                            Gestão de Clientes
                        </h1>
                    </div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        Base de clientes cadastrados, histórico de consumo e rede de indicações
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={exportCSV}
                        className="text-xs h-9 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                        <Download className="h-3.5 w-3.5 mr-1.5 text-neutral-500" />
                        Exportar CSV
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchCustomers}
                        disabled={refreshing}
                        className="text-xs h-9 border-neutral-300 dark:border-neutral-700"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                </div>
            </div>

            {/* KPI Cards Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <Card className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-4 px-4">
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Total de Clientes</span>
                        <User className="h-4 w-4 text-neutral-400" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 tabular-nums">
                            {loading ? '...' : stats.total}
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            {stats.active} ativos ({stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%)
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-4 px-4">
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Total de Pedidos</span>
                        <ShoppingBag className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {loading ? '...' : stats.totalOrders}
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            Realizados no catálogo
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-4 px-4">
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Receita Total</span>
                        <DollarSign className="h-4 w-4 text-neutral-400" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 tabular-nums">
                            {loading ? '...' : formatCurrency(stats.totalRevenue)}
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            Ticket médio: {formatCurrency(stats.averageTicket)}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-4 px-4">
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Engajamento Indicações</span>
                        <Share2 className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 tabular-nums">
                            {loading ? '...' : stats.withReferrals}
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            Clientes indicando amigos
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder="Buscar por nome, telefone (WhatsApp), CPF ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-10 bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-sm"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                            >
                                Limpar
                            </button>
                        )}
                    </div>

                    {/* Sort */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500 whitespace-nowrap">Ordenar por:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'recent' | 'spent' | 'orders' | 'name')}
                            aria-label="Ordenar clientes por"
                            className="h-10 text-xs px-3 rounded-md bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                            <option value="recent">Mais Recentes</option>
                            <option value="spent">Maior Gasto Total</option>
                            <option value="orders">Mais Pedidos</option>
                            <option value="name">Nome (A - Z)</option>
                        </select>
                    </div>
                </div>

                {/* Filter Tags */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
                    <span className="text-neutral-400 flex items-center mr-1">
                        <Filter className="h-3.5 w-3.5 mr-1" /> Filtros:
                    </span>
                    <button
                        onClick={() => setFilterCategory('all')}
                        className={`px-3 py-1 rounded-md transition-colors ${
                            filterCategory === 'all'
                                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                    >
                        Todos ({customers.length})
                    </button>
                    <button
                        onClick={() => setFilterCategory('with-orders')}
                        className={`px-3 py-1 rounded-md transition-colors ${
                            filterCategory === 'with-orders'
                                ? 'bg-emerald-600 text-white font-medium'
                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                    >
                        Com Pedidos ({customers.filter((c) => c.orderCount > 0).length})
                    </button>
                    <button
                        onClick={() => setFilterCategory('no-orders')}
                        className={`px-3 py-1 rounded-md transition-colors ${
                            filterCategory === 'no-orders'
                                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                    >
                        Sem Pedidos ({customers.filter((c) => c.orderCount === 0).length})
                    </button>
                    <button
                        onClick={() => setFilterCategory('top-spenders')}
                        className={`px-3 py-1 rounded-md transition-colors ${
                            filterCategory === 'top-spenders'
                                ? 'bg-amber-600 text-white font-medium'
                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                    >
                        VIP (+ R$ 400)
                    </button>
                    <button
                        onClick={() => setFilterCategory('with-referrals')}
                        className={`px-3 py-1 rounded-md transition-colors ${
                            filterCategory === 'with-referrals'
                                ? 'bg-indigo-600 text-white font-medium'
                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                    >
                        Com Indicações ({customers.filter((c) => c.referralsCount > 0).length})
                    </button>
                </div>
            </div>

            {/* Customers Data Grid */}
            <Card className="border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <CardHeader className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                            Base de Clientes
                        </CardTitle>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            Exibindo {filteredCustomers.length} de {customers.length} cadastrados
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="py-16 text-center text-neutral-400 text-sm">
                            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                            Carregando clientes do Supabase...
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="py-16 text-center px-4">
                            <User className="h-10 w-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                            <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
                                Nenhum cliente encontrado
                            </h3>
                            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
                                {searchTerm
                                    ? `Nenhum resultado para "${searchTerm}". Tente outros termos de busca.`
                                    : 'Ainda não existem clientes nesta categoria.'}
                            </p>
                            {searchTerm && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSearchTerm('')}
                                    className="mt-4 text-xs"
                                >
                                    Limpar Pesquisa
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/75 dark:bg-neutral-900/60 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                        <th className="py-3.5 pl-6 pr-4">Cliente</th>
                                        <th className="py-3.5 px-4">Contato & CPF</th>
                                        <th className="py-3.5 px-4 text-center">Pedidos</th>
                                        <th className="py-3.5 px-4 text-right">Total Gasto</th>
                                        <th className="py-3.5 px-4 text-center">Indicações</th>
                                        <th className="py-3.5 px-4">Data Cadastro</th>
                                        <th className="py-3.5 pr-6 pl-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                                    {filteredCustomers.map((customer) => {
                                        const cleanPhone = customer.phone.replace(/\D/g, '');
                                        const waLink = cleanPhone
                                            ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                                                  `Olá ${customer.name || ''}, tudo bem? Falamos da Cesta Fácil!`
                                              )}`
                                            : null;

                                        return (
                                            <tr
                                                key={customer.id}
                                                className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors group"
                                            >
                                                {/* Customer Identity */}
                                                <td className="py-4 pl-6 pr-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                                                            {getInitials(customer.name)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <Link
                                                                to={`/admin/customers/${customer.id}`}
                                                                className="font-medium text-neutral-900 dark:text-neutral-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors line-clamp-1 flex items-center gap-1"
                                                            >
                                                                {customer.name || 'Cliente Sem Nome'}
                                                                <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 text-neutral-400 transition-opacity" />
                                                            </Link>
                                                            {customer.email ? (
                                                                <p className="text-xs text-neutral-400 truncate max-w-[180px]">
                                                                    {customer.email}
                                                                </p>
                                                            ) : (
                                                                <p className="text-[11px] text-neutral-400">ID: {customer.id.slice(0, 8)}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Phone & CPF */}
                                                <td className="py-4 px-4 whitespace-nowrap">
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="font-mono text-xs text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                                                            {customer.phone || 'Sem telefone'}
                                                        </div>
                                                        {customer.cpf && (
                                                            <span className="text-[11px] text-neutral-400 font-mono">
                                                                CPF: {customer.cpf}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Order Count */}
                                                <td className="py-4 px-4 text-center whitespace-nowrap">
                                                    {customer.orderCount > 0 ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800 tabular-nums">
                                                            {customer.orderCount} {customer.orderCount === 1 ? 'pedido' : 'pedidos'}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-neutral-400">0 pedidos</span>
                                                    )}
                                                </td>

                                                {/* Total Spent */}
                                                <td className="py-4 px-4 text-right whitespace-nowrap font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                                                    {customer.totalSpent > 0 ? (
                                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                                            {formatCurrency(customer.totalSpent)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-neutral-400">R$ 0,00</span>
                                                    )}
                                                </td>

                                                {/* Referrals */}
                                                <td className="py-4 px-4 text-center whitespace-nowrap">
                                                    {customer.referralsCount > 0 ? (
                                                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                                                            <Share2 className="h-3 w-3" />
                                                            <span>{customer.referralsCount} indicados</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-neutral-400">-</span>
                                                    )}
                                                </td>

                                                {/* Created At */}
                                                <td className="py-4 px-4 whitespace-nowrap text-xs text-neutral-500 tabular-nums">
                                                    {customer.created_at ? (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3 text-neutral-400" />
                                                            {new Date(customer.created_at).toLocaleDateString('pt-BR')}
                                                        </span>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>

                                                {/* Action Buttons */}
                                                <td className="py-4 pr-6 pl-4 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {waLink && (
                                                            <a
                                                                href={waLink}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                title="Abrir WhatsApp"
                                                                className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                                                            >
                                                                <MessageCircle className="h-4 w-4" />
                                                            </a>
                                                        )}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            asChild
                                                            className="h-8 text-xs font-medium border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                                        >
                                                            <Link to={`/admin/customers/${customer.id}`}>
                                                                Ver Detalhes
                                                                <ChevronRight className="h-3 w-3 ml-1 text-neutral-400" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
