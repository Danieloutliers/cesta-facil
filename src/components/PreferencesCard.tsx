import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreferencesCardProps {
    value: 'substituir' | 'credito';
    onChange: (value: 'substituir' | 'credito') => void;
}

export function PreferencesCard({ value, onChange }: PreferencesCardProps) {
    return (
        <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                    <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h2 className="font-semibold">Preferências</h2>
                    <p className="text-sm text-muted-foreground">O que fazer se um item acabar?</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                    onClick={() => onChange('substituir')}
                    className={cn(
                        "relative flex flex-col items-center p-6 rounded-xl border-2 transition-all duration-300 text-center",
                        value === 'substituir'
                            ? "border-primary bg-secondary shadow-primary"
                            : "border-border bg-card hover:border-primary/50"
                    )}
                >
                    {value === 'substituir' && (
                        <div className="absolute top-2 right-2">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                                <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                    )}

                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary mb-3">
                        <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                    </div>

                    <h3 className={cn(
                        "font-semibold mb-1",
                        value === 'substituir' ? "text-primary" : "text-foreground"
                    )}>Substituir</h3>
                    <p className="text-xs text-muted-foreground">Trocar por similar</p>
                </button>

                <button
                    onClick={() => onChange('credito')}
                    className={cn(
                        "relative flex flex-col items-center p-6 rounded-xl border-2 transition-all duration-300 text-center",
                        value === 'credito'
                            ? "border-primary bg-secondary shadow-primary"
                            : "border-border bg-card hover:border-primary/50"
                    )}
                >
                    {value === 'credito' && (
                        <div className="absolute top-2 right-2">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                                <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                    )}

                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary mb-3">
                        <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>

                    <h3 className={cn(
                        "font-semibold mb-1",
                        value === 'credito' ? "text-primary" : "text-foreground"
                    )}>Crédito</h3>
                    <p className="text-xs text-muted-foreground">Gerar créd. próx compra</p>
                </button>
            </div>
        </div>
    );
}
