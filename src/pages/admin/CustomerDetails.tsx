import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import {
    ArrowLeft,
    User,
    Phone,
    MapPin,
    ShoppingBag,
    Calendar,
    CreditCard,
    FileText,
    TrendingUp,
    Package,
    Share2,
    Copy,
    Check,
    MessageCircle,
    Plus,
    Clock,
    DollarSign,
    CheckCircle2,
    AlertCircle,
    Building2,
    ShieldCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ReceiptModal } from '@/components/admin/ReceiptModal';
import { getRiskStatusLabel } from '@/utils/financial';
import {
    fetchReferralsForCustomer,
    updateReferralStatusInSupabase,
    createReferralInSupabase,
    onOrderDelivered,
    registerInstallmentPaidForReferral,
    ReferralRecord
} from '@/services/referralService';

export interface CustomerAddress {
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    complement?: string;
    reference?: string;
    logradouro?: string;
    bairro?: string;
    numero?: string;
}

export interface CustomerProfile {
    id: string;
    name?: string;
    full_name?: string;
    phone?: string;
    email?: string;
    cpf?: string;
    created_at?: string;
    risk_status?: 'safe' | 'low_risk' | 'attention' | 'risk' | string;
    payment_preference?: string;
    payment_day?: number;
    address?: CustomerAddress;
    last_order_number?: string;
    last_delivery_date?: string;
}

interface LocalOrder {
    id: string;
    order_number: string;
    created_at: string;
    total: number;
    status: string;
    items: unknown[];
    address?: CustomerAddress;
    delivery_date?: string;
    payment_day?: number;
    payment_date?: string;
    payment_method?: string;
    installments?: number;
}

