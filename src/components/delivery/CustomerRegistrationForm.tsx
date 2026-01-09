import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, CreditCard, Banknote, User, MapPin, Calendar as CalendarIcon } from "lucide-react";
import { Order } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const formSchema = z.object({
    fullName: z.string().min(3, "Nome completo é obrigatório"),
    cpf: z.string().min(11, "CPF inválido").max(14, "CPF inválido"),
    rg: z.string().optional(),
    phone: z.string().min(10, "Telefone inválido"),

    // Address Confirmation
    street: z.string().min(1, "Rua é obrigatória"),
    number: z.string().min(1, "Número é obrigatório"),
    neighborhood: z.string().min(1, "Bairro é obrigatório"),
    city: z.string().min(1, "Cidade é obrigatória"),
    complement: z.string().optional(),

    // Payment
    paymentMethod: z.enum(["pix", "money", "credit_card", "debit_card", "carnet"], {
        required_error: "Selecione a forma de pagamento",
    }),
    installments: z.string().transform((val) => parseInt(val, 10)).optional(),
    paymentDate: z.date({
        required_error: "Selecione a data de vencimento",
    }).optional(),
});

interface CustomerRegistrationFormProps {
    order: Order & { user: { phone: string; name?: string } };
    onSubmit: (values: z.infer<typeof formSchema>) => Promise<void>;
    isLoading: boolean;
}

export function CustomerRegistrationForm({ order, onSubmit, isLoading }: CustomerRegistrationFormProps) {
    const defaultValues = {
        fullName: order.user.name || "",
        cpf: "",
        rg: "",
        phone: order.user.phone,
        street: order.address.street,
        number: order.address.number,
        neighborhood: order.address.neighborhood,
        city: order.address.city,
        complement: order.address.complement || "",
        paymentMethod: (order.paymentMethod as any) || "money",
        installments: order.installments ? String(order.installments) : "1",
    };

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues,
    });


    const paymentMethod = form.watch("paymentMethod");
    const installments = form.watch("installments");

    // Calculate installment value
    const installmentValue = installments && parseInt(installments) > 1
        ? order.total / parseInt(installments)
        : order.total;


    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* Helper Data Display */}
                <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 space-y-1">
                    <p className="font-semibold">Resumo do Pedido #{order.id.slice(-4)}</p>
                    <p>Total a pagar: <span className="font-bold text-lg">R$ {order.total.toFixed(2).replace('.', ',')}</span></p>
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Dados do Cliente
                    </h3>

                    <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome Completo</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nome do cliente" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="cpf"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>CPF</FormLabel>
                                    <FormControl>
                                        <Input placeholder="000.000.000-00" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="rg"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>RG (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="RG" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Telefone / WhatsApp</FormLabel>
                                <FormControl>
                                    <Input placeholder="(00) 00000-0000" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Endereço de Entrega
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                        <FormField
                            control={form.control}
                            name="street"
                            render={({ field }) => (
                                <FormItem className="col-span-2">
                                    <FormLabel>Rua</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Número</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="neighborhood"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Bairro</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="complement"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Complemento</FormLabel>
                                <FormControl>
                                    <Input placeholder="Apto, Casa 2, Ponto de ref..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Pagamento
                    </h3>

                    <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Forma de Pagamento</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="money">Dinheiro</SelectItem>
                                        <SelectItem value="pix">PIX</SelectItem>
                                        <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                                        <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                                        <SelectItem value="carnet">Carnê Digital</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {(paymentMethod === 'credit_card' || paymentMethod === 'carnet') && (
                        <>
                            <FormField
                                control={form.control}
                                name="installments"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Parcelamento</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="1">À vista</SelectItem>
                                                <SelectItem value="2">2x</SelectItem>
                                                <SelectItem value="3">3x</SelectItem>
                                                <SelectItem value="4">4x</SelectItem>
                                                <SelectItem value="5">5x</SelectItem>
                                                <SelectItem value="6">6x</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Installment Calculation Display */}
                            {installments && parseInt(installments) > 1 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <p className="text-sm text-green-800 font-medium">
                                        {installments}x de <span className="text-lg font-bold">R$ {installmentValue.toFixed(2).replace('.', ',')}</span>
                                    </p>
                                    <p className="text-xs text-green-600 mt-1">
                                        Total: R$ {order.total.toFixed(2).replace('.', ',')}
                                    </p>
                                </div>
                            )}

                            {/* Payment Date Picker */}
                            <FormField
                                control={form.control}
                                name="paymentDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Data de Vencimento</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP", { locale: ptBR })
                                                        ) : (
                                                            <span>Selecione uma data</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date < new Date() || date < new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </>
                    )}
                </div>

                <Button
                    type="submit"
                    className="w-full h-12 text-lg font-bold bg-green-600 hover:bg-green-700"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Registrando...
                        </>
                    ) : (
                        "Finalizar Entrega & Cadastro"
                    )}
                </Button>
            </form>
        </Form>
    );
}
