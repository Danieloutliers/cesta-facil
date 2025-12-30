import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface BudgetOption {
    id: string;
    value: number;
    label: string;
    description: string;
    popular: boolean;
    active: boolean;
}

// Fallback data in case DB is empty or connection fails
const defaultOptions: BudgetOption[] = [
    { id: '1', value: 200, label: 'R$ 200', description: 'Essencial para 1 pessoa', popular: false, active: true },
    { id: '2', value: 300, label: 'R$ 300', description: 'Ideal para casal', popular: true, active: true },
    { id: '3', value: 400, label: 'R$ 400', description: 'Família pequena', popular: false, active: true },
    { id: '4', value: 500, label: 'R$ 500', description: 'Família média', popular: false, active: true },
    { id: '5', value: 600, label: 'R$ 600', description: 'Família grande', popular: false, active: true },
    { id: '6', value: 700, label: 'R$ 700', description: 'Cesta completa', popular: false, active: true },
];

export function useBudgetOptions() {
    const [options, setOptions] = useState<BudgetOption[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOptions();
    }, []);

    const fetchOptions = async () => {
        try {
            const { data, error } = await supabase
                .from('budget_options')
                .select('*')
                .eq('active', true) // Only fetch active options for public view
                .order('value', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                setOptions(data);
            } else {
                // If no data in DB, use default options (useful for first run)
                setOptions(defaultOptions);
            }
        } catch (error) {
            console.error('Error fetching budget options:', error);
            setOptions(defaultOptions);
        } finally {
            setLoading(false);
        }
    };

    return { options, loading };
}
