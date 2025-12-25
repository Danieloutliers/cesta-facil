import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fallback to prevent crash if env vars are missing (development only)
const FALLBACK_URL = 'https://placeholder.supabase.co';
const FALLBACK_KEY = 'placeholder';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials MISSING. Please check your .env file.');
    // We won't crash, but requests will fail.
}

export const supabase = createClient(
    supabaseUrl || FALLBACK_URL,
    supabaseAnonKey || FALLBACK_KEY
);
