import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Gift, Share2, Copy, Check, DollarSign, Users, Sparkles, Send, Wallet,
    Clock, CheckCircle2, ArrowLeft, ArrowUpRight, ShoppingBag, Calculator, Info, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/Header';
import { MobileNavBar } from '@/components/MobileNavBar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { fetchReferralsFromSupabase, ReferralRecord } from '@/services/referralService';
import { supabase } from '@/lib/supabase';

interface Referral {
    id: string;
    friendName: string;
    date: string;
    status: 'completed' | 'pending';
    purchaseValue?: number;
    reward: number;
    paymentMethod?: string;
    installmentsTotal?: number;
    installmentsPaid?: number;
    rewardReleased: number;
    notes?: string;
}

const Indicacao = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);
    const [loadingReferrals, setLoadingReferrals] = useState(false);

    // Referral Code
    const referralCode = user ? `CESTA-${user.phone.replace(/\D/g, '').slice(-4) || '2026'}` : 'CESTA-2026';
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [totalEarned, setTotalEarned] = useState(0);
    const [balance, setBalance] = useState(0);

    // Calculator State
    const [simulatedPurchase, setSimulatedPurchase] = useState<number>(350);

    const loadUserReferrals = async () => {
        if (!user) return;
        setLoadingReferrals(true);
        try {
            const records: ReferralRecord[] = await fetchReferralsFromSupabase(user.id, user.phone, referralCode);
            if (records && records.length > 0) {
                const mapped: Referral[] = records.map(r => {
                    const instTotal = r.installments_total || 1;
                    const instPaid = r.installments_paid || 0;
                    const released = r.reward_released !== undefined && r.reward_released !== null
                        ? Number(r.reward_released)
                        : (r.status === 'completed' || r.status === 'paid' ? Number(r.reward_amount) : 0);

                    return {
                        id: r.id,
                        friendName: r.friend_name,
                        date: new Date(r.created_at).toLocaleDateString('pt-BR'),
                        status: (r.status === 'completed' || r.status === 'paid' || (instTotal > 1 && instPaid >= instTotal)) ? 'completed' : 'pending',
                        purchaseValue: r.order_total,
                        reward: r.reward_amount,
                        paymentMethod: r.payment_method,
                        installmentsTotal: instTotal,
                        installmentsPaid: instPaid,
                        rewardReleased: released,
                        notes: r.notes
                    };
                });
                setReferrals(mapped);
                const earned = mapped.reduce((acc, m) => acc + (m.rewardReleased || 0), 0);
                setTotalEarned(earned);
                setBalance(earned);
            } else {
                setReferrals([]);
                setTotalEarned(0);
                setBalance(0);
            }
        } catch (e) {
            console.error('Error fetching referrals from Supabase:', e);
        } finally {
            setLoadingReferrals(false);
        }
    };

    useEffect(() => {
        loadUserReferrals();

        const channel = supabase
            .channel('public:user_referrals')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'referrals' }, () => {
                loadUserReferrals();
            })
            .subscribe();

        return () => {
            void supabase.removeChannel(channel);
        };
        // Re-subscribe only when the customer (and therefore the code) changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, referralCode]);

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(referralCode);
        } catch (error) {
            console.warn('Clipboard unavailable:', error);
        }
        setCopied(true);
        toast({
            title: "Código copiado! 🚀",
            description: `Código ${referralCode} copiado com sucesso!`,
        });
        setTimeout(() => setCopied(false), 2500);
    };

    const registerLink = `${window.location.origin}/login?ref=${referralCode}`;

    const handleShareWhatsApp = () => {
        const message = encodeURIComponent(
            `🛒 *Ganhe 10% de desconto na sua Cesta Básica!*\n\nOlá! Crie sua conta na Cesta Fácil com o meu código exclusivo *${referralCode}* e ganhe 10% de desconto no seu 1º pedido:\n\n👉 *Link para Criar Conta:* ${registerLink}\n\nAcesse e aproveite!`
        );
        window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container py-12 text-center max-w-md">
                    <div className="p-4 rounded-full bg-primary/10 text-primary inline-block mb-4">
                        <Gift className="h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Programa de Indicação</h1>
                    <p className="text-muted-foreground mb-6">Faça login para acessar seu código exclusivo e acompanhar seus ganhos de 10%.</p>
                    <Button onClick={() => navigate('/login')} className="w-full">
                        Entrar na Conta
                    </Button>
                </main>
                <MobileNavBar />
            </div>
        );
    }

    const completedCount = referrals.filter(r => r.status === 'completed').length;
    const simulatedEarn = (simulatedPurchase * 0.10);

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container py-8 pb-24 md:pb-12 max-w-3xl">
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="mb-6 pl-0 hover:bg-transparent hover:text-primary transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                </Button>

                {/* Hero Header */}
                <div className="bg-gradient-to-br from-emerald-600 via-primary to-teal-700 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden mb-8">
                    <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="space-y-2 max-w-xl">
                            <Badge className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-md border-0 text-xs font-semibold uppercase tracking-wider mb-1">
                                <Sparkles className="h-3.5 w-3.5 mr-1" /> Indique e Ganhe 10%
                            </Badge>
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                                Ganhe 10% do valor de cada cesta indicada!
                            </h1>
                            <p className="text-white/90 text-sm md:text-base leading-relaxed">
                                Compartilhe seu código com amigos e familiares. Quando eles comprarem, seu amigo recebe 10% de desconto e você ganha 10% do valor em créditos!
                            </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center shrink-0 self-start md:self-center">
                            <span className="text-xs text-white/80 font-medium block mb-1">Seu Saldo Disponível</span>
                            <span className="text-3xl font-black text-white block">
                                R$ {balance.toFixed(2).replace('.', ',')}
                            </span>
                            <Button
                                size="sm"
                                onClick={() => navigate('/montar-cesta')}
                                className="mt-3 w-full bg-white text-emerald-700 hover:bg-emerald-50 font-bold shadow-md text-xs"
                            >
                                <ShoppingBag className="h-3.5 w-3.5 mr-1" /> Usar nas Cestas
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Metrics Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                                <DollarSign className="h-4 w-4" />
                            </div>
                            Total Ganho
                        </div>
                        <span className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                            R$ {totalEarned.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-1">10% de cashback total</span>
                    </div>

                    <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                <Wallet className="h-4 w-4" />
                            </div>
                            Saldo Atual
                        </div>
                        <span className="text-xl md:text-2xl font-black text-foreground">
                            R$ {balance.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-1">Disponível no carrinho</span>
                    </div>

                    <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
                                <Users className="h-4 w-4" />
                            </div>
                            Indicados
                        </div>
                        <span className="text-xl md:text-2xl font-black text-foreground">
                            {completedCount} {completedCount === 1 ? 'amigo' : 'amigos'}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-1">Compras confirmadas</span>
                    </div>

                    <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                                <Clock className="h-4 w-4" />
                            </div>
                            Pendentes
                        </div>
                        <span className="text-xl md:text-2xl font-black text-foreground">
                            {referrals.filter(r => r.status === 'pending').length}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-1">Aguardando entrega</span>
                    </div>
                </div>

                {/* Referral Code & Share Section */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm mb-8 space-y-4">
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Share2 className="h-5 w-5 text-primary" />
                            Seu Link e Código de Indicação
                        </h2>
                        <p className="text-xs text-muted-foreground">Envie seu código exclusivo para familiares e amigos para acumular créditos.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground">Código Promocional</Label>
                            <div className="relative">
                                <Input
                                    readOnly
                                    value={referralCode}
                                    className="font-mono font-bold text-lg bg-muted/50 border-primary/40 tracking-wider text-primary pr-12 text-center md:text-left"
                                />
                                <button
                                    onClick={handleCopyCode}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1"
                                >
                                    {copied ? <Check className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col justify-end gap-2">
                            <Label className="text-xs font-semibold text-muted-foreground hidden md:block">Ação Rápida</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    onClick={handleCopyCode}
                                    variant="outline"
                                    className="border-primary/30 text-primary hover:bg-primary/10 h-11"
                                >
                                    {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
                                    Copiar
                                </Button>
                                <Button
                                    onClick={handleShareWhatsApp}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md h-11"
                                >
                                    <Send className="h-4 w-4 mr-1.5" />
                                    WhatsApp
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-border/60">
                        <span className="text-[11px] text-muted-foreground block mb-1">
                            👉 Link direto para o amigo criar a conta com seu desconto já aplicado:
                        </span>
                        <div className="flex items-center gap-2">
                            <Input
                                readOnly
                                value={registerLink}
                                aria-label="Link direto para criar conta"
                                className="font-mono text-xs bg-muted/40 h-9"
                            />
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    navigator.clipboard.writeText(registerLink);
                                    setCopied(true);
                                    toast({ title: 'Link copiado!', description: 'Link direto de cadastro copiado com sucesso.' });
                                    setTimeout(() => setCopied(false), 2000);
                                }}
                                className="h-9 text-xs shrink-0"
                            >
                                <Copy className="h-3.5 w-3.5 mr-1" />
                                Copiar Link
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Interactive Earnings Calculator */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm mb-8 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Calculator className="h-5 w-5 text-emerald-600" />
                            Simulador de Ganhos (10%)
                        </h2>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200">
                            Cashback 10%
                        </span>
                    </div>

                    <p className="text-xs text-muted-foreground">Arraste para simular o valor da cesta que seu amigo vai comprar:</p>

                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Valor da Cesta do Amigo:</span>
                            <span className="text-lg font-bold text-foreground">
                                R$ {simulatedPurchase.toFixed(2).replace('.', ',')}
                            </span>
                        </div>

                        <Slider
                            value={[simulatedPurchase]}
                            min={100}
                            max={1000}
                            step={25}
                            onValueChange={(val) => setSimulatedPurchase(val[0])}
                            className="py-2"
                        />

                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
                            <div>
                                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium block">Você ganha na sua conta:</span>
                                <span className="text-xs text-muted-foreground">E seu amigo ganha R$ {simulatedEarn.toFixed(2).replace('.', ',')} de desconto</span>
                            </div>
                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                +R$ {simulatedEarn.toFixed(2).replace('.', ',')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* How it Works Step-by-Step */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm mb-8">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Info className="h-5 w-5 text-primary" />
                        Passo a Passo
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-muted/40 p-4 rounded-xl border border-border/50 flex flex-col justify-between space-y-2">
                            <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                                1
                            </div>
                            <p className="font-bold text-sm text-foreground">Compartilhe o Código</p>
                            <p className="text-xs text-muted-foreground">Envie seu código pelo WhatsApp ou copie o link direto para seus amigos.</p>
                        </div>

                        <div className="bg-muted/40 p-4 rounded-xl border border-border/50 flex flex-col justify-between space-y-2">
                            <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                                2
                            </div>
                            <p className="font-bold text-sm text-foreground">Amigo Realiza o Pedido</p>
                            <p className="text-xs text-muted-foreground">Seu amigo insere o código no checkout e ganha 10% de desconto na primeira compra.</p>
                        </div>

                        <div className="bg-muted/40 p-4 rounded-xl border border-border/50 flex flex-col justify-between space-y-2">
                            <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                                3
                            </div>
                            <p className="font-bold text-sm text-foreground">Você Recebe 10%</p>
                            <p className="text-xs text-muted-foreground">Assim que a entrega for realizada, 10% do valor do pedido entra como crédito na sua conta!</p>
                        </div>
                    </div>
                </div>

                {/* Referral History */}
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-bold">Histórico de Indicações</h2>
                            <p className="text-xs text-muted-foreground">Acompanhe seus amigos indicados e comissões recebidas</p>
                        </div>
                        <Badge variant="outline" className="font-mono">
                            {referrals.length} registradas
                        </Badge>
                    </div>

                    <div className="space-y-3">
                        {referrals.map((ref) => {
                            const isCarne = ref.paymentMethod === 'carne' || ref.paymentMethod === 'carnet' || (ref.installmentsTotal && ref.installmentsTotal > 1);
                            const isCashOrPix = ref.paymentMethod === 'money' || ref.paymentMethod === 'pix';
                            const isFullyReleased = ref.status === 'completed' || (ref.rewardReleased >= ref.reward && ref.reward > 0);

                            return (
                                <div
                                    key={ref.id}
                                    className="bg-muted/30 rounded-xl p-4 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:bg-muted/50"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${isFullyReleased ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                            {isFullyReleased ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-bold text-sm text-foreground">{ref.friendName}</p>
                                                {isCarne ? (
                                                    <Badge variant="outline" className="text-[10px] bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200">
                                                        Carnê {ref.installmentsPaid}/{ref.installmentsTotal} parcelas pagas
                                                    </Badge>
                                                ) : isCashOrPix ? (
                                                    <Badge variant="outline" className="text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200">
                                                        {ref.paymentMethod === 'pix' ? 'PIX' : 'Dinheiro'} na entrega
                                                    </Badge>
                                                ) : null}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {ref.date} {ref.purchaseValue ? `• Compra: R$ ${ref.purchaseValue.toFixed(2).replace('.', ',')}` : ''}
                                            </p>
                                            {isCarne && (
                                                <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium mt-1">
                                                    10% liberado a cada carnê pago ({ref.installmentsPaid} de {ref.installmentsTotal} baixadas)
                                                </p>
                                            )}
                                            {isCashOrPix && !isFullyReleased && (
                                                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1">
                                                    Pendente até o pagamento no ato da entrega
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-border/40">
                                        <Badge
                                            variant={isFullyReleased ? 'default' : 'secondary'}
                                            className={isFullyReleased ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                                        >
                                            {isFullyReleased ? 'Liberado (10%)' : isCarne ? `${ref.installmentsPaid}/${ref.installmentsTotal} Carnês` : 'No ato da Entrega'}
                                        </Badge>
                                        <div className="text-right">
                                            <span className={`font-black text-base ${ref.rewardReleased > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                                                +R$ {ref.rewardReleased.toFixed(2).replace('.', ',')}
                                            </span>
                                            {ref.rewardReleased < ref.reward && (
                                                <p className="text-[10px] text-muted-foreground">de R$ {ref.reward.toFixed(2).replace('.', ',')}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            <MobileNavBar />
        </div>
    );
};

export default Indicacao;
