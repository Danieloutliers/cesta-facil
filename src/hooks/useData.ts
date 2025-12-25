import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/types';
import { products as initialProducts, categories as initialCategories } from '@/data/products';

export function useProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('active', true)
                .order('name');

            if (error) throw error;
            setProducts(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    return { products, loading, error, refetch: fetchProducts };
}

export function useCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('order');

            if (error) throw error;
            setCategories(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    return { categories, loading, error };
}

// Utility to seed data if empty
export async function seedDatabase() {
    const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });

    if (count === 0) {
        console.log('Seeding database...');
        // Seed Categories if needed (usually handled by schema, but safe to check)
        const { count: catCount } = await supabase.from('categories').select('*', { count: 'exact', head: true });
        if (catCount === 0) {
            await supabase.from('categories').insert(initialCategories.map((c, index) => ({
                id: c.id,
                label: c.label,
                icon: c.icon,
                order: index
            })));
        }

        // Seed Products
        // Omit 'id' to let Supabase generate UUIDs, or keep string IDs if specific
        // The provided products use string '1', '2'. Supabase UUID is better. 
        // We will let Supabase generate UUIDs and map them.
        const productsToInsert = initialProducts.map(({ id, ...rest }) => ({
            ...rest,
            active: true
        }));

        const { error } = await supabase.from('products').insert(productsToInsert);
        if (error) console.error('Error seeding products:', error);
        else console.log('Database seeded successfully!');
        return true;
    }
    return false;
}

// CRUD Operations for Products
export async function createProduct(product: Omit<Product, 'id'>) {
    const { data, error } = await supabase
        .from('products')
        .insert([{ ...product, active: true }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateProduct(id: string, updates: Partial<Product>) {
    const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteProduct(id: string) {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
}

// CRUD Operations for Categories
export async function createCategory(category: Omit<Category, 'id'>) {
    // Generate slug from label
    const id = category.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');

    const { data, error } = await supabase
        .from('categories')
        .insert([{ id, ...category, order: 999 }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateCategory(id: string, updates: Partial<Category>) {
    const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteCategory(id: string) {
    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
}
