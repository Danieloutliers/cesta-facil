import { Banknote, CreditCard, Wallet, FileText, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaymentMethod } from '@/types';

import { calculateInstallmentTotal } from '@/lib/financial';

interface PaymentMethodCardProps {
    selected: PaymentMethod | undefined;
    onSelect: (method: PaymentMethod) => void;
    installments: number;
    onInstallmentsChange: (value: number) => void;
    total: number;
    rates: { rate1to2: number; rate3to5: number };
}

export function PaymentMethodCard({ selected, onSelect, installments, onInstallmentsChange, total, rates }: PaymentMethodCardProps) {
    return (
        <div className="bg-card rounded-2xl border border-border p-6 shadow-card">

            <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                    <Banknote className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h2 className="font-semibold">Forma de Pagamento</h2>
                    <p className="text-sm text-muted-foreground">Como você prefere pagar?</p>
                </div>
            </div>

            {/* Destaque PIX */}
            <div className={cn(
                "w-full mb-6 relative overflow-hidden rounded-xl border-2 transition-all duration-300 group",
                selected === 'pix'
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/50"
            )}>
                <button
                    onClick={() => onSelect('pix')}
                    className="w-full text-left relative z-10"
                >
                    {selected === 'pix' && (
                        <div className="absolute top-0 right-0 p-2 bg-primary rounded-bl-xl z-20">
                            <Check className="h-4 w-4 text-primary-foreground" />
                        </div>
                    )}

                    <div className="relative p-4 md:p-5 flex items-center gap-4">
                        <div className={cn(
                            "h-12 w-12 rounded-lg flex items-center justify-center transition-colors",
                            selected === 'pix' ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"
                        )}>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-base">PIX</h3>
                                <span className="bg-green-500/10 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border border-green-500/20">Recomendado</span>
                            </div>
                            <p className="text-sm text-muted-foreground">Pagamento instantâneo com aprovação imediata</p>
                        </div>
                    </div>
                </button>
            </div>

            <p className="text-sm font-medium text-muted-foreground mb-3 pl-1">Outras opções:</p>

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Dinheiro */}
                    <button
                        onClick={() => onSelect('dinheiro')}
                        className={cn(
                            "relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-300 text-center",
                            selected === 'dinheiro'
                                ? "border-primary bg-secondary shadow-sm"
                                : "border-border hover:border-primary/50"
                        )}
                    >
                        {selected === 'dinheiro' && (
                            <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
                        )}
                        <div className="mb-2 text-primary">
                            <Banknote className="h-6 w-6" />
                        </div>
                        <span className="font-semibold text-sm">Dinheiro</span>
                        <span className="text-xs text-muted-foreground">Na entrega</span>
                    </button>

                    {/* Cartão */}
                    <button
                        onClick={() => onSelect('cartao')}
                        className={cn(
                            "relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-300 text-center",
                            selected === 'cartao'
                                ? "border-primary bg-secondary shadow-sm"
                                : "border-border hover:border-primary/50"
                        )}
                    >
                        {selected === 'cartao' && (
                            <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
                        )}
                        <div className="mb-2 text-primary">
                            <CreditCard className="h-6 w-6" />
                        </div>
                        <span className="font-semibold text-sm">Cartão</span>
                        <span className="text-xs text-muted-foreground">Crédito/Débito</span>
                    </button>

                    {/* Carnê Digital */}
                    <button
                        onClick={() => onSelect('carne')}
                        className={cn(
                            "relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-300 text-center order-last",
                            selected === 'carne'
                                ? "border-primary bg-secondary shadow-sm"
                                : "border-border hover:border-primary/50"
                        )}
                    >
                        {selected === 'carne' && (
                            <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
                        )}
                        <div className="mb-2 text-primary">
                            <FileText className="h-6 w-6" />
                        </div>
                        <span className="font-semibold text-sm">Carnê Digital</span>
                        <span className="text-xs text-amber-600 dark:text-amber-500 font-medium">Com acréscimo</span>
                    </button>
                </div>

                {/* Installment Selection for Carne - Shown below grid if selected */}
                {selected === 'carne' && (
                    <div className="w-full bg-card rounded-xl border border-border p-4 animate-in slide-in-from-top-2 duration-300">
                        <p className="text-sm font-medium mb-3 text-muted-foreground">Em quantas vezes deseja parcelar?</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {[1, 2, 3, 4, 5].map((num) => {
                                const { installmentValue, interestRate } = calculateInstallmentTotal(total, num, rates);

                                return (
                                    <button
                                        key={num}
                                        onClick={() => onInstallmentsChange(num)}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-3 rounded-lg border text-sm transition-all",
                                            installments === num
                                                ? "bg-primary/10 border-primary text-primary font-medium ring-1 ring-primary/20"
                                                : "bg-background border-border hover:border-primary/30 text-muted-foreground"
                                        )}
                                    >
                                        <div className="flex flex-col items-center gap-0.5">
                                            <span className={cn(
                                                "text-xs font-medium uppercase tracking-wider",
                                                installments === num ? "text-primary/80" : "text-muted-foreground"
                                            )}>
                                                {num}x de
                                            </span>
                                            <span className={cn(
                                                "text-base font-bold",
                                                installments === num ? "text-primary" : "text-foreground"
                                            )}>
                                                R$ {installmentValue.toFixed(2).replace('.', ',')}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
