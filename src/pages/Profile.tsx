import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Save, LogOut, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileNavBar } from '@/components/MobileNavBar';
import { useAuth, Address } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const Profile = () => {
    const navigate = useNavigate();
    const { user, updateUserName, updateUserAddress, logout } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

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

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            if (user.address) {
                setAddress({
                    ...address,
                    ...user.address
                });
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

            // Update Name
            if (name !== user.name) {
                await updateUserName(name);
            }

            // Update Address
            // Basic validation
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

    if (!user) return null;

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
