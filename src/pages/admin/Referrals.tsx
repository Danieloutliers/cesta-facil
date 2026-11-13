import { useState, useEffect, useMemo } from 'react';
import {
  Gift,
  Users,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  Plus,
  RefreshCw,
  ExternalLink,
  Phone,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  fetchReferralsFromSupabase,
  updateReferralStatusInSupabase,
  createReferralInSupabase,
  onOrderDelivered,
  registerInstallmentPaidForReferral,
  ReferralRecord,
} from '@/services/referralService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export default function AdminReferrals() {
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [syncing, setSyncing] = useState(false);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form state for creating a referral in admin
  const [newReferral, setNewReferral] = useState({
    referrer_name: '',
    referrer_phone: '',
    referral_code: '',
    friend_name: '',
    friend_phone: '',
    order_number: '',
    order_total: '350.00',
    payment_method: 'carne' as 'carne' | 'money' | 'pix' | 'credit_card',
    installments_total: 4,
    status: 'pending' as ReferralRecord['status']
  });

  const loadReferrals = async () => {
    setLoading(true);
    try {
      const data = await fetchReferralsFromSupabase();
      setReferrals(data);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar as indicações.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferrals();

    // Subscribe to realtime changes in Supabase
    const subscription = supabase
      .channel('public:referrals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'referrals' }, () => {
        loadReferrals();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(subscription);
    };
    // Mount-only subscription; realtime callbacks reload with current state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStatusChange = async (id: string, newStatus: ReferralRecord['status']) => {
    try {
      await updateReferralStatusInSupabase(id, newStatus);
      setReferrals((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
      toast({
        title: 'Status atualizado!',
        description: `Indicação marcada como ${newStatus === 'completed' ? 'Concluída' : newStatus === 'paid' ? 'Paga/Creditada' : newStatus}.`,
        className: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      });
    } catch (err) {
      toast({
        title: 'Erro ao atualizar',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleAdvanceCarnet = async (orderIdentifier: string) => {
    try {
      const res = await registerInstallmentPaidForReferral(orderIdentifier);
      if (res?.success) {
        toast({
          title: "Parcela do Carnê Baixada!",
          description: `Parcela ${res.paidCount}/${res.totalCount} paga. R$ ${res.released.toFixed(2).replace('.', ',')} liberados para o indicador.`,
          className: "bg-emerald-50 border-emerald-200 text-emerald-900",
        });
        loadReferrals();
      } else {
        toast({
          title: "Atenção",
          description: "Todas as parcelas deste carnê já foram quitadas.",
        });
      }
    } catch {
      toast({
        title: "Erro ao baixar parcela",
        description: "Não foi possível registrar a parcela do carnê.",
        variant: "destructive"
      });
    }
  };

  const handleConfirmDeliveryPayment = async (orderIdentifier: string) => {
    try {
      await onOrderDelivered(orderIdentifier);
      toast({
        title: "Pagamento Confirmado na Entrega!",
        description: "10% de cashback liberado integralmente para quem indicou.",
        className: "bg-emerald-50 border-emerald-200 text-emerald-900",
      });
      loadReferrals();
    } catch {
      toast({
        title: "Erro ao confirmar",
        description: "Não foi possível confirmar o pagamento.",
        variant: "destructive"
      });
    }
  };

  const handleCreateReferral = async () => {
    if (!newReferral.referrer_name || !newReferral.friend_name) {
      toast({
        title: 'Preencha os campos obrigatórios',
        description: 'Nome de quem indicou e nome do amigo são necessários.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const totalNum = parseFloat(newReferral.order_total.replace(',', '.')) || 0;
      const rewardNum = parseFloat((totalNum * 0.10).toFixed(2));
      const code = newReferral.referral_code || `CESTA-${(newReferral.referrer_phone || '2026').replace(/\D/g, '').slice(-4)}`;

      await createReferralInSupabase({
        referrer_id: `manual-${Date.now()}`,
        referrer_name: newReferral.referrer_name,
        referrer_phone: newReferral.referrer_phone,
        referral_code: code,
        friend_name: newReferral.friend_name,
        friend_phone: newReferral.friend_phone,
        order_number: newReferral.order_number || `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        order_total: totalNum,
        reward_amount: rewardNum,
        discount_amount: rewardNum,
        status: newReferral.status,
        payment_method: newReferral.payment_method,
        installments_total: newReferral.payment_method === 'carne' ? newReferral.installments_total : 1,
        installments_paid: 0,
        reward_released: 0,
      });

      toast({
        title: 'Indicação registrada com sucesso!',
        description: `Comissão calculada: R$ ${rewardNum.toFixed(2).replace('.', ',')}`,
        className: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      });

      setNewDialogOpen(false);
      setNewReferral({
        referrer_name: '',
        referrer_phone: '',
        referral_code: '',
        friend_name: '',
        friend_phone: '',
        order_number: '',
        order_total: '350.00',
        payment_method: 'carne',
        installments_total: 4,
        status: 'pending',
      });
      await loadReferrals();
    } catch (err) {
      toast({
        title: 'Erro ao criar indicação',
        variant: 'destructive',
      });
    }
  };

  const filteredReferrals = useMemo(() => {
    return referrals.filter((item) => {
      const matchesSearch =
        item.friend_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.referrer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.referral_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.order_number?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [referrals, searchTerm, statusFilter]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalCount = referrals.length;
    const completedList = referrals.filter((r) => r.status === 'completed' || r.status === 'paid');
    const pendingList = referrals.filter((r) => r.status === 'pending');
    const totalRewards = completedList.reduce((acc, curr) => acc + curr.reward_amount, 0);
    const releasedRewards = referrals.reduce((acc, curr) => {
      if (curr.status === 'completed' || curr.status === 'paid') {
        return acc + curr.reward_amount;
      }
      return acc + (Number(curr.reward_released) || 0);
    }, 0);
    const totalOrderVolume = referrals.reduce((acc, curr) => acc + curr.order_total, 0);

    return {
      totalCount,
      completedCount: completedList.length,
      pendingCount: pendingList.length,
      totalRewards,
      releasedRewards,
      totalOrderVolume,
    };
  }, [referrals]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Programa de Indicações</h2>
            <Badge variant="outline" className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200">
              10% Cashback
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie o histórico de clientes que indicaram amigos e suas comissões conectadas ao Supabase
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={loadReferrals}
            disabled={loading}
            className="h-9 gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>

          <Button
            size="sm"
            onClick={() => setNewDialogOpen(true)}
            className="h-9 gap-1.5 bg-primary text-primary-foreground shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Nova Indicação
          </Button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total de Indicações
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight tabular-nums">
              {stats.totalCount}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stats.completedCount} convertidas em vendas
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Cashback Liberado
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
              R$ {stats.releasedRewards.toFixed(2).replace('.', ',')}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Liberado via entregas e carnês pagos
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Volume em Vendas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight tabular-nums">
              R$ {stats.totalOrderVolume.toFixed(2).replace('.', ',')}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Faturamento trazido por convites
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Aguardando Entrega / Carnê
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
              {stats.pendingCount}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Comissões em liberação proporcional
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rules & Sync Banner */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-600/10 text-emerald-600 shrink-0 mt-0.5">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Regra de Liberação da Comissão (10%)</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              • <strong>Dinheiro ou PIX:</strong> A comissão fica pendente e é liberada 100% no ato da entrega.<br />
              • <strong>Carnê:</strong> Liberada na proporção de cada carnê quitado (ex: em 4x, cada carnê pago libera 10% do valor da parcela).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Sincronizado com Supabase</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, amigo, código ou pedido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Status segmented filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'completed', label: 'Concluídos' },
            { id: 'pending', label: 'Pendentes' },
            { id: 'paid', label: 'Pagos/Creditados' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Referrals Table */}
      <Card className="border border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/70 hover:bg-transparent">
                <TableHead className="text-xs font-semibold">Quem Indicou</TableHead>
                <TableHead className="text-xs font-semibold">Amigo Indicado</TableHead>
                <TableHead className="text-xs font-semibold">Código</TableHead>
                <TableHead className="text-xs font-semibold">Pedido & Pagto</TableHead>
                <TableHead className="text-xs font-semibold text-right">Valor Compra</TableHead>
                <TableHead className="text-xs font-semibold text-right">Comissão Total</TableHead>
                <TableHead className="text-xs font-semibold">Liberação do Cashback</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
                <TableHead className="text-xs font-semibold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-xs text-muted-foreground">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                    Carregando indicações do Supabase...
                  </TableCell>
                </TableRow>
              ) : filteredReferrals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-xs text-muted-foreground">
                    <Gift className="h-6 w-6 mx-auto mb-2 opacity-40" />
                    Nenhuma indicação encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filteredReferrals.map((item) => {
                  const dateFormatted = new Date(item.created_at).toLocaleDateString('pt-BR');
                  const isCarne = item.payment_method === 'carne' || (item.installments_total && item.installments_total > 1);
                  const isMoneyOrPix = item.payment_method === 'money' || item.payment_method === 'pix';
                  const totalInstallments = item.installments_total || 1;
                  const paidInstallments = Math.min(item.installments_paid || 0, totalInstallments);
                  const released = Number(item.reward_released) || (item.status === 'completed' || item.status === 'paid' ? item.reward_amount : 0);
                  const progressPct = totalInstallments > 0 ? Math.round((paidInstallments / totalInstallments) * 100) : 0;
                  const orderRef = item.order_number || item.order_id || item.id;

                  return (
                    <TableRow key={item.id} className="border-border/60 hover:bg-muted/30 transition-colors">
                      {/* Referrer */}
                      <TableCell className="py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-foreground truncate max-w-[150px]">
                            {item.referrer_name || 'Cliente'}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {item.referrer_phone || 'Sem telefone'}
                          </span>
                        </div>
                      </TableCell>

                      {/* Friend */}
                      <TableCell className="py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-xs text-foreground truncate max-w-[150px]">
                            {item.friend_name}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {dateFormatted}
                          </span>
                        </div>
                      </TableCell>

                      {/* Code */}
                      <TableCell className="py-3">
                        <Badge variant="outline" className="font-mono text-[11px] bg-muted/40">
                          {item.referral_code}
                        </Badge>
                      </TableCell>

                      {/* Order & Payment Method */}
                      <TableCell className="py-3">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-xs text-muted-foreground">
                            {item.order_number || '-'}
                          </span>
                          {isCarne ? (
                            <Badge variant="outline" className="w-fit text-[10px] font-medium bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400">
                              Carnê ({totalInstallments}x)
                            </Badge>
                          ) : item.payment_method === 'pix' ? (
                            <Badge variant="outline" className="w-fit text-[10px] font-medium bg-teal-50 text-teal-700 border-teal-300 dark:bg-teal-950/40 dark:text-teal-400">
                              PIX (Na entrega)
                            </Badge>
                          ) : item.payment_method === 'money' ? (
                            <Badge variant="outline" className="w-fit text-[10px] font-medium bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400">
                              Dinheiro (Na entrega)
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="w-fit text-[10px] font-medium bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-400">
                              Cartão
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Order Value */}
                      <TableCell className="py-3 text-right tabular-nums text-xs font-medium">
                        R$ {item.order_total.toFixed(2).replace('.', ',')}
                      </TableCell>

                      {/* Total Reward */}
                      <TableCell className="py-3 text-right tabular-nums text-xs font-bold text-foreground">
                        R$ {item.reward_amount.toFixed(2).replace('.', ',')}
                      </TableCell>

                      {/* Proportional Release Column */}
                      <TableCell className="py-3">
                        {isCarne ? (
                          <div className="space-y-1 min-w-[140px]">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                R$ {released.toFixed(2).replace('.', ',')} liberados
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {paidInstallments}/{totalInstallments} pagos
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground block">
                              10% por carnê pago
                            </span>
                          </div>
                        ) : isMoneyOrPix ? (
                          <div className="space-y-0.5">
                            {item.status === 'completed' || item.status === 'paid' ? (
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                R$ {released.toFixed(2).replace('.', ',')} (Entrega paga)
                              </span>
                            ) : (
                              <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Pendente (Aguardando entrega)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-600">
                            R$ {released.toFixed(2).replace('.', ',')} liberados
                          </span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3">
                        {item.status === 'completed' ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-medium">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Liberado
                          </Badge>
                        ) : item.status === 'paid' ? (
                          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 text-[11px] font-medium">
                            Creditado/Pago
                          </Badge>
                        ) : item.status === 'cancelled' ? (
                          <Badge variant="destructive" className="text-[11px]">
                            Cancelado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300 text-[11px]">
                            <Clock className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Carnet Installment Action */}
                          {isCarne && paidInstallments < totalInstallments && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-[11px] border-amber-300 text-amber-800 bg-amber-50/50 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-300"
                              title="Baixar 1 parcela do carnê e liberar proporção de 10%"
                              onClick={() => handleAdvanceCarnet(orderRef)}
                            >
                              Baixar Carnê (+1)
                            </Button>
                          )}

                          {/* Cash / Pix Delivery Payment Action */}
                          {isMoneyOrPix && item.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-[11px] border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              title="Confirmar pagamento recebido na entrega e liberar 100% da comissão"
                              onClick={() => handleConfirmDeliveryPayment(orderRef)}
                            >
                              Confirmar Entrega
                            </Button>
                          )}

                          {/* Mark as paid/credited */}
                          {item.status === 'completed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-[11px] border-blue-300 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                              onClick={() => handleStatusChange(item.id, 'paid')}
                            >
                              Marcar Pago
                            </Button>
                          )}

                          {item.referrer_phone && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              title="Avisar no WhatsApp"
                              onClick={() => {
                                const phoneNum = item.referrer_phone?.replace(/\D/g, '');
                                const text = encodeURIComponent(
                                  `Olá ${item.referrer_name}! 🎉 Sua indicação de ${item.friend_name} gerou R$ ${released.toFixed(2).replace('.', ',')} de cashback liberado para você usar nas suas cestas do Mercado Fácil!`
                                );
                                window.open(`https://wa.me/55${phoneNum}?text=${text}`, '_blank');
                              }}
                            >
                              <Send className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* New Referral Modal */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Nova Indicação</DialogTitle>
            <DialogDescription>
              Lance manualmente uma indicação ou pedido feito por indicação. Os dados são salvos no banco.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Quem Indicou</Label>
                <Input
                  placeholder="Nome do cliente"
                  value={newReferral.referrer_name}
                  onChange={(e) => setNewReferral({ ...newReferral, referrer_name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">WhatsApp de Quem Indicou</Label>
                <Input
                  placeholder="11999999999"
                  value={newReferral.referrer_phone}
                  onChange={(e) => setNewReferral({ ...newReferral, referrer_phone: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Amigo Indicado</Label>
                <Input
                  placeholder="Nome do amigo"
                  value={newReferral.friend_name}
                  onChange={(e) => setNewReferral({ ...newReferral, friend_name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">WhatsApp do Amigo</Label>
                <Input
                  placeholder="11988888888"
                  value={newReferral.friend_phone}
                  onChange={(e) => setNewReferral({ ...newReferral, friend_phone: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Código Utilizado</Label>
                <Input
                  placeholder="Ex: CESTA-1234"
                  value={newReferral.referral_code}
                  onChange={(e) => setNewReferral({ ...newReferral, referral_code: e.target.value })}
                  className="h-9 text-xs font-mono uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nº do Pedido</Label>
                <Input
                  placeholder="Ex: ORD-1092"
                  value={newReferral.order_number}
                  onChange={(e) => setNewReferral({ ...newReferral, order_number: e.target.value })}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Forma de Pagamento</Label>
                <select
                  value={newReferral.payment_method}
                  onChange={(e) => setNewReferral({ ...newReferral, payment_method: e.target.value as 'carne' | 'money' | 'pix' | 'credit_card' })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="carne">Carnê (Libera por parcela)</option>
                  <option value="money">Dinheiro (Libera na entrega)</option>
                  <option value="pix">PIX (Libera na entrega)</option>
                  <option value="credit_card">Cartão de Crédito</option>
                </select>
              </div>

              {newReferral.payment_method === 'carne' ? (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Qtd Parcelas do Carnê</Label>
                  <select
                    value={newReferral.installments_total}
                    onChange={(e) => setNewReferral({ ...newReferral, installments_total: parseInt(e.target.value) || 1 })}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value={2}>2x (50% por carnê)</option>
                    <option value={3}>3x (33,3% por carnê)</option>
                    <option value={4}>4x (25% por carnê)</option>
                    <option value={5}>5x (20% por carnê)</option>
                    <option value={6}>6x (16,6% por carnê)</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Liberação</Label>
                  <div className="h-9 flex items-center px-3 rounded-md bg-muted text-[11px] text-muted-foreground">
                    {newReferral.payment_method === 'credit_card' ? 'Imediata / Na aprovação' : 'No ato da entrega'}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Valor da Cesta do Amigo (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="350.00"
                value={newReferral.order_total}
                onChange={(e) => setNewReferral({ ...newReferral, order_total: e.target.value })}
                className="h-9 text-xs"
              />
              <p className="text-[11px] text-emerald-600 font-medium">
                Comissão de 10%: R${' '}
                {(
                  (parseFloat(newReferral.order_total.replace(',', '.')) || 0) * 0.10
                ).toFixed(2).replace('.', ',')}
                {newReferral.payment_method === 'carne' && (
                  <span className="text-muted-foreground ml-1">
                    (R$ {(((parseFloat(newReferral.order_total.replace(',', '.')) || 0) * 0.10) / (newReferral.installments_total || 1)).toFixed(2).replace('.', ',')} liberados a cada carnê pago)
                  </span>
                )}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setNewDialogOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCreateReferral} className="bg-primary text-primary-foreground">
              Salvar no Supabase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
