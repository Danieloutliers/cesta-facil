import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Truck, CreditCard, Shield, Sparkles, ArrowRight, Check, Users, Clock, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BudgetCard } from '@/components/BudgetCard';
import { useCart } from '@/contexts/CartContext';
import { budgetOptions } from '@/data/products';

const Index = () => {
  const navigate = useNavigate();
  const { budget, setBudget } = useCart();

  const handleStartShopping = () => {
    navigate('/montar-cesta');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=1920&q=80')] bg-cover bg-center opacity-20" />

        {/* Animated Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />

        <div className="relative container py-12 md:py-32 px-4">
          <div className="max-w-3xl mx-auto text-center text-primary-foreground">
            {/* Enhanced Badge with Pulse */}
            <div className="inline-flex items-center gap-1.5 bg-primary-foreground/10 backdrop-blur-sm rounded-full px-3 py-1.5 mb-4 md:mb-6 animate-fade-in border border-primary-foreground/20 shadow-lg hover:scale-105 transition-transform duration-300">
              <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4 animate-pulse" />
              <span className="text-xs md:text-sm font-medium">Compre inteligente, economize sempre</span>
            </div>

            {/* Title with Gradient */}
            <h1 className="text-3xl md:text-6xl font-bold mb-4 md:mb-6 animate-fade-in leading-tight" style={{ animationDelay: '0.1s' }}>
              Monte Sua Cesta Básica
              <span className="block bg-gradient-to-r from-primary-foreground via-white to-primary-foreground bg-clip-text text-transparent animate-pulse" style={{ animationDuration: '3s' }}>
                do Seu Jeito
              </span>
            </h1>

            <p className="text-base md:text-xl text-primary-foreground/80 mb-6 md:mb-8 max-w-2xl mx-auto animate-fade-in px-2" style={{ animationDelay: '0.2s' }}>
              Escolha seu orçamento, selecione os produtos que você precisa e receba tudo em casa.
              Simples, prático e econômico.
            </p>

            {/* Enhanced Buttons with Glow */}
            <div className="flex justify-center animate-fade-in px-4" style={{ animationDelay: '0.3s' }}>
              <Button
                size="lg"
                variant="secondary"
                onClick={handleStartShopping}
                className="text-primary w-full sm:w-auto shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                Começar a Montar
                <ArrowRight className="h-5 w-5" />
              </Button>

            </div>

            {/* Enhanced Feature Badges */}
            <div className="flex flex-wrap justify-center gap-2 md:gap-4 mt-8 md:mt-12 animate-fade-in px-2" style={{ animationDelay: '0.4s' }}>
              {[
                { icon: Truck, label: 'Entrega Rápida', delay: '0.5s' },
                { icon: CreditCard, label: 'Pague na Entrega', delay: '0.6s' },
                { icon: Shield, label: 'Compra Segura', delay: '0.7s' },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1.5 md:gap-2 bg-primary-foreground/10 backdrop-blur-sm rounded-full px-3 py-1.5 md:px-4 md:py-2 border border-primary-foreground/20 hover:bg-primary-foreground/20 hover:scale-110 transition-all duration-300 cursor-pointer shadow-lg animate-fade-in"
                  style={{ animationDelay: feature.delay }}
                >
                  <feature.icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span className="text-xs md:text-sm font-medium">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z"
              fill="hsl(var(--background))"
            />
          </svg>
        </div>
      </section>

      {/* Budget Selection */}
      <section className="py-12 md:py-24">
        <div className="container px-4">
          <div className="text-center mb-8 md:mb-12">
            <span className="inline-flex items-center gap-1.5 md:gap-2 bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs md:text-sm font-medium mb-3 md:mb-4">
              <ShoppingCart className="h-3.5 w-3.5 md:h-4 md:w-4" />
              Escolha Seu Orçamento
            </span>
            <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4 px-2">
              Escolha o Valor da Sua Cesta
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-4">
              Selecione o orçamento que melhor se encaixa nas suas necessidades.
              Você monta sua cesta dentro do valor escolhido.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 max-w-5xl mx-auto">
            {budgetOptions.map((option) => (
              <BudgetCard
                key={option.value}
                value={option.value}
                label={option.label}
                description={option.description}
                popular={option.popular}
                selected={budget === option.value}
                onSelect={() => setBudget(option.value)}
              />
            ))}
          </div>

          <div className="text-center mt-8 md:mt-10 px-4">
            <Button size="lg" onClick={handleStartShopping} className="w-full sm:w-auto">
              Montar Minha Cesta
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-24 bg-muted/50">
        <div className="container px-4">
          <div className="text-center mb-8 md:mb-12">
            <span className="inline-flex items-center gap-1.5 md:gap-2 bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs md:text-sm font-medium mb-3 md:mb-4">
              ✨ Simples e Fácil
            </span>
            <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4 px-2">
              Como Funciona?
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-4">
              Em poucos passos você monta sua cesta personalizada e recebe em casa.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
            {[
              { step: '1', icon: CreditCard, title: 'Escolha o Valor', desc: 'Defina o orçamento da sua cesta básica' },
              { step: '2', icon: ShoppingCart, title: 'Monte sua Cesta', desc: 'Escolha os produtos que você precisa' },
              { step: '3', icon: Truck, title: 'Receba em Casa', desc: 'Entregamos no endereço que preferir' },
              { step: '4', icon: CreditCard, title: 'Pague na Entrega', desc: 'Pagamento flexível e seguro' },
            ].map((item, index) => (
              <div
                key={index}
                className="relative bg-card rounded-xl md:rounded-2xl p-5 md:p-6 shadow-card hover:shadow-card-hover transition-all duration-300 text-center"
              >
                <div className="absolute -top-2.5 md:-top-3 left-1/2 -translate-x-1/2 flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs md:text-sm">
                  {item.step}
                </div>
                <div className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-xl md:rounded-2xl bg-secondary mx-auto mb-3 md:mb-4 mt-2">
                  <item.icon className="h-6 w-6 md:h-7 md:w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-base md:text-lg mb-1.5 md:mb-2">{item.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8 md:mt-10 px-4">
            <Button size="lg" onClick={handleStartShopping} className="w-full sm:w-auto">
              Começar Agora
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 md:py-24">
        <div className="container px-4">
          <div className="text-center mb-8 md:mb-12">
            <span className="inline-flex items-center gap-1.5 md:gap-2 bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs md:text-sm font-medium mb-3 md:mb-4">
              🏆 Nossas Vantagens
            </span>
            <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4 px-2">
              Por Que Escolher o Mercado Fácil?
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-4">
              Oferecemos a melhor experiência na compra da sua cesta básica personalizada.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
            {[
              { icon: Leaf, title: 'Produtos Frescos', desc: 'Garantimos a qualidade e frescor dos produtos entregues' },
              { icon: Clock, title: 'Entrega Rápida', desc: 'Receba sua cesta em até 48 horas após o pedido' },
              { icon: Users, title: 'Suporte Dedicado', desc: 'Atendimento humanizado para resolver suas dúvidas' },
              { icon: Shield, title: 'Compra Segura', desc: 'Seus dados estão protegidos conosco' },
              { icon: CreditCard, title: 'Pague na Entrega', desc: 'PIX, cartão ou dinheiro na hora da entrega' },
              { icon: Check, title: 'Satisfação Garantida', desc: 'Não gostou? Devolvemos seu dinheiro' },
            ].map((item, index) => (
              <div
                key={index}
                className="flex gap-3 md:gap-4 p-3.5 md:p-4 rounded-lg md:rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-lg md:rounded-xl bg-secondary">
                  <item.icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm md:text-base mb-0.5 md:mb-1">{item.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 md:py-24 bg-primary">
        <div className="container text-center px-4">
          <h2 className="text-2xl md:text-4xl font-bold text-primary-foreground mb-3 md:mb-4 px-2">
            Pronto para Economizar?
          </h2>
          <p className="text-sm md:text-base text-primary-foreground/80 mb-6 md:mb-8 max-w-xl mx-auto px-4">
            Monte sua cesta básica personalizada agora mesmo e receba em casa com o melhor preço.
          </p>
          <Button size="lg" variant="secondary" onClick={handleStartShopping} className="text-primary w-full sm:w-auto">
            Começar Agora
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
