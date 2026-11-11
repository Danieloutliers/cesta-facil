import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Gift, Share2, Copy, Check, DollarSign, Users, Sparkles, Send, Wallet,
    Clock, CheckCircle2, ArrowLeft, ArrowUpRight, ShoppingBag, Calculator, Info
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

interface Referral {
    id: string;
    friendName: string;
    date: string;
    status: 'completed' | 'pending';
    purchaseValue?: number;
    reward: number;
}

const Indicacao = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    // Referral Code
    const referralCode = user ? `CESTA-${user.phone.replace(/\D/g, '').slice(-4) || '2026'}` : 'CESTA-2026';
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [totalEarned, setTotalEarned] = useState(95.00);
    const [balance, setBalance] = useState(65.00);

    // Calculator State
    const [simulatedPurchase, setSimulatedPurchase] = useState<number>(350);

    useEffect(() => {
        if (user) {
            const storageKey = `mercadofacil_referrals_${user.id}_v2`;
            const savedReferralData = localStorage.getItem(storageKey);

            if (savedReferralData) {
                try {
                    const parsed = JSON.parse(savedReferralData);
                    setReferrals(parsed.referrals || []);
                    setTotalEarned(parsed.totalEarned ?? 95.00);
                    setBalance(parsed.balance ?? 65.00);
                } catch (e) {
                    console.error('Error reading referrals from storage', e);
                }
            } else {
                const initialReferrals: Referral[] = [
                    { id: '1', friendName: 'Carlos Eduardo', date: '04/11/2026', status: 'completed', purchaseValue: 350.00, reward: 35.00 },
                    { id: '2', friendName: 'Mariana Silva', date: '01/11/2026', status: 'completed', purchaseValue: 400.00, reward: 40.00 },
                    { id: '3', friendName: 'Fernanda Lima', date: '28/10/2026', status: 'completed', purchaseValue: 200.00, reward: 20.00 },
                    { id: '4', friendName: 'Roberto Alves', date: 'Hoje', status: 'pending', purchaseValue: 300.00, reward: 30.00 },
                ];
                setReferrals(initialReferrals);
                setTotalEarned(95.00);
                setBalance(65.00);
                localStorage.setItem(storageKey, JSON.stringify({
                    referrals: initialReferrals,
                    totalEarned: 95.00,
                    balance: 65.00
                }));
            }
        }
    }, [user]);

    const handleCopyCode = () => {
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        toast({
            title: "Código copiado! 🚀",
            description: `Código ${referralCode} copiado com sucesso!`,
        });
        setTimeout(() => setCopied(false), 2500);
    };

    const handleShareWhatsApp = () => {
        const message = encodeURIComponent(
            `🛒 *Ganhe 10% de desconto no Mercado Fácil!*\n\nMonte sua cesta básica personalizada do seu jeito e economize! Use o meu código de indicação *${referralCode}* e ganhe 10% de desconto no seu primeiro pedido.\n\nAcesse agora: ${window.location.origin}`
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
                        {referrals.map((ref) => (
                            <div
                                key={ref.id}
                                className="bg-muted/30 rounded-xl p-4 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:bg-muted/50"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl ${ref.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                        {ref.status === 'completed' ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-foreground">{ref.friendName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {ref.date} {ref.purchaseValue ? `• Compra: R$ ${ref.purchaseValue.toFixed(2).replace('.', ',')}` : ''}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-border/40">
                                    <Badge
                                        variant={ref.status === 'completed' ? 'default' : 'secondary'}
                                        className={ref.status === 'completed' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                                    >
                                        {ref.status === 'completed' ? 'Concluído (10%)' : 'Pendente'}
                                    </Badge>
                                    <span className={`font-black text-base ${ref.status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                                        +{ref.reward.toFixed(2).replace('.', ',')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <MobileNavBar />
        </div>
    );
};

export default Indicacao;
