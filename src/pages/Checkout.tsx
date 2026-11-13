import { useState, useEffect, useMemo, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Truck, Check, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PreferencesCard } from '@/components/PreferencesCard';
import { PaymentMethodCard } from '@/components/PaymentMethodCard';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext'; // Added
import { useToast } from '@/hooks/use-toast';
import { Address, PaymentMethod } from '@/types';
import { supabase } from '@/lib/supabase';
import { calculateInstallmentTotal } from '@/lib/financial';
import { cn } from '@/lib/utils';
import { completeReferralOnOrder } from '@/services/referralService';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, total, addOrder, updateOrder, itemCount, orders, editingOrderId } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState<'address' | 'preferences' | 'success'>('address');
  const [missingPreference, setMissingPreference] = useState<'substituir' | 'remover'>('substituir');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>(undefined);
  const [installments, setInstallments] = useState(1);
  const [rates, setRates] = useState({ rate1to2: 0, rate3to5: 0 });
  const [loading, setLoading] = useState(false);
  const [wasEditing, setWasEditing] = useState(false);
  const [showSummaryInPayment, setShowSummaryInPayment] = useState(false);
  const { toast } = useToast();
  const prefillDoneRef = useRef(false);
  const submitLockRef = useRef(false);
  const [address, setAddress] = useState<Address>({
    cep: '46430-000', // CEP Geral de Guanambi
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: 'Guanambi',
    state: 'BA',
  });

  useEffect(() => {
    let cancelled = false;

    const loadSettings = async () => {
      const { data, error } = await supabase.from('settings').select('*');
      if (error || !data || cancelled) return;

      const settingsObj: Record<string, unknown> = {};
      data.forEach((item) => {
        settingsObj[item.key] = item.value;
      });

      const rate1to2 = Number(settingsObj.installmentRate1to2);
      const rate3to5 = Number(settingsObj.installmentRate3to5);

      setRates({
        rate1to2: Number.isFinite(rate1to2) ? rate1to2 : 0,
        rate3to5: Number.isFinite(rate3to5) ? rate3to5 : 0,
      });
    };

    void loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  // Prefill the address only once, so background order refreshes never
  // overwrite what the customer is currently typing.
  useEffect(() => {
    if (prefillDoneRef.current || !user) return;

    const hasProfileAddress = Boolean(user.address && (user.address.street || user.address.neighborhood));
    const lastOrderAddress = orders[0]?.address;

    if (hasProfileAddress && user.address) {
      prefillDoneRef.current = true;
      setAddress((prev) => ({
        ...prev,
        ...user.address,
        city: 'Guanambi',
        state: 'BA',
        cep: '46430-000',
      }));
      toast({
        title: "Endereço do Perfil",
        description: "Carregamos o endereço salvo no seu perfil.",
        duration: 3000,
      });
    } else if (lastOrderAddress && (lastOrderAddress.street || lastOrderAddress.neighborhood)) {
      prefillDoneRef.current = true;
      setAddress((prev) => ({
        ...prev,
        ...lastOrderAddress,
        city: 'Guanambi',
        state: 'BA',
        cep: '46430-000',
      }));
      toast({
        title: "Endereço Anterior",
        description: "Carregamos o endereço do seu último pedido.",
        duration: 3000,
      });
    }
  }, [user, orders, toast]);

  // Only "carnê" can be split; reset installments when another method is chosen.
  useEffect(() => {
    if (paymentMethod && paymentMethod !== 'carne' && paymentMethod !== 'carnet') {
      setInstallments(1);
    }
  }, [paymentMethod]);

  const handleAddressChange = (field: keyof Address, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const knownCategories = ['alimentos', 'bebidas', 'limpeza', 'higiene'];
  const otherItems = items.filter((item) => !knownCategories.includes(item.category));

  const isAddressValid = Boolean(
    address.street.trim() && address.number.trim() && address.neighborhood.trim()
  );

  const handleSubmit = async () => {
    if (submitLockRef.current) return;

    if (step === 'address') {
      if (!isAddressValid) {
        toast({
          title: 'Endereço incompleto',
          description: 'Preencha bairro, rua e número para continuar.',
          variant: 'destructive',
        });
        return;
      }
      setStep('preferences');
    } else if (step === 'preferences') {
      if (!paymentMethod) {
        toast({
          title: "Selecione uma forma de pagamento ⚠️",
          description: "É necessário escolher como deseja pagar para finalizar o pedido.",
          variant: "destructive",
          className: "bg-red-500 border-red-600 text-white font-medium"
        });
        return;
      }

      submitLockRef.current = true;
      try {
        setLoading(true);

        const cleanAddress: Address = {
          ...address,
          street: address.street.trim(),
          number: address.number.trim(),
          neighborhood: address.neighborhood.trim(),
          complement: address.complement?.trim() || '',
        };

        let finalTotal: number | undefined;
        if (paymentMethod === 'carne') {
          const { totalWithInterest } = calculateInstallmentTotal(total, installments, rates);
          // Only send a custom total when interest actually changes the amount.
          if (Math.abs(totalWithInterest - total) > 0.001) {
            finalTotal = Math.round(totalWithInterest * 100) / 100;
          }
        }

        if (editingOrderId) {
          setWasEditing(true);
          await updateOrder(cleanAddress, missingPreference, paymentMethod, installments, finalTotal);
        } else {
          const createdOrder = await addOrder(cleanAddress, missingPreference, paymentMethod, installments, finalTotal);
          if (createdOrder && user) {
            try {
              await completeReferralOnOrder(
                { id: user.id, name: user.name, phone: user.phone },
                {
                  id: createdOrder.id,
                  order_number: createdOrder.id,
                  total: Number(finalTotal ?? total),
                  payment_method: paymentMethod,
                  installments: installments
                }
              );
            } catch (refErr) {
              console.warn('Error completing referral on checkout:', refErr);
            }
          }
        }
        setStep('success');
      } catch (error) {
        toast({
          title: editingOrderId ? 'Erro ao atualizar pedido' : 'Erro ao criar pedido',
          description: error instanceof Error ? error.message : 'Tente novamente mais tarde.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
        submitLockRef.current = false;
      }
    }
  };

  if (itemCount === 0 && step !== 'success') {
    return <Navigate to="/montar-cesta" replace />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-background to-background dark:from-slate-950 dark:via-background dark:to-background">
      <Header />

      <main className="container py-8 pb-24 md:pb-12">
        {step !== 'success' && (
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 hover:bg-primary/5 hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para a loja
          </Button>
        )}

        <div className="max-w-6xl mx-auto">
          {step === 'success' ? (
            <div className="text-center py-20 animate-fade-in">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-green-500/10 mx-auto mb-8 ring-8 ring-green-500/5">
                <div className="absolute inset-0 rounded-full animate-ping bg-green-500/20 duration-1000" />
                <Check className="h-10 w-10 text-green-600 dark:text-green-400 relative z-10" />
              </div>
              <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
                {wasEditing ? 'Pedido Atualizado!' : 'Pedido Confirmado!'}
              </h1>
              <p className="text-muted-foreground mb-10 max-w-md mx-auto text-lg leading-relaxed">
                {wasEditing
                  ? 'Seu pedido foi atualizado com sucesso.'
                  : 'Seu pedido foi recebido com sucesso. Em breve entraremos em contato para confirmar a entrega.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => navigate('/')} className="w-full sm:w-auto bg-primary hover:bg-primary/90 h-12 px-8 text-lg font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                  Voltar ao Início
                </Button>
                <Button variant="outline" onClick={() => navigate('/historico')} className="w-full sm:w-auto h-12 px-8 text-lg font-medium border-primary/20 hover:bg-primary/5 hover:text-primary transition-all">
                  Ver Meus Pedidos
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-12">
              {/* Left Column - Steps & Forms */}
              <div className={cn(
                "space-y-8 transition-all duration-500",
                step === 'address' || (step === 'preferences' && showSummaryInPayment) ? "lg:col-span-7" : "lg:col-span-12 max-w-2xl mx-auto w-full"
              )}>

                {/* Modern Progress Steps */}
                <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-4 mb-8 flex items-center justify-center gap-4 shadow-sm">
                  <div className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-300",
                    step === 'address' ? "bg-primary/10 text-primary ring-1 ring-primary/20" : "text-muted-foreground opacity-50"
                  )}>
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold shadow-sm transition-all",
                      step === 'address' ? "bg-primary text-primary-foreground scale-110" : "bg-muted"
                    )}>1</div>
                    <span className="text-sm font-bold tracking-tight">Endereço</span>
                  </div>

                  <div className="w-12 h-1 rounded-full bg-border/50" />

                  <div className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-300",
                    step === 'preferences' ? "bg-primary/10 text-primary ring-1 ring-primary/20" : "text-muted-foreground opacity-50"
                  )}>
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold shadow-sm transition-all",
                      step === 'preferences' ? "bg-primary text-primary-foreground scale-110" : "bg-muted"
                    )}>2</div>
                    <span className="text-sm font-bold tracking-tight">Pagamento</span>
                  </div>
                </div>

                {step === 'address' && (
                  <div className="bg-card/80 backdrop-blur-xl rounded-3xl border border-border/50 p-6 md:p-8 shadow-xl shadow-black/5 animate-in slide-in-from-left-4 duration-500">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 shadow-inner">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight">Onde entregar?</h2>
                        <p className="text-sm text-muted-foreground font-medium">Informe os dados para receber sua cesta.</p>
                      </div>
                    </div>

                    {/* Location Alert - Premium Style */}
                    <div className="relative overflow-hidden bg-amber-500/5 border border-amber-500/10 rounded-2xl p-5 mb-8 group hover:border-amber-500/30 transition-colors">
                      <div className="absolute -right-4 -top-4 bg-amber-500/10 w-24 h-24 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
                      <div className="flex items-start gap-4 relative z-10">
                        <div className="p-2.5 bg-amber-500/10 rounded-xl">
                          <MapPin className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                        </div>
                        <div>
                          <h3 className="font-bold text-amber-700 dark:text-amber-500 text-base mb-1">
                            Entrega Exclusiva
                          </h3>
                          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                            Este serviço está disponível apenas para <span className="text-foreground bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/10">Guanambi-BA</span>.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-5">
                      <div className="grid gap-2">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider ml-1">Bairro</Label>
                        <Input
                          placeholder="Ex: Centro, São Sebastião, Ipiranga..."
                          value={address.neighborhood}
                          onChange={(e) => handleAddressChange('neighborhood', e.target.value)}
                          className="h-12 rounded-xl bg-background/50 border-input/50 focus:bg-background transition-all hover:border-primary/50 focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      <div className="grid grid-cols-4 gap-5">
                        <div className="col-span-3 grid gap-2">
                          <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider ml-1">Rua</Label>
                          <Input
                            placeholder="Nome da sua rua"
                            value={address.street}
                            onChange={(e) => handleAddressChange('street', e.target.value)}
                            className="h-12 rounded-xl bg-background/50 border-input/50 focus:bg-background transition-all hover:border-primary/50 focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider ml-1">Número</Label>
                          <Input
                            placeholder="123"
                            value={address.number}
                            onChange={(e) => handleAddressChange('number', e.target.value)}
                            className="h-12 rounded-xl bg-background/50 border-input/50 focus:bg-background transition-all hover:border-primary/50 focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider ml-1">Complemento</Label>
                        <Input
                          placeholder="Ex: Próximo à praça, Casa azul..."
                          value={address.complement}
                          onChange={(e) => handleAddressChange('complement', e.target.value)}
                          className="h-12 rounded-xl bg-background/50 border-input/50 focus:bg-background transition-all hover:border-primary/50 focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step === 'preferences' && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    <PreferencesCard
                      value={missingPreference}
                      onChange={setMissingPreference}
                    />

                    <PaymentMethodCard
                      selected={paymentMethod}
                      onSelect={setPaymentMethod}
                      installments={installments}
                      onInstallmentsChange={setInstallments}
                      total={total}
                      rates={rates}
                    />
                  </div>
                )}

                <Button
                  size="lg"
                  className="w-full h-14 text-base font-bold rounded-2xl shadow-xl shadow-primary/25 hover:scale-[1.02] hover:shadow-primary/40 active:scale-[0.98] transition-all bg-gradient-to-r from-primary to-primary/90"
                  onClick={handleSubmit}
                  disabled={(step === 'address' && !isAddressValid) || loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processando...</span>
                    </div>
                  ) : (step === 'address' ? (
                    <span className="flex items-center gap-2">Continuar para Pedido <ArrowRight className="w-5 h-5" /></span>
                  ) : (editingOrderId ? 'Atualizar Pedido' : 'Confirmar Pedido'))}
                </Button>

                {step === 'preferences' && (
                  <Button
                    variant="ghost"
                    onClick={() => setShowSummaryInPayment(!showSummaryInPayment)}
                    className="w-full justify-between h-10 text-muted-foreground hover:text-primary hover:bg-transparent"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      {showSummaryInPayment ? 'Ocultar detalhes do pedido' : 'Ver detalhes do pedido'}
                    </span>
                    {showSummaryInPayment ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                )}
              </div>

              {/* Order Summary - New Design */}
              {(step === 'address' || (step === 'preferences' && showSummaryInPayment)) && (
                <div className="lg:col-span-5 space-y-6">
                  <div className="lg:sticky lg:top-24 h-fit animate-in fade-in duration-700 delay-100">
                    <div className="bg-card/60 backdrop-blur-xl rounded-2xl border border-border/50 p-6 shadow-2xl shadow-black/5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                      <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-lg">
                          <Truck className="h-4 w-4 text-primary" />
                        </div>
                        Resumo do Pedido
                      </h3>

                      <div className="space-y-6 mb-6">
                        {/* Alimentos Section */}
                        {items.some(i => ['alimentos', 'bebidas'].includes(i.category)) && (
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2 mb-2">
                              <div className="h-px flex-1 bg-border/60" />
                              Alimentos & Bebidas
                              <div className="h-px flex-1 bg-border/60" />
                            </h4>
                            {items.filter(i => ['alimentos', 'bebidas'].includes(i.category)).map((item) => (
                              <div key={item.id} className="flex items-center gap-3 group">
                                <div className="relative">
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="h-12 w-12 rounded-xl object-cover ring-1 ring-border shadow-sm group-hover:scale-105 transition-transform"
                                  />
                                  <div className="absolute -top-2 -left-2 bg-background border shadow-xs text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full z-10">
                                    {item.quantity}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{item.name}</p>
                                  <p className="text-xs text-muted-foreground">Unit: R$ {item.price.toFixed(2).replace('.', ',')}</p>
                                </div>
                                <p className="text-sm font-semibold">
                                  R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Limpeza Section */}
                        {items.some(i => ['limpeza', 'higiene'].includes(i.category)) && (
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2 mb-2 pt-2">
                              <div className="h-px flex-1 bg-border/60" />
                              Limpeza & Higiene
                              <div className="h-px flex-1 bg-border/60" />
                            </h4>
                            {items.filter(i => ['limpeza', 'higiene'].includes(i.category)).map((item) => (
                              <div key={item.id} className="flex items-center gap-3 group">
                                <div className="relative">
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="h-12 w-12 rounded-xl object-cover ring-1 ring-border shadow-sm group-hover:scale-105 transition-transform"
                                  />
                                  <div className="absolute -top-2 -left-2 bg-background border shadow-xs text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full z-10">
                                    {item.quantity}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{item.name}</p>
                                  <p className="text-xs text-muted-foreground">Unit: R$ {item.price.toFixed(2).replace('.', ',')}</p>
                                </div>
                                <p className="text-sm font-semibold">
                                  R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Outros: categorias personalizadas criadas no painel admin */}
                        {otherItems.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2 mb-2 pt-2">
                              <div className="h-px flex-1 bg-border/60" />
                              Outros
                              <div className="h-px flex-1 bg-border/60" />
                            </h4>
                            {otherItems.map((item) => (
                              <div key={item.id} className="flex items-center gap-3 group">
                                <div className="relative">
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="h-12 w-12 rounded-xl object-cover ring-1 ring-border shadow-sm group-hover:scale-105 transition-transform"
                                  />
                                  <div className="absolute -top-2 -left-2 bg-background border shadow-xs text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full z-10">
                                    {item.quantity}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{item.name}</p>
                                  <p className="text-xs text-muted-foreground">Unit: R$ {item.price.toFixed(2).replace('.', ',')}</p>
                                </div>
                                <p className="text-sm font-semibold">
                                  R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="border-t border-dashed border-border/60 pt-6 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-medium">R$ {total.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Entrega</span>
                          <span className="text-green-600 font-bold bg-green-500/10 px-2 py-0.5 rounded text-xs uppercase tracking-wide">Grátis</span>
                        </div>

                        <div className="my-2 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                        <div className="flex justify-between items-end pt-1">
                          <span className="font-bold text-lg">Total</span>
                          <div className="text-right">
                            <span className="block text-2xl font-black text-primary tracking-tight">
                              R$ {total.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-xs text-muted-foreground">parcelamento no pagamento</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Security Badge */}
                    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground opacity-60">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Compra 100% Segura e Criptografada
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
