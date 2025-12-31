import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Step {
    title: string;
    description: string;
    image: string;
    bgClass: string;
}

const steps: Step[] = [
    {
        title: "Bem-vindo ao Mercado Fácil",
        description: "A maneira mais simples e econômica de montar sua cesta básica personalizada.",
        image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600",
        bgClass: "bg-emerald-50"
    },
    {
        title: "Defina seu Orçamento",
        description: "Escolha quanto você quer gastar. Nós ajudamos você a se manter dentro do valor.",
        image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600",
        bgClass: "bg-blue-50"
    },
    {
        title: "Monte do Seu Jeito",
        description: "Navegue pelos produtos e adicione apenas o que você realmente precisa.",
        image: "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&q=80&w=600",
        bgClass: "bg-purple-50"
    },
    {
        title: "Receba em Casa",
        description: "Agendamos a entrega e você só paga quando receber seus produtos.",
        image: "/images/entrega-mercado-facil.jpg",
        bgClass: "bg-orange-50"
    },
    {
        title: "Pagamento na Entrega",
        description: "Total segurança: pague com dinheiro, PIX ou cartão somente ao receber sua cesta.",
        image: "https://images.unsplash.com/photo-1556742111-a301076d9d18?auto=format&fit=crop&q=80&w=600",
        bgClass: "bg-green-50"
    }
];

export function OnboardingTutorial() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        // Check if tutorial has been seen
        const hasSeenTutorial = localStorage.getItem('has_seen_tutorial_v10');
        if (!hasSeenTutorial) {
            setIsOpen(true);
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem('has_seen_tutorial_v10', 'true');
        document.body.style.overflow = 'unset';
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleClose();
        }
    };

    if (!isOpen) return null;

    const currentImage = steps[currentStep].image;

    return (
        <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-0 md:p-6 overflow-hidden">
            {/* Background Subtle Pattern */}
            <div className="absolute inset-0 bg-secondary/30 pointer-events-none" />

            <div className="w-full max-w-lg mx-auto flex flex-col h-full bg-card md:rounded-3xl md:h-auto md:min-h-[600px] md:shadow-2xl relative overflow-hidden text-foreground">

                {/* Skip Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-10 p-2 text-muted-foreground/80 hover:text-foreground bg-background/50 backdrop-blur-sm rounded-full transition-all"
                >
                    <span className="sr-only">Pular tutorial</span>
                    <span className="text-xs font-semibold px-2">Pular</span>
                </button>

                {/* Image Area */}
                <div className="flex-1 relative max-h-[50%] md:max-h-[300px] overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={currentStep}
                            src={currentImage}
                            alt={steps[currentStep].title}
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="w-full h-full object-cover"
                        />
                    </AnimatePresence>
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/10 pointer-events-none" />
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col items-center justify-between p-8 text-center relative z-10">

                    <div className="space-y-6 pt-4">
                        {/* Progress Circles */}
                        <div className="flex justify-center gap-3 mb-6">
                            {steps.map((_, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "h-2 rounded-full transition-all duration-500",
                                        index === currentStep ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"
                                    )}
                                />
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -10, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                                    {steps[currentStep].title}
                                </h2>
                                <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xs mx-auto">
                                    {steps[currentStep].description}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Action Button */}
                    <div className="w-full mt-8">
                        <Button
                            size="lg"
                            className="w-full text-base h-14 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                            onClick={handleNext}
                        >
                            {currentStep === steps.length - 1 ? (
                                <span className="flex items-center gap-2 font-bold">
                                    Começar Agora <Check className="w-5 h-5" />
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 font-semibold">
                                    Continuar <ArrowRight className="w-5 h-5" />
                                </span>
                            )}
                        </Button>
                    </div>

                </div>

            </div>
        </div>
    );
}
