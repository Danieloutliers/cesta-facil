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
            setError(null);
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('active', true)
                .order('name');

            if (error) throw error;
            setProducts(data || []);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar produtos');
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
            setError(null);
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('order');

            if (error) throw error;
            setCategories(data || []);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar categorias');
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
            setError(null);
            const { data, error } = await supabase
                .from('subcategories')
                .select('*')
                .order('label');

            if (error) throw error;
            setSubcategories(data || []);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar subcategorias');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubcategories();
    }, []);

    return { subcategories, loading, error, refetch: fetchSubcategories };
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
    // 1. Fetch current data for history
    const { data: current } = await supabase.from('products').select('*').eq('id', id).single();

    // 2. Update
    const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    // 3. Insert History if price or cost changed
    if (current && (
        (updates.price !== undefined && updates.price !== current.price) ||
        (updates.cost_price !== undefined && updates.cost_price !== current.cost_price)
    )) {
        const { error: historyError } = await supabase.from('product_price_history').insert({
            product_id: id,
            old_price: current.price,
            new_price: updates.price ?? current.price,
            old_cost: current.cost_price || 0,
            new_cost: updates.cost_price ?? (current.cost_price || 0)
        });
        if (historyError) console.error('Error saving price history:', historyError);
    }

    return data;
}

export async function deleteProduct(id: string) {
    // Soft delete first so the product immediately disappears from the catalog.
    const { error: softDeleteError } = await supabase
        .from('products')
        .update({ active: false })
        .eq('id', id);

    if (softDeleteError) throw softDeleteError;

    // Supabase returns errors instead of throwing, so every step is checked.
    const { error: historyError } = await supabase
        .from('product_price_history')
        .delete()
        .eq('product_id', id);
    if (historyError) {
        console.warn('Price history cleanup skipped:', historyError.message);
    }

    // Hard delete is best-effort: orders keep historical item snapshots and may
    // reference the product, in which case the soft delete is enough.
    const { error: hardDeleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
    if (hardDeleteError) {
        console.warn('Hard delete skipped (foreign key constraints):', hardDeleteError.message);
    }

    return true;
}

export async function deleteProductsBulk(ids: string[]) {
    if (!ids || ids.length === 0) return true;

    const { error: softDeleteError } = await supabase
        .from('products')
        .update({ active: false })
        .in('id', ids);

    if (softDeleteError) throw softDeleteError;

    const { error: historyError } = await supabase
        .from('product_price_history')
        .delete()
        .in('product_id', ids);
    if (historyError) {
        console.warn('Price history bulk cleanup skipped:', historyError.message);
    }

    const { error: hardDeleteError } = await supabase
        .from('products')
        .delete()
        .in('id', ids);
    if (hardDeleteError) {
        console.warn('Bulk hard delete skipped (foreign key constraints):', hardDeleteError.message);
    }

    return true;
}

// CRUD Operations for Categories
export async function createCategory(category: Omit<Category, 'id'>) {
    const label = category.label.trim();
    if (!label) throw new Error('Informe o nome da categoria');

    // Generate a URL-safe slug from the label.
    const id = label
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

    if (!id) throw new Error('O nome da categoria gera um identificador inválido');

    const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('id', id)
        .maybeSingle();

    if (existing) {
        throw new Error('Já existe uma categoria com esse nome');
    }

    const { data, error } = await supabase
        .from('categories')
        .insert([{ id, ...category, label, order: 999 }])
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
    // Products reference categories by slug without a FK, so guard against
    // silently orphaning them before deleting the category.
    const { count, error: countError } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('category', id)
        .eq('active', true);

    if (countError) throw countError;
    if (count && count > 0) {
        throw new Error(`Existem ${count} produto(s) ativo(s) nesta categoria. Mova-os antes de excluir.`);
    }

    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
}

// CRUD Operations for Subcategories
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
