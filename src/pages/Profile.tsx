import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, MapPin, Save, LogOut, ArrowLeft, Gift, Share2, Copy, Check,
    DollarSign, Users, Sparkles, Send, Wallet, Clock, CheckCircle2, ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/Header';
import { MobileNavBar } from '@/components/MobileNavBar';
import { useAuth, Address } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface Referral {
    id: string;
    friendName: string;
    date: string;
    status: 'completed' | 'pending';
    purchaseValue?: number;
    reward: number;
}

const Profile = () => {
    const navigate = useNavigate();
    const { user, updateUserName, updateUserAddress, logout } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const [name, setName] = useState('');
    const [address, setAddress] = useState<Address>({
        street: '',
        number: '',
        neighborhood: '',
        complement: '',
        city: 'Guanambi',
        state: 'BA',
        zip: '46430-000'
    });

    // Referral state
    const referralCode = user ? `CESTA-${user.phone.replace(/\D/g, '').slice(-4) || '2026'}` : 'CESTA-2026';
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [totalEarned, setTotalEarned] = useState(95.00);
    const [balance, setBalance] = useState(65.00);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            if (user.address) {
                setAddress((prev) => ({
                    ...prev,
                    ...user.address
                }));
            }

            // Load referral data from localStorage or set defaults
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
                // Initial demo referral history (10% of purchase)
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
        } else {
            navigate('/login');
        }
    }, [user, navigate]);

    const handleAddressChange = (field: keyof Address, value: string) => {
        setAddress((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!user) return;

        try {
            setLoading(true);

            if (name !== user.name) {
                await updateUserName(name);
            }

            if (address.street || address.neighborhood) {
                await updateUserAddress(address);
            }

            toast({
                title: "Perfil atualizado!",
                description: "Seus dados foram salvos com sucesso.",
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            toast({
                title: "Erro ao atualizar",
                description: "Não foi possível salvar os dados. Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        toast({
            title: "Código copiado! 🚀",
            description: `Código ${referralCode} copiado para a área de transferência.`,
        });
        setTimeout(() => setCopied(false), 2500);
    };

    const handleShareWhatsApp = () => {
        const message = encodeURIComponent(
            `🛒 *Ganhe 10% de desconto no Mercado Fácil!*\n\nMonte sua cesta básica personalizada do seu jeito e economize! Use o meu código de indicação *${referralCode}* e ganhe 10% de desconto no seu primeiro pedido.\n\nAcesse agora: ${window.location.origin}`
        );
        window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
    };

    if (!user) return null;

    const completedCount = referrals.filter(r => r.status === 'completed').length;

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container py-8 pb-24 md:pb-12 max-w-2xl">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/historico')}
                    className="mb-6 pl-0 hover:bg-transparent hover:text-primary transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar para Pedidos
                </Button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Meu Perfil</h1>
                        <p className="text-muted-foreground">{user.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}</p>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* PROGRAMA DE INDICAÇÃO - INDIQUE E GANHE 10% */}
                    <div className="bg-gradient-to-br from-emerald-500/10 via-primary/5 to-emerald-500/10 rounded-2xl border border-primary/20 p-6 shadow-md relative overflow-hidden">
                        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-sm">
                                    <Gift className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                        Indique e Ganhe 10%
                                        <Sparkles className="h-4 w-4 text-emerald-500 animate-pulse" />
                                    </h2>
                                    <p className="text-xs text-muted-foreground">Você ganha 10% do valor de cada cesta comprada por amigos indicados</p>
                                </div>
                            </div>
                            <Button
                                onClick={() => navigate('/indicacao')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shrink-0"
                            >
                                Acessar Página Completa <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                        </div>

                        {/* Metrics Cards */}
                        <div className="grid grid-cols-3 gap-3 my-5">
                            <div className="bg-card rounded-xl border border-border/60 p-3.5 flex flex-col justify-between shadow-xs">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                                    <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                    Total Ganho (10%)
                                </div>
                                <span className="text-lg md:text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                    R$ {totalEarned.toFixed(2).replace('.', ',')}
                                </span>
                            </div>

                            <div className="bg-card rounded-xl border border-border/60 p-3.5 flex flex-col justify-between shadow-xs">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                                    <Wallet className="h-3.5 w-3.5 text-primary" />
                                    Saldo Atual
                                </div>
                                <span className="text-lg md:text-xl font-extrabold text-foreground">
                                    R$ {balance.toFixed(2).replace('.', ',')}
                                </span>
                            </div>

                            <div className="bg-card rounded-xl border border-border/60 p-3.5 flex flex-col justify-between shadow-xs">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                                    <Users className="h-3.5 w-3.5 text-blue-500" />
                                    Indicados
                                </div>
                                <span className="text-lg md:text-xl font-extrabold text-foreground">
                                    {completedCount} {completedCount === 1 ? 'amigo' : 'amigos'}
                                </span>
                            </div>
                        </div>

                        {/* Referral Code & Share Link */}
                        <div className="bg-card/80 backdrop-blur-xs rounded-xl border border-border p-4 mb-5">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                                Seu Código de Indicação Exclusivo
                            </Label>
                            <div className="flex flex-col sm:flex-row items-center gap-2">
                                <div className="relative w-full">
                                    <Input
                                        readOnly
                                        value={referralCode}
                                        className="font-mono text-center sm:text-left text-base font-bold bg-muted/60 border-primary/30 tracking-wider text-primary pr-10"
                                    />
                                    <button
                                        onClick={handleCopyCode}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                        title="Copiar Código"
                                    >
                                        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                                    </button>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <Button
                                        onClick={handleCopyCode}
                                        variant="outline"
                                        className="flex-1 sm:flex-initial border-primary/30 text-primary hover:bg-primary/10"
                                    >
                                        {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
                                        Copiar
                                    </Button>
                                    <Button
                                        onClick={handleShareWhatsApp}
                                        className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                    >
                                        <Send className="h-4 w-4 mr-1.5" />
                                        WhatsApp
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* How it works */}
                        <div className="mb-5">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Como Funciona</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="flex items-start gap-3 bg-card/60 p-3 rounded-lg border border-border/50">
                                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                        1
                                    </div>
                                    <div className="text-xs">
                                        <p className="font-semibold text-foreground">Envie seu código</p>
                                        <p className="text-muted-foreground">Compartilhe com seus amigos por WhatsApp</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 bg-card/60 p-3 rounded-lg border border-border/50">
                                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                        2
                                    </div>
                                    <div className="text-xs">
                                        <p className="font-semibold text-foreground">Amigo compra</p>
                                        <p className="text-muted-foreground">Seu amigo ganha 10% de desconto no pedido</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 bg-card/60 p-3 rounded-lg border border-border/50">
                                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                        3
                                    </div>
                                    <div className="text-xs">
                                        <p className="font-semibold text-foreground">Você ganha 10%</p>
                                        <p className="text-muted-foreground">Você ganha 10% do valor da cesta em créditos</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Referral History List */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Histórico de Indicações</h3>
                                <span className="text-xs text-muted-foreground font-medium">{referrals.length} registradas</span>
                            </div>

                            <div className="space-y-2">
                                {referrals.map((ref) => (
                                    <div
                                        key={ref.id}
                                        className="bg-card rounded-lg p-3 border border-border flex items-center justify-between text-sm shadow-xs"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${ref.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                                {ref.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">{ref.friendName}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {ref.date} {ref.purchaseValue ? `• Compra: R$ ${ref.purchaseValue.toFixed(2).replace('.', ',')}` : ''}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Badge variant={ref.status === 'completed' ? 'default' : 'secondary'} className={ref.status === 'completed' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
                                                {ref.status === 'completed' ? 'Concluído (10%)' : 'Pendente'}
                                            </Badge>
                                            <span className={`font-bold text-sm ${ref.status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                                                +{ref.reward.toFixed(2).replace('.', ',')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Personal Info */}
                    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Dados Pessoais
                        </h2>
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nome Completo</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Como gostaria de ser chamado?"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Telefone</Label>
                                <Input
                                    id="phone"
                                    value={user.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                                    disabled
                                    className="bg-muted"
                                />
                                <p className="text-xs text-muted-foreground">O telefone não pode ser alterado.</p>
                            </div>
                        </div>
                    </div>

                    {/* Address Info */}
                    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-primary" />
                                Endereço de Entrega
                            </h2>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">
                                Guanambi-BA
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="neighborhood">Bairro</Label>
                                <Input
                                    id="neighborhood"
                                    value={address.neighborhood}
                                    onChange={(e) => handleAddressChange('neighborhood', e.target.value)}
                                    placeholder="Ex: Centro"
                                />
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-3 grid gap-2">
                                    <Label htmlFor="street">Rua</Label>
                                    <Input
                                        id="street"
                                        value={address.street}
                                        onChange={(e) => handleAddressChange('street', e.target.value)}
                                        placeholder="Nome da rua"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="number">Número</Label>
                                    <Input
                                        id="number"
                                        value={address.number}
                                        onChange={(e) => handleAddressChange('number', e.target.value)}
                                        placeholder="123"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="complement">Complemento (Opcional)</Label>
                                <Input
                                    id="complement"
                                    value={address.complement || ''}
                                    onChange={(e) => handleAddressChange('complement', e.target.value)}
                                    placeholder="Ex: Apt 101, Casa Azul..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-4">
                        <Button
                            onClick={handleSave}
                            className="w-full h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Salvando...
                                </div>
                            ) : (
                                <>
                                    <Save className="h-5 w-5 mr-2" />
                                    Salvar Alterações
                                </>
                            )}
                        </Button>

                        <Separator className="my-2" />

                        <Button
                            variant="outline"
                            onClick={handleLogout}
                            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                            <LogOut className="h-5 w-5 mr-2" />
                            Sair da Conta
                        </Button>
                    </div>
                </div>
            </main>

            <MobileNavBar />
        </div>
    );
};

export default Profile;
