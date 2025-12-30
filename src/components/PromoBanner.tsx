import { useEffect, useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Percent, ShoppingBag, CreditCard, Truck, Beef, Apple } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface Slide {
    id: number;
    title: string;
    description: string;
    icon: React.ReactNode;
    gradient: string;
    image?: string;
    buttonText?: string;
}

const slides: Slide[] = [
    {
        id: 1,
        title: "Ofertas da Semana",
        description: "Descontos imperdíveis em produtos selecionados para sua despensa.",
        icon: <Percent className="h-6 w-6 text-white" />,
        gradient: "from-violet-600 to-indigo-600",
        image: "/banner_promo_geral.jpg",
        buttonText: "Ver Ofertas"
    },
    {
        id: 2,
        title: "Festival de Carnes",
        description: "Cortes selecionados para seu churrasco com preços especiais.",
        icon: <Beef className="h-6 w-6 text-white" />,
        gradient: "from-red-600 to-rose-600",
        image: "/banner_carnes.jpg",
        buttonText: "Confira"
    },
    {
        id: 3,
        title: "Hortifruti Fresquinho",
        description: "Frutas, legumes e verduras direto do produtor para sua mesa.",
        icon: <Apple className="h-6 w-6 text-white" />,
        gradient: "from-green-600 to-emerald-600",
        image: "/banner_hortifruti.jpg",
        buttonText: "Aproveite"
    },
    {
        id: 4,
        title: "Compre e Pague Parcelado",
        description: "Facilidade total! Parcele suas compras sem juros no cartão.",
        icon: <CreditCard className="h-6 w-6 text-white" />,
        gradient: "from-blue-600 to-cyan-600",
        image: "/banner_pagamento.jpg",
        buttonText: "Saiba Mais"
    },
    {
        id: 5,
        title: "Entrega Rápida",
        description: "Receba suas compras no conforto de casa em tempo recorde.",
        icon: <Truck className="h-6 w-6 text-white" />,
        gradient: "from-orange-500 to-amber-500",
        image: "/banner_entrega.jpg",
        buttonText: "Pedir Agora"
    }
];

export function PromoBanner() {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
    const [selectedIndex, setSelectedIndex] = useState(0);

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        emblaApi.on('select', onSelect);

        // Autoplay logic
        const intervalId = setInterval(() => {
            if (emblaApi.canScrollNext()) {
                emblaApi.scrollNext();
            } else {
                emblaApi.scrollTo(0);
            }
        }, 5000); // 5 seconds per slide

        return () => clearInterval(intervalId);
    }, [emblaApi, onSelect]);

    return (
        <div className="relative overflow-hidden rounded-2xl shadow-lg group">
            <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex">
                    {slides.map((slide) => (
                        <div key={slide.id} className="relative flex-[0_0_100%] min-w-0">
                            <div className="relative h-48 md:h-56 w-full flex items-center overflow-hidden rounded-2xl">
                                {/* Background Image */}
                                {slide.image && (
                                    <div className="absolute inset-0 z-0">
                                        <img
                                            src={slide.image}
                                            alt={slide.title}
                                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        {/* Gradient Overlay for Text Readability */}
                                        <div className={cn(
                                            "absolute inset-0 bg-gradient-to-r mix-blend-multiply opacity-90",
                                            slide.gradient
                                        )} />
                                        <div className="absolute inset-0 bg-black/20" />
                                    </div>
                                )}

                                {/* Content */}
                                <div className="relative z-10 w-full p-6 md:p-8 flex items-center justify-between gap-6">
                                    <div className="space-y-3 flex-1 animate-in fade-in slide-in-from-left-4 duration-500">
                                        <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-md border border-white/10 w-fit">
                                            {slide.icon}
                                            <span className="uppercase tracking-wide">Destaque</span>
                                        </div>

                                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight drop-shadow-sm line-clamp-2">
                                            {slide.title}
                                        </h2>

                                        <p className="text-sm md:text-base text-white/90 max-w-md font-medium leading-relaxed line-clamp-2 drop-shadow-md">
                                            {slide.description}
                                        </p>

                                        <Button
                                            onClick={scrollNext}
                                            variant="secondary"
                                            size="sm"
                                            className="mt-2 bg-white/90 hover:bg-white text-slate-900 border-0 font-semibold shadow-md rounded-xl active:scale-95 transition-transform"
                                        >
                                            {slide.buttonText}
                                        </Button>
                                    </div>

                                    {/* Right Side Icon Placeholder area - Only visible if image fails or decorative */}
                                    {/* Hidden on mobile, simplistic on desktop to not clutter the image */}
                                    <div className="hidden md:flex flex-col items-center justify-center p-4">
                                        <div className="h-20 w-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl rotate-6 group-hover:rotate-12 transition-transform duration-700">
                                            {slide.icon && <div className="scale-[2] drop-shadow-lg">{slide.icon}</div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Dots Navigation */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        className={cn(
                            "h-1.5 rounded-full transition-all duration-300 shadow-sm backdrop-blur-sm",
                            index === selectedIndex ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
                        )}
                        onClick={() => emblaApi?.scrollTo(index)}
                        aria-label={`Ir para slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
