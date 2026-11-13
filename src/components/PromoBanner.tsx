import { useEffect, useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Percent, ShoppingBag, CreditCard, Truck, Beef, Apple, Gift, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useBanners } from '@/hooks/useBanners';
import { Banner } from '@/types';
import { useNavigate } from 'react-router-dom';

// Icon mapping from string to component
const iconMap: Record<string, React.ReactNode> = {
    'Percent': <Percent className="h-6 w-6 text-white" />,
    'Beef': <Beef className="h-6 w-6 text-white" />,
    'Apple': <Apple className="h-6 w-6 text-white" />,
    'CreditCard': <CreditCard className="h-6 w-6 text-white" />,
    'Truck': <Truck className="h-6 w-6 text-white" />,
    'ShoppingBag': <ShoppingBag className="h-6 w-6 text-white" />,
    'Gift': <Gift className="h-6 w-6 text-white" />,
    'Star': <Star className="h-6 w-6 text-white" />,
};

// Fallback banners if database is empty
const fallbackBanners: Banner[] = [
    {
        id: '1',
        title: "Ofertas da Semana",
        description: "Descontos imperdíveis em produtos selecionados para sua despensa.",
        icon: 'Percent',
        gradient: "from-violet-600 to-indigo-600",
        image_url: "/banner_promo_geral.jpg",
        button_text: "Ver Ofertas",
        link: "/montar-cesta",
        display_order: 1,
        active: true
    },
    {
        id: '2',
        title: "Festival de Carnes",
        description: "Cortes selecionados para seu churrasco com preços especiais.",
        icon: 'Beef',
        gradient: "from-red-600 to-rose-600",
        image_url: "/banner_carnes.jpg",
        button_text: "Confira",
        link: "/montar-cesta?category=carnes",
        display_order: 2,
        active: true
    },
    {
        id: '3',
        title: "Hortifruti Fresquinho",
        description: "Frutas, legumes e verduras direto do produtor para sua mesa.",
        icon: 'Apple',
        gradient: "from-green-600 to-emerald-600",
        image_url: "/banner_hortifruti.jpg",
        button_text: "Aproveite",
        link: "/montar-cesta?category=hortifruti",
        display_order: 3,
        active: true
    },
    {
        id: '4',
        title: "Compre e Pague Parcelado",
        description: "Facilidade total! Parcele suas compras sem juros no cartão.",
        icon: 'CreditCard',
        gradient: "from-blue-600 to-cyan-600",
        image_url: "/banner_pagamento.jpg",
        button_text: "Saiba Mais",
        link: "/montar-cesta",
        display_order: 4,
        active: true
    },
    {
        id: '5',
        title: "Entrega Rápida",
        description: "Receba suas compras no conforto de casa em tempo recorde.",
        icon: 'Truck',
        gradient: "from-orange-500 to-amber-500",
        image_url: "/banner_entrega.jpg",
        button_text: "Pedir Agora",
        link: "/montar-cesta",
        display_order: 5,
        active: true
    }
];

export function PromoBanner() {
    const { banners: dbBanners, loading } = useBanners();
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
    const [selectedIndex, setSelectedIndex] = useState(0);
    const navigate = useNavigate();

    // Use database banners if available, otherwise use fallback
    const slides = dbBanners.length > 0 ? dbBanners : fallbackBanners;

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

    const handleBannerClick = (link?: string) => {
        if (!link) return;

        if (link.startsWith('http')) {
            window.open(link, '_blank');
        } else {
            navigate(link);
        }
    };

    if (loading) {
        return (
            <div className="relative overflow-hidden rounded-2xl shadow-lg h-48 md:h-56 bg-muted animate-pulse" />
        );
    }

    return (
        <div className="relative overflow-hidden rounded-2xl shadow-lg group">
            <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex">
                    {slides.map((slide, index) => (
                        <div key={slide.id} className="relative flex-[0_0_100%] min-w-0">
                            <div className="relative h-48 md:h-56 w-full flex items-center overflow-hidden rounded-2xl">
                                {/* Background Image */}
                                {slide.image_url && (
                                    <div className="absolute inset-0 z-0">
                                        <img
                                            src={slide.image_url}
                                            alt={slide.title}
                                            loading={index === 0 ? "eager" : "lazy"}
                                            decoding="async"
                                            fetchPriority={index === 0 ? "high" : "auto"}
                                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        {/* Gradient Overlay for Text Readability */}
                                        {slide.gradient && slide.gradient !== 'none' && (
                                            <div className={cn(
                                                "absolute inset-0 bg-gradient-to-r mix-blend-multiply opacity-90",
                                                slide.gradient
                                            )} />
                                        )}
                                        <div
                                            className={cn(
                                                "absolute inset-0",
                                                !slide.gradient && !slide.use_blur && "bg-black/20"
                                            )}
                                            style={{
                                                backdropFilter: slide.use_blur ? `blur(${slide.blur_amount || 4}px)` : undefined
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Content */}
                                <div className="relative z-10 w-full p-6 md:p-8 flex items-center justify-between gap-6">
                                    <div className="space-y-3 flex-1 animate-in fade-in slide-in-from-left-4 duration-500">
                                        <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-md border border-white/10 w-fit">
                                            {iconMap[slide.icon] || iconMap['ShoppingBag']}
                                            <span className="uppercase tracking-wide">Destaque</span>
                                        </div>

                                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight drop-shadow-sm line-clamp-2">
                                            {slide.title}
                                        </h2>

                                        <p className="text-sm md:text-base text-white/90 max-w-md font-medium leading-relaxed line-clamp-2 drop-shadow-md">
                                            {slide.description}
                                        </p>

                                        {slide.button_text && (
                                            <Button
                                                onClick={() => handleBannerClick(slide.link)}
                                                variant="secondary"
                                                size="sm"
                                                className="mt-2 bg-white/90 hover:bg-white text-slate-900 border-0 font-semibold shadow-md rounded-xl active:scale-95 transition-transform"
                                            >
                                                {slide.button_text}
                                            </Button>
                                        )}
                                    </div>

                                    {/* Right Side Icon Placeholder area - Only visible if image fails or decorative */}
                                    {/* Hidden on mobile, simplistic on desktop to not clutter the image */}
                                    <div className="hidden md:flex flex-col items-center justify-center p-4">
                                        <div className="h-20 w-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl rotate-6 group-hover:rotate-12 transition-transform duration-700">
                                            {slide.icon && <div className="scale-[2] drop-shadow-lg">{iconMap[slide.icon] || iconMap['ShoppingBag']}</div>}
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
