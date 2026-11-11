import { createClient } from '@supabase/supabase-js';

const isValidUrl = (url?: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    try {
        const parsed = new URL(url.trim());
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};

const KNOWN_PROJECT_KEYS: Record<string, string> = {
    'https://vbtyvdotydiwuownbsaf.supabase.co': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZidHl2ZG90eWRpd3Vvd25ic2FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTMyNTQsImV4cCI6MjA4MjI2OTI1NH0.fSdT53q0JIpHPUA7RHTqac7xnfnFs9DuSa7sjA4NSOQ',
    'https://tvafddypmlgcvcrcumyp.supabase.co': 'sb_publishable_hLvEIFgm1PV53SXeH4RyiQ_XLMw2sw2'
};

const DEFAULT_URL = 'https://vbtyvdotydiwuownbsaf.supabase.co';
const DEFAULT_KEY = KNOWN_PROJECT_KEYS[DEFAULT_URL];

const getSupabaseCredentials = () => {
    const rawUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
    const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

    if (rawUrl && isValidUrl(rawUrl)) {
        const expectedKey = KNOWN_PROJECT_KEYS[rawUrl];
        if (expectedKey) {
            // Guarantee matching key is used if env key is missing or mismatched
            if (!rawKey || rawKey !== expectedKey) {
                console.warn(`[Supabase] Using verified API key for ${rawUrl}`);
            }
            return { url: rawUrl, key: expectedKey };
        }
        if (rawKey) {
            return { url: rawUrl, key: rawKey };
        }
    }

    return { url: DEFAULT_URL, key: DEFAULT_KEY };
};

const { url: supabaseUrl, key: supabaseAnonKey } = getSupabaseCredentials();

export const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey
);
