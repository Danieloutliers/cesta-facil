import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingCart, Gift, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/PhoneInput';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { createReferralInSupabase } from '@/services/referralService';
import { supabase } from '@/lib/supabase';

export default function Login() {
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [showNameInput, setShowNameInput] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login, updateUserName } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [searchParams] = useSearchParams();
    const rawReturnUrl = searchParams.get('returnUrl') || '/';
    // Only allow internal routes to avoid open-redirect style navigation.
    const returnUrl = rawReturnUrl.startsWith('/') && !rawReturnUrl.startsWith('//')
        ? rawReturnUrl
        : '/';

    // Referral code detection
    const [referralCode, setReferralCode] = useState<string>('');

    useEffect(() => {
        const urlRef = searchParams.get('ref') || searchParams.get('indicacao') || '';
        if (urlRef) {
            const cleanCode = urlRef.trim().toUpperCase();
            setReferralCode(cleanCode);
            localStorage.setItem('cesta_referral_code', cleanCode);
        } else {
            const saved = localStorage.getItem('cesta_referral_code');
            if (saved) setReferralCode(saved);
        }
    }, [searchParams]);

    const registerReferral = async (friendName: string, friendPhone: string) => {
        if (!referralCode) return;

        const cleanPhone = friendPhone.replace(/\D/g, '');
        try {
            // Avoid creating a duplicate pending referral every time the friend
            // logs in again through the same shared link.
            const { data: existing } = await supabase
                .from('referrals')
                .select('id')
                .eq('friend_phone', cleanPhone)
                .eq('referral_code', referralCode)
                .limit(1);

            if (existing && existing.length > 0) return;

            await createReferralInSupabase({
                referrer_id: '',
                referral_code: referralCode,
                friend_name: friendName,
                friend_phone: cleanPhone,
                order_total: 0,
                reward_amount: 0,
                status: 'pending',
                notes: `Cadastro via link de indicação (${referralCode})`
            });

            localStorage.removeItem('cesta_referral_code');
            sessionStorage.removeItem('cesta_referral_code');
        } catch (error) {
            console.warn('Could not register referral on login:', error);
        }
    };

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Remove formatting for storage
        const cleanPhone = phone.replace(/\D/g, '');

        if (cleanPhone.length !== 11) {
            toast({
                title: 'Telefone inválido',
                description: 'Por favor, digite um número de telefone válido.',
                variant: 'destructive',
            });
            return;
        }

        try {
            setLoading(true);
            const { isNewUser } = await login(cleanPhone);

            if (isNewUser) {
                // Show name input for new users
                setShowNameInput(true);
            } else {
                // If logging in with a referral code for the first time
                await registerReferral('Cliente Cesta Fácil', phone);

                // Existing user, go to return URL or home
                toast({
                    title: 'Login realizado!',
                    description: 'Bem-vindo de volta ao Mercado Fácil.',
                });
                navigate(returnUrl);
            }
        } catch (error) {
            toast({
                title: 'Erro ao fazer login',
                description: error instanceof Error ? error.message : 'Tente novamente mais tarde.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleNameSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast({
                title: 'Nome obrigatório',
                description: 'Por favor, digite seu nome.',
                variant: 'destructive',
            });
            return;
        }

        try {
            setLoading(true);
            await updateUserName(name.trim());

            // If a referral code was active, record the referral
            await registerReferral(name.trim(), phone);

            toast({
                title: 'Bem-vindo!',
                description: referralCode
                    ? `Olá, ${name}! Seu cadastro foi concluído com o cupom ${referralCode} ativado.`
                    : `Olá, ${name}! Seu cadastro foi concluído.`,
            });
            navigate(returnUrl);
        } catch (error) {
            toast({
                title: 'Erro ao salvar nome',
                description: error instanceof Error ? error.message : 'Tente novamente.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-primary">
                            <ShoppingCart className="h-8 w-8 text-primary-foreground" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">
                        {showNameInput ? 'Complete seu cadastro' : 'Bem-vindo ao Mercado Fácil'}
                    </CardTitle>
                    <CardDescription>
                        {showNameInput
                            ? 'Por favor, nos diga seu nome'
                            : 'Digite seu telefone para continuar'
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {referralCode && (
                        <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-left">
                            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                                <Gift className="h-4 w-4 text-emerald-600 shrink-0" />
                                <span>Você foi indicado com o código:</span>
                                <span className="font-mono bg-white dark:bg-neutral-900 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300">
                                    {referralCode}
                                </span>
                            </div>
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                                Conclua seu cadastro para garantir <strong>10% de desconto</strong> no seu primeiro pedido de cesta!
                            </p>
                        </div>
                    )}
                    {!showNameInput ? (
                        <form onSubmit={handlePhoneSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="phone" className="text-sm font-medium">
                                    Telefone
                                </label>
                                <PhoneInput
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    disabled={loading}
                                    autoFocus
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                size="lg"
                                disabled={loading}
                            >
                                {loading ? 'Verificando...' : 'Continuar'}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleNameSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-medium">
                                    Nome completo
                                </label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Digite seu nome"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={loading}
                                    autoFocus
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                size="lg"
                                disabled={loading}
                            >
                                {loading ? 'Salvando...' : 'Concluir cadastro'}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
