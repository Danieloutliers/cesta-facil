import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fallback values to prevent crash
const FALLBACK_URL = 'https://placeholder.supabase.co';
const FALLBACK_KEY = 'placeholder-key';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables! Check .env.local');
    console.warn('The app will load but database features will not work.');
}

// Initialize Supabase client with fallbacks to prevent crash
export const supabase = createClient(
    supabaseUrl || FALLBACK_URL,
    supabaseAnonKey || FALLBACK_KEY
);

// Storage bucket name (mesmo do admin)
export const PRODUCT_BUCKET = 'product-images';