export default function CustomerDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [customer, setCustomer] = useState<CustomerProfile | null>(null);
    const [orders, setOrders] = useState<LocalOrder[]>([]);
    const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

    // New Referral Modal state
    const [isAddReferralOpen, setIsAddReferralOpen] = useState(false);
    const [newFriendName, setNewFriendName] = useState('');
    const [newFriendPhone, setNewFriendPhone] = useState('');
    const [newOrderTotal, setNewOrderTotal] = useState('250.00');
    const [savingReferral, setSavingReferral] = useState(false);

    useEffect(() => {
        if (id) {
            void fetchCustomerData();
        }
        // Reload only when the customer id in the URL changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchCustomerData = async () => {
        try {
            setLoading(true);

            // 1. Fetch User Record
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', id)
                .single();

            if (userError) throw userError;

            // 2. Fetch User Orders
            const { data: userOrders } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', id)
                .order('created_at', { ascending: false });

            setOrders(userOrders || []);

            // 3. Fetch Consumer profile (address, risk status, etc.)
            let mergedCustomer: CustomerProfile = { ...userData };
            if (userData?.phone) {
                try {
                    const cleanPhone = userData.phone.replace(/\D/g, '');
                    const { data: consumerData } = await supabase
                        .from('consumers')
                        .select('*')
                        .or(`phone.eq.${userData.phone},phone.eq.${cleanPhone}`)
                        .limit(1)
                        .maybeSingle();

                    if (consumerData) {
                        mergedCustomer = { ...userData, ...consumerData } as CustomerProfile;
                    }
                } catch (err) {
                    console.warn('Could not fetch consumer profile:', err);
                }
            }
            setCustomer(mergedCustomer);

            // 4. Fetch referrals for this customer
            const refs = await fetchReferralsForCustomer(id || '', userData?.phone);
            setReferrals(refs);
        } catch (error) {
            console.error('Error fetching customer details:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate customer code
    const referralCode = useMemo(() => {
        if (!customer) return 'CESTA-VIP';
        const cleanPhone = (customer.phone || '').replace(/\D/g, '');
        if (cleanPhone.length >= 4) {
            return `CESTA-${cleanPhone.slice(-4).toUpperCase()}`;
        }
        return `CESTA-${customer.id.slice(0, 4).toUpperCase()}`;
    }, [customer]);

    const registerLink = useMemo(() => {
        const origin = window.location.origin;
        return `${origin}/login?ref=${referralCode}`;
    }, [referralCode]);

    const shopLink = useMemo(() => {
        const origin = window.location.origin;
        return `${origin}/?ref=${referralCode}`;
    }, [referralCode]);

    // Financial Metrics
    const totalSpent = useMemo(
        () => orders.reduce((acc, order) => acc + (Number(order.total) || 0), 0),
        [orders]
    );
    const averageOrder = useMemo(
        () => (orders.length > 0 ? totalSpent / orders.length : 0),
        [orders, totalSpent]
    );
    const deliveredOrders = useMemo(
        () => orders.filter((o) => o.status === 'entregue').length,
        [orders]
    );

    // Referral Metrics
    const referralStats = useMemo(() => {
        const totalCount = referrals.length;
        const completed = referrals.filter((r) => r.status === 'completed' || r.status === 'paid');
        const totalCashback = referrals.reduce((sum, r) => sum + (Number(r.reward_amount) || 0), 0);
        const paidCashback = referrals
            .filter((r) => r.status === 'paid')
            .reduce((sum, r) => sum + (Number(r.reward_amount) || 0), 0);
        // Released cashback = fully completed rewards + proportional carnet releases
        const totalReleased = referrals.reduce((sum, r) => {
            if (r.status === 'completed' || r.status === 'paid') {
                return sum + (Number(r.reward_amount) || 0);
            }
            return sum + (Number(r.reward_released) || 0);
        }, 0);
        const availableCashback = Math.max(0, totalReleased - paidCashback);

        return {
            totalCount,
            convertedCount: completed.length,
            totalCashback,
            totalReleased,
            paidCashback,
            availableCashback
        };
    }, [referrals]);

    const handleCopyCode = () => {
        navigator.clipboard.writeText(referralCode);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const handleCopyRegisterLink = () => {
        navigator.clipboard.writeText(registerLink);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    const handleWhatsAppShare = () => {
        const cleanPhone = (customer?.phone || '').replace(/\D/g, '');
        const message = `🛒 *Ganhe 10% de desconto na sua Cesta Básica!*\n\nOlá! Crie sua conta na Cesta Fácil com meu código *${referralCode}* e ganhe 10% de desconto no seu 1º pedido:\n\n👉 *Link para Criar Conta:* ${registerLink}\n\nOu monte sua cesta agora: ${shopLink}`;
        const url = cleanPhone
            ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`
            : `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const handleStatusUpdate = async (refId: string, newStatus: ReferralRecord['status']) => {
        await updateReferralStatusInSupabase(refId, newStatus);
        setReferrals((prev) =>
            prev.map((r) =>
                r.id === refId
                    ? {
                          ...r,
                          status: newStatus,
                          paid_at: newStatus === 'paid' ? new Date().toISOString() : r.paid_at
                      }
                    : r
            )
        );
    };

    const handleAdvanceCarnet = async (orderIdentifier: string) => {
        const res = await registerInstallmentPaidForReferral(orderIdentifier);
        if (res?.success && id) {
            const updated = await fetchReferralsForCustomer(id, customer?.phone);
            setReferrals(updated);
        }
    };

    const handleConfirmDelivery = async (orderIdentifier: string) => {
        await onOrderDelivered(orderIdentifier);
        if (id) {
            const updated = await fetchReferralsForCustomer(id, customer?.phone);
            setReferrals(updated);
        }
    };

    const handleCreateReferral = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFriendName.trim()) return;

        setSavingReferral(true);
        try {
            const orderVal = parseFloat(newOrderTotal) || 0;
            const rewardVal = Math.round(orderVal * 0.1 * 100) / 100; // 10%

            const newRecord = await createReferralInSupabase({
                referrer_id: id || '',
                referrer_name: customer?.name || customer?.full_name || 'Cliente',
                referrer_phone: customer?.phone || '',
                referral_code: referralCode,
                friend_name: newFriendName,
                friend_phone: newFriendPhone,
                order_number: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
                order_total: orderVal,
                reward_amount: rewardVal,
                discount_amount: rewardVal,
                status: 'pending',
                notes: 'Registrado manualmente no painel do cliente'
            });

            setReferrals((prev) => [newRecord, ...prev]);
            setNewFriendName('');
            setNewFriendPhone('');
            setIsAddReferralOpen(false);
        } catch (err) {
            console.error('Error creating referral:', err);
        } finally {
            setSavingReferral(false);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const getPaymentBadgeColor = (method?: string) => {
        switch (method) {
            case 'credit_card':
            case 'cartao':
                return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800';
            case 'debit_card':
                return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
            case 'money':
            case 'dinheiro':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800';
            case 'carnet':
            case 'carne':
                return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800';
            case 'pix':
                return 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800';
            default:
                return 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700';
        }
    };

    const getPaymentMethodText = (method?: string) => {
        if (!method) return null;
        switch (method) {
            case 'credit_card':
                return 'Cartão de Crédito';
            case 'debit_card':
                return 'Cartão de Débito';
            case 'money':
            case 'dinheiro':
                return 'Dinheiro na Entrega';
            case 'carnet':
            case 'carne':
                return 'Carnê / Boleto';
            case 'cartao':
                return 'Cartão';
            case 'pix':
                return 'PIX';
            default:
                return method;
        }
    };

    const riskStatus = customer?.risk_status === 'attention' || customer?.risk_status === 'risk'
        ? customer.risk_status
        : 'safe';
    const riskInfo = getRiskStatusLabel(riskStatus);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
                <p className="text-sm text-neutral-500">Carregando dados completos do cliente...</p>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 max-w-lg mx-auto">
                <User className="h-12 w-12 text-neutral-400 mx-auto mb-3" />
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Cliente não encontrado
                </h2>
                <p className="text-sm text-neutral-500 mt-1 mb-6">
                    O identificador informado não corresponde a nenhum usuário ativo.
                </p>
                <Button onClick={() => navigate('/admin/customers')}>Voltar para Clientes</Button>
            </div>
        );
    }

    const cleanPhone = (customer.phone || '').replace(/\D/g, '');
    const directWaUrl = cleanPhone
        ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
              `Olá ${customer.name || customer.full_name || ''}, tudo bem? Aqui é da equipe da Cesta Fácil.`
          )}`
        : null;

    return (
        <div className="space-y-6 pb-12">
            {/* Top Navigation & Breadcrumbs */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate('/admin/customers')}
                        className="h-9 w-9 border-neutral-300 dark:border-neutral-700 shrink-0"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-400">Clientes /</span>
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                Detalhes do Perfil
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mt-0.5">
                            {customer.name || customer.full_name || 'Cliente'}
                        </h1>
                    </div>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-2">
                    {directWaUrl && (
                        <a
                            href={directWaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
                        >
                            <MessageCircle className="h-4 w-4" />
                            WhatsApp do Cliente
                        </a>
                    )}
                </div>
            </div>

            {/* Profile Hero Card */}
            <Card className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
                        <div className="flex items-start sm:items-center gap-4">
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
                                {(customer.name || customer.full_name || 'CF').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                                        {customer.name || customer.full_name || 'Cliente Sem Nome'}
                                    </h2>
                                    <Badge className={`${riskInfo.color} border-0 text-xs py-0.5`}>
                                        {riskInfo.icon} {riskInfo.label}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                                    <span className="flex items-center gap-1 font-mono">
                                        <Phone className="h-3.5 w-3.5 text-neutral-400" />
                                        {customer.phone || 'Sem telefone'}
                                    </span>
                                    {customer.cpf && (
                                        <span className="flex items-center gap-1 font-mono">
                                            <FileText className="h-3.5 w-3.5 text-neutral-400" />
                                            CPF: {customer.cpf}
                                        </span>
                                    )}
                                    {customer.created_at && (
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                                            Cliente desde {new Date(customer.created_at).toLocaleDateString('pt-BR')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Customer Referral Code Pill */}
                        <div className="bg-neutral-50 dark:bg-neutral-800/80 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700/80 w-full md:w-auto">
                            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
                                Código de Indicação (10% Cashback)
                            </span>
                            <div className="flex items-center gap-2">
                                <code className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-neutral-900 px-2.5 py-1 rounded border border-neutral-200 dark:border-neutral-700">
                                    {referralCode}
                                </code>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCopyCode}
                                    className="h-8 text-xs border-neutral-300 dark:border-neutral-700"
                                >
                                    {copiedCode ? (
                                        <Check className="h-3.5 w-3.5 text-emerald-600 mr-1" />
                                    ) : (
                                        <Copy className="h-3.5 w-3.5 mr-1" />
                                    )}
                                    {copiedCode ? 'Copiado!' : 'Copiar'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleWhatsAppShare}
                                    className="h-8 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                                    title="Enviar código para o cliente por WhatsApp"
                                >
                                    <Share2 className="h-3.5 w-3.5 mr-1" />
                                    Compartilhar
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* KPI Cards Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <Card className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-4 px-4">
                        <span className="text-xs font-medium text-neutral-500">Total Gasto</span>
                        <ShoppingBag className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {formatCurrency(totalSpent)}
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            Em {orders.length} pedidos realizados
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-4 px-4">
                        <span className="text-xs font-medium text-neutral-500">Ticket Médio</span>
                        <CreditCard className="h-4 w-4 text-neutral-400" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 tabular-nums">
                            {formatCurrency(averageOrder)}
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            Média por compra
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-4 px-4">
                        <span className="text-xs font-medium text-neutral-500">Amigos Indicados</span>
                        <Share2 className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 tabular-nums">
                            {referralStats.totalCount}
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            {referralStats.convertedCount} compras geradas
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-4 px-4">
                        <span className="text-xs font-medium text-neutral-500">Cashback Acumulado</span>
                        <DollarSign className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
                            {formatCurrency(referralStats.totalCashback)}
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            Disponível: {formatCurrency(referralStats.availableCashback)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs Interface */}
            <Tabs defaultValue="orders" className="w-full">
                <TabsList className="bg-neutral-100 dark:bg-neutral-800 p-1 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                    <TabsTrigger
                        value="orders"
                        className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:shadow-sm text-xs font-medium"
                    >
                        <Package className="h-3.5 w-3.5 mr-1.5" />
                        Histórico de Pedidos ({orders.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="referrals"
                        className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:shadow-sm text-xs font-medium"
                    >
                        <Share2 className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
                        Indicações & Cashback ({referrals.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="profile"
                        className="data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:shadow-sm text-xs font-medium"
                    >
                        <MapPin className="h-3.5 w-3.5 mr-1.5" />
                        Endereço & Cadastro
                    </TabsTrigger>
                </TabsList>

                {/* 1. ORDERS TAB */}
                <TabsContent value="orders" className="space-y-4 mt-4">
                    {orders.length === 0 ? (
                        <Card className="border border-neutral-200 dark:border-neutral-800 text-center py-12">
                            <CardContent>
                                <ShoppingBag className="h-10 w-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
                                <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                                    Nenhum pedido realizado ainda
                                </h3>
                                <p className="text-xs text-neutral-500 mt-1">
                                    Quando o cliente finalizar uma compra, os dados aparecerão aqui em tempo real.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {orders.map((order) => {
                                const isLastOrder =
                                    customer?.last_order_number === order.id ||
                                    customer?.last_order_number === order.order_number;
                                const deliveryDate =
                                    order.delivery_date || (isLastOrder ? customer?.last_delivery_date : null);
                                const paymentDay = order.payment_day || (isLastOrder ? customer?.payment_day : null);

                                return (
                                    <div
                                        key={order.id}
                                        className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-emerald-500/50 dark:hover:border-emerald-600/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                                    >
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-mono font-bold text-sm text-neutral-900 dark:text-neutral-100">
                                                    #{order.order_number || order.id.slice(0, 8)}
                                                </span>
                                                <Badge
                                                    variant={
                                                        order.status === 'entregue'
                                                            ? 'default'
                                                            : order.status === 'cancelado'
                                                            ? 'destructive'
                                                            : 'secondary'
                                                    }
                                                    className="capitalize text-[11px]"
                                                >
                                                    {order.status}
                                                </Badge>

                                                {order.payment_method && (
                                                    <span
                                                        className={`text-[11px] px-2 py-0.5 rounded border font-medium ${getPaymentBadgeColor(
                                                            order.payment_method
                                                        )}`}
                                                    >
                                                        {getPaymentMethodText(order.payment_method)}
                                                    </span>
                                                )}

                                                {order.status === 'entregue' && (
                                                    <ReceiptModal order={order} customer={customer} />
                                                )}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                                                    {new Date(order.created_at).toLocaleDateString('pt-BR')} às{' '}
                                                    {new Date(order.created_at).toLocaleTimeString('pt-BR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>

                                                {deliveryDate && (
                                                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        Entrega prevista: {new Date(deliveryDate).toLocaleDateString('pt-BR')}
                                                    </span>
                                                )}

                                                {(order.payment_date || paymentDay) && (
                                                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                                                        <CreditCard className="h-3.5 w-3.5" />
                                                        Vencimento:{' '}
                                                        {order.payment_date
                                                            ? new Date(order.payment_date).toLocaleDateString('pt-BR')
                                                            : `Dia ${paymentDay}`}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0">
                                            <div className="text-left md:text-right">
                                                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                    {formatCurrency(Number(order.total) || 0)}
                                                </div>
                                                {order.installments && order.installments > 1 && (
                                                    <p className="text-[11px] text-neutral-400">
                                                        {order.installments}x de{' '}
                                                        {formatCurrency((Number(order.total) || 0) / order.installments)}
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => navigate(`/admin/orders/${order.order_number || order.id}`)}
                                                className="text-xs h-8 border-neutral-300 dark:border-neutral-700"
                                            >
                                                Ver Pedido
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* 2. REFERRALS TAB (NOVO E COMPLETO) */}
                <TabsContent value="referrals" className="space-y-4 mt-4">
                    {/* Program Banner */}
                    <Card className="border border-neutral-200 dark:border-neutral-800 bg-gradient-to-r from-indigo-50/70 via-white to-emerald-50/70 dark:from-indigo-950/30 dark:via-neutral-900 dark:to-emerald-950/30">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 mb-2">
                                        <Share2 className="h-3.5 w-3.5" />
                                        Programa de Indicação Cesta Fácil
                                    </div>
                                    <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                                        Rede de Amigos de {customer.name || 'este cliente'}
                                    </h3>
                                    <p className="text-xs text-neutral-500 max-w-xl mt-1">
                                        O cliente recebe <strong>10% de cashback</strong> em dinheiro ou crédito a cada
                                        novo amigo que realizar uma compra com seu código promocional.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => setIsAddReferralOpen(true)}
                                        className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1" />
                                        Lançar Indicação Manual
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleWhatsAppShare}
                                        className="text-xs h-9 border-neutral-300 dark:border-neutral-700"
                                    >
                                        <MessageCircle className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                                        Enviar Código p/ WhatsApp
                                    </Button>
                                </div>
                            </div>

                            {/* Share box with direct registration link */}
                            <div className="mt-4 pt-4 border-t border-neutral-200/60 dark:border-neutral-800 space-y-3">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                            👉 Link Direto para Criar Conta (Abre tela de cadastro com código já aplicado):
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            readOnly
                                            value={registerLink}
                                            aria-label="Link direto para criar conta com o código de indicação"
                                            className="w-full text-xs font-mono bg-white dark:bg-neutral-800 border border-emerald-300 dark:border-emerald-700 rounded-md px-3 py-1.5 text-neutral-800 dark:text-neutral-200"
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCopyRegisterLink}
                                            className="text-xs h-8 shrink-0 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                                        >
                                            {copiedLink ? (
                                                <Check className="h-3.5 w-3.5 text-emerald-600 mr-1" />
                                            ) : (
                                                <Copy className="h-3.5 w-3.5 mr-1" />
                                            )}
                                            {copiedLink ? 'Copiado!' : 'Copiar Link de Cadastro'}
                                        </Button>
                                    </div>
                                    <p className="text-[11px] text-neutral-400 mt-1">
                                        Envie este link para o amigo: ao clicar, ele entra direto na página de criar conta com o cupom de 10% já ativado.
                                    </p>
                                </div>

                                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
                                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block mb-1">
                                        Link alternativo (Catálogo da Loja com cupom):
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            readOnly
                                            value={shopLink}
                                            aria-label="Link da loja com desconto"
                                            className="w-full text-xs font-mono bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-md px-3 py-1.5 text-neutral-600 dark:text-neutral-400"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                navigator.clipboard.writeText(shopLink);
                                                setCopiedCode(true);
                                                setTimeout(() => setCopiedCode(false), 2000);
                                            }}
                                            className="text-xs h-8 shrink-0 text-neutral-600 dark:text-neutral-400"
                                        >
                                            <Copy className="h-3.5 w-3.5 mr-1" />
                                            Copiar
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Referrals List / Table */}
                    <Card className="border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                        <CardHeader className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                    Histórico de Amigos Indicados ({referrals.length})
                                </CardTitle>
                                <p className="text-xs text-neutral-500 mt-0.5">
                                    Status dos pedidos indicados e pagamento do cashback de 10%
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {referrals.length === 0 ? (
                                <div className="py-12 text-center px-4">
                                    <Share2 className="h-10 w-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
                                    <h4 className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                                        Nenhuma indicação registrada para este cliente
                                    </h4>
                                    <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
                                        Envie o código {referralCode} para o cliente por WhatsApp para ele começar a indicar
                                        vizinhos e familiares.
                                    </p>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setIsAddReferralOpen(true)}
                                        className="text-xs"
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1" />
                                        Registrar Primeira Indicação
                                    </Button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm border-collapse">
                                        <thead>
                                            <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/75 dark:bg-neutral-900/60 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                                <th className="py-3 pl-6 pr-4">Amigo Indicado</th>
                                                <th className="py-3 px-4">Telefone</th>
                                                <th className="py-3 px-4">Pedido & Pagto</th>
                                                <th className="py-3 px-4 text-right">Valor Compra</th>
                                                <th className="py-3 px-4 text-right">Cashback Total</th>
                                                <th className="py-3 px-4">Liberação Proporcional</th>
                                                <th className="py-3 px-4 text-center">Status</th>
                                                <th className="py-3 pr-6 pl-4 text-right">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                                            {referrals.map((ref) => {
                                                const friendCleanPhone = ref.friend_phone?.replace(/\D/g, '');
                                                const friendWaUrl = friendCleanPhone
                                                    ? `https://wa.me/55${friendCleanPhone}`
                                                    : null;

                                                const isCarne = ref.payment_method === 'carne' || (ref.installments_total && ref.installments_total > 1);
                                                const isMoneyOrPix = ref.payment_method === 'money' || ref.payment_method === 'pix';
                                                const totalInst = ref.installments_total || 1;
                                                const paidInst = Math.min(ref.installments_paid || 0, totalInst);
                                                const released = Number(ref.reward_released) || (ref.status === 'completed' || ref.status === 'paid' ? ref.reward_amount : 0);
                                                const progressPct = totalInst > 0 ? Math.round((paidInst / totalInst) * 100) : 0;
                                                const orderRef = ref.order_number || ref.order_id || ref.id;

                                                return (
                                                    <tr
                                                        key={ref.id}
                                                        className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                                                    >
                                                        <td className="py-3.5 pl-6 pr-4">
                                                            <div className="font-medium text-neutral-900 dark:text-neutral-100">
                                                                {ref.friend_name}
                                                            </div>
                                                            <div className="text-[11px] text-neutral-400">
                                                                Cadastrado em{' '}
                                                                {new Date(ref.created_at).toLocaleDateString('pt-BR')}
                                                            </div>
                                                        </td>

                                                        <td className="py-3.5 px-4 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                                            <div className="flex items-center gap-1.5">
                                                                {ref.friend_phone || 'Sem telefone'}
                                                                {friendWaUrl && (
                                                                    <a
                                                                        href={friendWaUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-emerald-600 hover:text-emerald-700"
                                                                        title="Chamar no WhatsApp"
                                                                    >
                                                                        <MessageCircle className="h-3 w-3" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </td>

                                                        <td className="py-3.5 px-4 font-mono text-xs text-neutral-700 dark:text-neutral-300">
                                                            <div className="flex flex-col gap-1">
                                                                <span>{ref.order_number || 'Aguardando'}</span>
                                                                {isCarne ? (
                                                                    <Badge variant="outline" className="w-fit text-[10px] bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300">
                                                                        Carnê ({totalInst}x)
                                                                    </Badge>
                                                                ) : ref.payment_method === 'pix' ? (
                                                                    <Badge variant="outline" className="w-fit text-[10px] bg-teal-50 text-teal-700 border-teal-300 dark:bg-teal-950 dark:text-teal-300">
                                                                        PIX (Na entrega)
                                                                    </Badge>
                                                                ) : ref.payment_method === 'money' ? (
                                                                    <Badge variant="outline" className="w-fit text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300">
                                                                        Dinheiro (Na entrega)
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="w-fit text-[10px] bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300">
                                                                        Cartão
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </td>

                                                        <td className="py-3.5 px-4 text-right font-medium tabular-nums text-neutral-800 dark:text-neutral-200">
                                                            {formatCurrency(ref.order_total)}
                                                        </td>

                                                        <td className="py-3.5 px-4 text-right font-bold tabular-nums text-foreground">
                                                            {formatCurrency(ref.reward_amount)}
                                                        </td>

                                                        {/* Proportional Release Column */}
                                                        <td className="py-3.5 px-4">
                                                            {isCarne ? (
                                                                <div className="space-y-1 min-w-[130px]">
                                                                    <div className="flex items-center justify-between text-[11px]">
                                                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                                            {formatCurrency(released)} liberados
                                                                        </span>
                                                                        <span className="text-[10px] text-neutral-400">
                                                                            {paidInst}/{totalInst} pagos
                                                                        </span>
                                                                    </div>
                                                                    <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                                                                            style={{ width: `${progressPct}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-[10px] text-neutral-400 block">
                                                                        10% de cada carnê pago
                                                                    </span>
                                                                </div>
                                                            ) : isMoneyOrPix ? (
                                                                <div className="space-y-0.5">
                                                                    {ref.status === 'completed' || ref.status === 'paid' ? (
                                                                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                                            <CheckCircle2 className="h-3 w-3" />
                                                                            {formatCurrency(released)} (Pago na entrega)
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                                            <Clock className="h-3 w-3" />
                                                                            Pendente até a entrega
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                                    {formatCurrency(released)} liberados
                                                                </span>
                                                            )}
                                                        </td>

                                                        <td className="py-3.5 px-4 text-center">
                                                            {ref.status === 'paid' ? (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                    Pago
                                                                </span>
                                                            ) : ref.status === 'completed' ? (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                                    <Check className="h-3 w-3 mr-1" />
                                                                    Liberado
                                                                </span>
                                                            ) : ref.status === 'cancelled' ? (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                                                                    Cancelado
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                                                    <Clock className="h-3 w-3 mr-1" />
                                                                    Pendente
                                                                </span>
                                                            )}
                                                        </td>

                                                        <td className="py-3.5 pr-6 pl-4 text-right">
                                                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                                                {/* Carnet Installment Action */}
                                                                {isCarne && paidInst < totalInst && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => handleAdvanceCarnet(orderRef)}
                                                                        className="h-7 text-[11px] border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 bg-amber-50/50 hover:bg-amber-100"
                                                                        title="Registrar pagamento de 1 parcela do carnê e liberar proporção de 10%"
                                                                    >
                                                                        Baixar Carnê (+1)
                                                                    </Button>
                                                                )}

                                                                {/* Cash / Pix Delivery Payment Action */}
                                                                {isMoneyOrPix && ref.status === 'pending' && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => handleConfirmDelivery(orderRef)}
                                                                        className="h-7 text-[11px] border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50"
                                                                        title="Confirmar pagamento recebido na entrega"
                                                                    >
                                                                        Confirmar Entrega
                                                                    </Button>
                                                                )}

                                                                {/* Mark Paid */}
                                                                {ref.status === 'completed' && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => handleStatusUpdate(ref.id, 'paid')}
                                                                        className="h-7 text-xs border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                                                                    >
                                                                        Pagar Cashback
                                                                    </Button>
                                                                )}

                                                                {ref.status === 'paid' && (
                                                                    <span className="text-[11px] text-neutral-400">
                                                                        Liquidado
                                                                    </span>
                                                                )}
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
                </TabsContent>

                {/* 3. PROFILE & ADDRESS TAB */}
                <TabsContent value="profile" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Address Details */}
                        <Card className="border border-neutral-200 dark:border-neutral-800">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-emerald-600" />
                                    <CardTitle className="text-sm font-semibold">Endereço de Entrega</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-xs">
                                {customer.address ? (
                                    <div className="space-y-2 bg-neutral-50 dark:bg-neutral-800/60 p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                        <div className="flex justify-between border-b border-neutral-200/60 dark:border-neutral-700/60 pb-2">
                                            <span className="text-neutral-500">Logradouro / Rua</span>
                                            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                {customer.address.street || customer.address.logradouro || 'Não informado'},{' '}
                                                {customer.address.number || customer.address.numero || 'S/N'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-neutral-200/60 dark:border-neutral-700/60 pb-2">
                                            <span className="text-neutral-500">Bairro</span>
                                            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                {customer.address.neighborhood || customer.address.bairro || 'Não informado'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-neutral-200/60 dark:border-neutral-700/60 pb-2">
                                            <span className="text-neutral-500">Cidade / UF</span>
                                            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                {customer.address.city || 'São Paulo'} - {customer.address.state || 'SP'}
                                            </span>
                                        </div>
                                        {customer.address.complement && (
                                            <div className="flex justify-between border-b border-neutral-200/60 dark:border-neutral-700/60 pb-2">
                                                <span className="text-neutral-500">Complemento</span>
                                                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                    {customer.address.complement}
                                                </span>
                                            </div>
                                        )}
                                        {customer.address.reference && (
                                            <div className="flex justify-between">
                                                <span className="text-neutral-500">Ponto de Referência</span>
                                                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                    {customer.address.reference}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-neutral-400 py-6 text-center">
                                        Nenhum endereço cadastrado para este cliente.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Financial & Document Profile */}
                        <Card className="border border-neutral-200 dark:border-neutral-800">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                    <CardTitle className="text-sm font-semibold">Dados Financeiros & Perfil</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-xs">
                                <div className="space-y-2 bg-neutral-50 dark:bg-neutral-800/60 p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                    <div className="flex justify-between border-b border-neutral-200/60 dark:border-neutral-700/60 pb-2">
                                        <span className="text-neutral-500">Classificação de Crédito</span>
                                        <Badge className={`${riskInfo.color} border-0 text-[11px]`}>
                                            {riskInfo.label}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between border-b border-neutral-200/60 dark:border-neutral-700/60 pb-2">
                                        <span className="text-neutral-500">CPF Registrado</span>
                                        <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100">
                                            {customer.cpf || 'Não cadastrado'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b border-neutral-200/60 dark:border-neutral-700/60 pb-2">
                                        <span className="text-neutral-500">Preferencia de Pagamento</span>
                                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                            {getPaymentMethodText(customer.payment_preference) || 'Padrão do Pedido'}
                                        </span>
                                    </div>
                                    {customer.payment_day && (
                                        <div className="flex justify-between border-b border-neutral-200/60 dark:border-neutral-700/60 pb-2">
                                            <span className="text-neutral-500">Dia de Vencimento Preferido</span>
                                            <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                                Todo dia {customer.payment_day}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-neutral-500">Total de Compras Históricas</span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                            {orders.length} pedidos ({formatCurrency(totalSpent)})
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Modal: Registrar Indicação Manual */}
            {isAddReferralOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Share2 className="h-5 w-5 text-indigo-600" />
                                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                                    Lançar Nova Indicação
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsAddReferralOpen(false)}
                                className="text-neutral-400 hover:text-neutral-600 text-xs font-semibold"
                            >
                                Fechar
                            </button>
                        </div>

                        <form onSubmit={handleCreateReferral} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                                    Nome do Amigo Indicado *
                                </label>
                                <Input
                                    required
                                    placeholder="Ex: Carlos Silva"
                                    value={newFriendName}
                                    onChange={(e) => setNewFriendName(e.target.value)}
                                    className="text-xs h-9"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                                    WhatsApp do Amigo
                                </label>
                                <Input
                                    placeholder="Ex: 11999887766"
                                    value={newFriendPhone}
                                    onChange={(e) => setNewFriendPhone(e.target.value)}
                                    className="text-xs h-9 font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                                    Valor da Cesta / Pedido (R$) *
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    required
                                    placeholder="250.00"
                                    value={newOrderTotal}
                                    onChange={(e) => setNewOrderTotal(e.target.value)}
                                    className="text-xs h-9 font-mono"
                                />
                                <p className="text-[11px] text-emerald-600 mt-1">
                                    Cashback a ser creditado (10%):{' '}
                                    <strong>
                                        {formatCurrency((parseFloat(newOrderTotal) || 0) * 0.1)}
                                    </strong>
                                </p>
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsAddReferralOpen(false)}
                                    className="text-xs"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={savingReferral}
                                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                                >
                                    {savingReferral ? 'Salvando...' : 'Confirmar Indicação'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
