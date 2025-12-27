import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Truck, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileNavBar } from '@/components/MobileNavBar';
import { PreferencesCard } from '@/components/PreferencesCard';
import { PaymentMethodCard } from '@/components/PaymentMethodCard';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { Address } from '@/types';
import { cn } from '@/lib/utils';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, total, budget, savings, addOrder, itemCount } = useCart();
  const [step, setStep] = useState<'address' | 'preferences' | 'success'>('address');
  const [missingPreference, setMissingPreference] = useState<'substituir' | 'credito'>('substituir');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [address, setAddress] = useState<Address>({
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  });

  const handleAddressChange = (field: keyof Address, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const isAddressValid = address.cep && address.street && address.number && address.neighborhood && address.city && address.state;

  const handleSubmit = async () => {
    if (step === 'address' && isAddressValid) {
      setStep('preferences');
    } else if (step === 'preferences') {
      try {
        setLoading(true);
        await addOrder(address, missingPreference);
        setStep('success');
      } catch (error) {
        toast({
          title: 'Erro ao criar pedido',
          description: 'Tente novamente mais tarde.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  if (itemCount === 0 && step !== 'success') {
    navigate('/montar-cesta');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 pb-24 md:pb-8">
        {step !== 'success' && (
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        )}

        <div className="max-w-4xl mx-auto">
          {step === 'success' ? (
            <div className="text-center py-16 animate-fade-in">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary mx-auto mb-6">
                <Check className="h-10 w-10 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Pedido Confirmado!</h1>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Seu pedido foi recebido com sucesso. Você receberá atualizações sobre a entrega.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => navigate('/historico')}>
                  Ver Meus Pedidos
                </Button>
                <Button variant="outline" onClick={() => navigate('/montar-cesta')}>
                  Fazer Novo Pedido
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Progress */}
                <div className="flex items-center gap-4 mb-8">
                  <div className={cn(
                    "flex items-center gap-2",
                    step === 'address' ? "text-primary" : "text-muted-foreground"
                  )}>
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                      step === 'address' ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      1
                    </div>
                    <span className="text-sm font-medium">Endereço</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-border" />
                  <div className={cn(
                    "flex items-center gap-2",
                    step === 'preferences' ? "text-primary" : "text-muted-foreground"
                  )}>
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                      step === 'preferences' ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      2
                    </div>
                    <span className="text-sm font-medium">Preferências</span>
                  </div>
                </div>

                {step === 'address' && (
                  <div className="bg-card rounded-2xl border border-border p-6 shadow-card animate-fade-in">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="font-semibold">Endereço de Entrega</h2>
                        <p className="text-sm text-muted-foreground">Onde devemos entregar sua cesta?</p>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="cep">CEP</Label>
                          <Input
                            id="cep"
                            placeholder="00000-000"
                            value={address.cep}
                            onChange={(e) => handleAddressChange('cep', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">Estado</Label>
                          <Input
                            id="state"
                            placeholder="SP"
                            value={address.state}
                            onChange={(e) => handleAddressChange('state', e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="city">Cidade</Label>
                        <Input
                          id="city"
                          placeholder="São Paulo"
                          value={address.city}
                          onChange={(e) => handleAddressChange('city', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="neighborhood">Bairro</Label>
                        <Input
                          id="neighborhood"
                          placeholder="Centro"
                          value={address.neighborhood}
                          onChange={(e) => handleAddressChange('neighborhood', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <Label htmlFor="street">Rua</Label>
                          <Input
                            id="street"
                            placeholder="Rua das Flores"
                            value={address.street}
                            onChange={(e) => handleAddressChange('street', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="number">Número</Label>
                          <Input
                            id="number"
                            placeholder="123"
                            value={address.number}
                            onChange={(e) => handleAddressChange('number', e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="complement">Complemento (opcional)</Label>
                        <Input
                          id="complement"
                          placeholder="Apto 101"
                          value={address.complement}
                          onChange={(e) => handleAddressChange('complement', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step === 'preferences' && (
                  <div className="space-y-6 animate-fade-in">
                    <PreferencesCard
                      value={missingPreference}
                      onChange={setMissingPreference}
                    />

                    <PaymentMethodCard />
                  </div>
                )}

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={(step === 'address' && !isAddressValid) || loading}
                >
                  {loading ? 'Processando...' : (step === 'address' ? 'Continuar' : 'Confirmar Pedido')}
                </Button>
              </div>

              {/* Order Summary */}
              <div className="lg:sticky lg:top-24 h-fit">
                <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                  <h3 className="font-semibold text-lg mb-4">Resumo do Pedido</h3>

                  <div className="max-h-48 overflow-y-auto space-y-3 mb-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.quantity}x</p>
                        </div>
                        <p className="text-sm font-semibold">
                          R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Orçamento</span>
                      <span>R$ {budget.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>R$ {total.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Entrega</span>
                      <span className="text-primary font-medium">Grátis</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
                      <span>Total</span>
                      <span className="text-primary">R$ {total.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-secondary rounded-xl">
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="h-4 w-4 text-primary" />
                      <span>Entrega em até 48 horas</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <MobileNavBar />
      <Footer />
    </div>
  );
};

export default Checkout;
