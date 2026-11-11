import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Phone } from 'lucide-react';
import { toast } from 'sonner';

export default function DeliveryLogin() {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!phone || phone.length < 10) {
            toast.error('Digite um número de telefone válido');
            return;
        }

        setLoading(true);

        try {
            // Save phone to localStorage for simple auth
            localStorage.setItem('delivery_driver_phone', phone);
            localStorage.setItem('delivery_driver_logged_in', 'true');

            toast.success('Login efetuado com sucesso!');
            navigate('/delivery');
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
                        <Truck className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl">Entregador</CardTitle>
                    <CardDescription>
                        Digite seu número de telefone para acessar
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="phone" className="text-sm font-medium">
                                Telefone
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="(77) 98855-1433"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                    className="pl-10"
                                    maxLength={11}
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 bg-green-600 hover:bg-green-700"
                            disabled={loading}
                        >
                            {loading ? 'Entrando...' : 'Entrar'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
