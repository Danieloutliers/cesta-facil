import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BudgetCard } from '@/components/BudgetCard';
import { OnboardingTutorial } from '@/components/OnboardingTutorial';
import { useCart } from '@/contexts/CartContext';
import { useBudgetOptions } from '@/hooks/useBudgetOptions';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from 'react';

const Index = () => {
    const navigate = useNavigate();
    const { budget, setBudget } = useCart();
    const { options: budgetOptions, loading } = useBudgetOptions();
    const [selectedOption, setSelectedOption] = useState<{ value: number, label: string } | null>(null);

    const handleBudgetSelect = (option: { value: number, label: string }) => {
        setSelectedOption(option);
    };

    const confirmSelection = () => {
        if (selectedOption) {
            setBudget(selectedOption.value);
            navigate('/montar-cesta');
        }
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
                                    onSelect={() => handleBudgetSelect(option)}
                                />
                            ))}
                        </div>
                    )}

                    <AlertDialog open={!!selectedOption} onOpenChange={(open) => !open && setSelectedOption(null)}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Valor?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Você escolheu a cesta de <span className="font-bold text-foreground">{selectedOption?.label}</span>.
                                    Vamos começar a montá-la?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Escolher Outro</AlertDialogCancel>
                                <AlertDialogAction onClick={confirmSelection} className="bg-primary hover:bg-primary/90">
                                    Sim, Montar Cesta ({selectedOption?.label})
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>


                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Index;
