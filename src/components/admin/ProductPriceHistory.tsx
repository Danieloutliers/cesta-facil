import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PriceHistoryItem } from '@/types';

interface ProductPriceHistoryProps {
    productId: string;
}

export function ProductPriceHistory({ productId }: ProductPriceHistoryProps) {
    const [history, setHistory] = useState<PriceHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!productId) return;

        async function fetchHistory() {
            setLoading(true);
            const { data } = await supabase
                .from('product_price_history')
                .select('*')
                .eq('product_id', productId)
                .order('changed_at', { ascending: false })
                .limit(3);

            if (data) setHistory(data);
            setLoading(false);
        }
        fetchHistory();
    }, [productId]);

    if (loading) return null;
    if (history.length === 0) return null;

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(dateString));
    };

    return (
        <div className="mt-4 border-t pt-4">
            <h4 className="text-sm font-semibold mb-2">Histórico de Preços (Últimas alterações)</h4>
            <div className="space-y-2">
                {history.map((item) => (
                    <div key={item.id} className="text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center bg-muted/50 p-2 rounded gap-2 sm:gap-0">
                        <span className="text-muted-foreground w-32">
                            {formatDate(item.changed_at)}
                        </span>
                        <div className="flex gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            <span className="flex flex-col sm:flex-row sm:items-center gap-1">
                                <span className="text-muted-foreground">Custo:</span>
                                <div>
                                    <span className="line-through text-muted-foreground mr-1">R$ {item.old_cost.toFixed(2)}</span>
                                    <span>→</span>
                                    <span className="font-medium ml-1">R$ {item.new_cost.toFixed(2)}</span>
                                </div>
                            </span>
                            <span className="flex flex-col sm:flex-row sm:items-center gap-1">
                                <span className="text-muted-foreground">Venda:</span>
                                <div>
                                    <span className="line-through text-muted-foreground mr-1">R$ {item.old_price.toFixed(2)}</span>
                                    <span>→</span>
                                    <span className={item.new_price > item.old_price ? "text-green-600 font-medium ml-1" : "text-red-500 font-medium ml-1"}>
                                        R$ {item.new_price.toFixed(2)}
                                    </span>
                                </div>
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
