import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/PhoneInput';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [showNameInput, setShowNameInput] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login, updateUserName } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [searchParams] = useSearchParams();
    const returnUrl = searchParams.get('returnUrl') || '/';

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
                description: 'Tente novamente mais tarde.',
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
            toast({
                title: 'Bem-vindo!',
                description: `Olá, ${name}! Seu cadastro foi concluído.`,
            });
            navigate(returnUrl);
        } catch (error) {
            toast({
                title: 'Erro ao salvar nome',
                description: 'Tente novamente.',
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
