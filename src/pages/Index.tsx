import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileNavBar } from '@/components/MobileNavBar';
import { BudgetCard } from '@/components/BudgetCard';
import { OnboardingTutorial } from '@/components/OnboardingTutorial';
import { useCart } from '@/contexts/CartContext';
import { useBudgetOptions } from '@/hooks/useBudgetOptions';

const Index = () => {
    const navigate = useNavigate();
    const { budget, setBudget } = useCart();
    const { options: budgetOptions, loading } = useBudgetOptions();

    const handleStartShopping = () => {
        navigate('/montar-cesta');
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <OnboardingTutorial />
            <Header />

            {/* Budget Selection - Centered */}
            <section className="flex-1 flex items-center justify-center py-12 md:py-16">
                <div className="container px-4">
                    <div className="text-center mb-10 md:mb-12">
                        <span className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-primary/20">
                            <ShoppingCart className="h-4 w-4" />
                            Escolha Seu Orçamento
                        </span>
                        <h1 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
                            Qual o valor da sua cesta?
                        </h1>
                        <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
                            Selecione o orçamento que melhor se encaixa nas suas necessidades.
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 max-w-5xl mx-auto">
                            {budgetOptions.map((option) => (
                                <BudgetCard
                                    key={option.id || option.value}
                                    value={option.value}
                                    label={option.label}
                                    description={option.description}
                                    popular={option.popular}
                                    selected={budget === option.value}
                                    onSelect={() => setBudget(option.value)}
                                />
                            ))}
                        </div>
                    )}

                    <div className="text-center mt-10 md:mt-12">
                        <Button
                            size="lg"
                            onClick={handleStartShopping}
                            className="w-full sm:w-auto px-8 h-12 text-base shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                        >
                            Montar Minha Cesta
                            <ArrowRight className="h-5 w-5 ml-2" />
                        </Button>
                    </div>
                </div>
            </section>

            <Footer />
            <MobileNavBar />
        </div>
    );
};

export default Index;
