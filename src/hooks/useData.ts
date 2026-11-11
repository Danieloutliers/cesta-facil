import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, Category, SubCategory } from '@/types';
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
            setProducts(data || initialProducts);
        } catch (err: unknown) {
            setError((err as Error).message);
            setProducts(initialProducts as Product[]);
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
            setCategories(data || initialCategories);
        } catch (err: unknown) {
            setError((err as Error).message);
            setCategories(initialCategories as Category[]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    return { categories, loading, error, refetch: fetchCategories };
}

export function useSubcategories() {
    const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSubcategories = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('subcategories')
                .select('*')
                .order('label');

            if (error) throw error;
            setSubcategories(data || []);
        } catch (err: unknown) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubcategories();
    }, []);

    return { subcategories, loading, error, refetch: fetchSubcategories };
}

export async function seedDatabase() {
    return false;
}

export async function createProduct(product: Omit<Product, 'id'>) {
    const { data, error } = await supabase
        .from('products')
        .insert([{ ...product, active: true }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function createProductsBulk(productsToInsert: Omit<Product, 'id'>[]) {
    if (!productsToInsert || productsToInsert.length === 0) return [];

    const formatted = productsToInsert.map(p => ({
        ...p,
        active: true,
        price: Number(p.price) || 0,
        cost_price: Number(p.cost_price) || 0,
        image: p.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60'
    }));

    const { data, error } = await supabase
        .from('products')
        .insert(formatted)
        .select();

    if (error) throw error;
    return data;
}

export async function updateProduct(id: string, updates: Partial<Product>) {
    const { data: current } = await supabase.from('products').select('*').eq('id', id).single();

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
    const { error: softDeleteError } = await supabase
        .from('products')
        .update({ active: false })
        .eq('id', id);

    if (softDeleteError) throw softDeleteError;
    return true;
}

export async function deleteProductsBulk(ids: string[]) {
    if (!ids || ids.length === 0) return true;

    const { error: softDeleteError } = await supabase
        .from('products')
        .update({ active: false })
        .in('id', ids);

    if (softDeleteError) throw softDeleteError;
    return true;
}

export async function createCategory(category: Omit<Category, 'id'>) {
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

export async function createSubcategory(subcategory: Omit<SubCategory, 'id'>) {
    const { data, error } = await supabase
        .from('subcategories')
        .insert([subcategory])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateSubcategory(id: string, updates: Partial<SubCategory>) {
    const { data, error } = await supabase
        .from('subcategories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteSubcategory(id: string) {
    const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
}
