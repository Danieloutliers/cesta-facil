import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Banner } from '@/types/banner';
import { useToast } from '@/hooks/use-toast';

export function useBanners() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('banners')
                .select('*')
                .eq('active', true)
                .order('display_order');

            if (error) throw error;
            setBanners(data || []);
            setError(null);
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching banners:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    return { banners, loading, error, refetch: fetchBanners };
}

// Hook for admin - fetches ALL banners including inactive
export function useAllBanners() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('banners')
                .select('*')
                .order('display_order');

            if (error) throw error;
            setBanners(data || []);
            setError(null);
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching all banners:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    return { banners, loading, error, refetch: fetchBanners };
}

// CRUD operations
export function useBannerMutations() {
    const { toast } = useToast();

    const createBanner = async (banner: Omit<Banner, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            const { data, error } = await supabase
                .from('banners')
                .insert([banner])
                .select()
                .single();

            if (error) throw error;

            toast({
                title: 'Banner criado',
                description: 'O banner foi criado com sucesso.',
            });

            return data;
        } catch (error: any) {
            toast({
                title: 'Erro ao criar banner',
                description: error.message,
                variant: 'destructive',
            });
            throw error;
        }
    };

    const updateBanner = async (id: string, updates: Partial<Banner>) => {
        try {
            const { data, error } = await supabase
                .from('banners')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            toast({
                title: 'Banner atualizado',
                description: 'As alterações foram salvas com sucesso.',
            });

            return data;
        } catch (error: any) {
            toast({
                title: 'Erro ao atualizar banner',
                description: error.message,
                variant: 'destructive',
            });
            throw error;
        }
    };

    const deleteBanner = async (id: string) => {
        try {
            const { error } = await supabase
                .from('banners')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast({
                title: 'Banner deletado',
                description: 'O banner foi removido com sucesso.',
            });

            return true;
        } catch (error: any) {
            toast({
                title: 'Erro ao deletar banner',
                description: error.message,
                variant: 'destructive',
            });
            throw error;
        }
    };

    const toggleActive = async (id: string, active: boolean) => {
        try {
            const { error } = await supabase
                .from('banners')
                .update({ active, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;

            toast({
                title: active ? 'Banner ativado' : 'Banner desativado',
                description: `O banner foi ${active ? 'ativado' : 'desativado'} com sucesso.`,
            });

            return true;
        } catch (error: any) {
            toast({
                title: 'Erro ao alterar status',
                description: error.message,
                variant: 'destructive',
            });
            throw error;
        }
    };

    const reorderBanners = async (banners: Banner[]) => {
        try {
            // Update display_order for each banner
            const updates = banners.map((banner, index) =>
                supabase
                    .from('banners')
                    .update({ display_order: index + 1 })
                    .eq('id', banner.id)
            );

            await Promise.all(updates);

            toast({
                title: 'Ordem atualizada',
                description: 'A ordem dos banners foi atualizada com sucesso.',
            });

            return true;
        } catch (error: any) {
            toast({
                title: 'Erro ao reordenar',
                description: error.message,
                variant: 'destructive',
            });
            throw error;
        }
    };

    return {
        createBanner,
        updateBanner,
        deleteBanner,
        toggleActive,
        reorderBanners,
    };
}

// Upload banner image to Supabase Storage
export async function uploadBannerImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('banner-images')
        .upload(filePath, file);

    if (uploadError) {
        throw uploadError;
    }

    const { data } = supabase.storage
        .from('banner-images')
        .getPublicUrl(filePath);

    return data.publicUrl;
}
