import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export interface Address {
    street: string;
    number: string;
    neighborhood: string;
    complement?: string;
    city: string;
    state: string;
    zip?: string;
    cep?: string;
}

interface User {
    id: string;
    phone: string;
    name?: string;
    is_admin?: boolean;
    address?: Address;
    [key: string]: unknown;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    login: (phone: string) => Promise<{ user: User; isNewUser: boolean }>;
    logout: () => void;
    updateUserName: (name: string) => Promise<void>;
    updateUserAddress: (address: Address) => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'mercadofacil_user';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const isValidStoredUser = (value: unknown): value is User =>
    isRecord(value) && typeof value.id === 'string' && value.id.length > 0 && typeof value.phone === 'string';

const readStoredUser = (): User | null => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        return isValidStoredUser(parsed) ? parsed : null;
    } catch (error) {
        console.warn('Stored session could not be parsed, clearing it.', error);
        return null;
    }
};

const persistUser = (user: User | null) => {
    try {
        if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        else localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        // Private mode / storage full: the in-memory session still works.
        console.warn('Could not persist session:', error);
    }
};

const normalizePhone = (phone: string) => phone.replace(/\D/g, '');

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const userRef = useRef<User | null>(null);

    const applyUser = useCallback((nextUser: User | null) => {
        userRef.current = nextUser;
        setUser(nextUser);
        persistUser(nextUser);
    }, []);

    const fetchUserById = useCallback(async (id: string): Promise<User | null> => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return (data as User | null) ?? null;
    }, []);

    const refreshUser = useCallback(async () => {
        const current = userRef.current;
        if (!current) return;

        try {
            const fresh = await fetchUserById(current.id);
            if (fresh) {
                applyUser(fresh);
            } else {
                // The account no longer exists: drop the stale local session.
                applyUser(null);
            }
        } catch (error) {
            // Keep the cached session on transient/offline errors.
            console.warn('Could not refresh session:', error);
        }
    }, [applyUser, fetchUserById]);

    useEffect(() => {
        let cancelled = false;

        const initAuth = async () => {
            const stored = readStoredUser();

            if (!stored) {
                if (!cancelled) setLoading(false);
                return;
            }

            // Optimistically restore the cached session so the UI does not flash.
            userRef.current = stored;
            setUser(stored);

            try {
                const fresh = await fetchUserById(stored.id);
                if (cancelled) return;

                if (fresh) {
                    applyUser(fresh);
                } else {
                    applyUser(null);
                }
            } catch (error) {
                // Offline or transient failure: keep the cached user.
                console.warn('Could not verify stored session:', error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        initAuth();

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') void refreshUser();
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            cancelled = true;
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [applyUser, fetchUserById, refreshUser]);

    const login = async (phone: string): Promise<{ user: User; isNewUser: boolean }> => {
        const cleanPhone = normalizePhone(phone);
        if (cleanPhone.length < 10 || cleanPhone.length > 11) {
            throw new Error('Telefone inválido');
        }

        setLoading(true);
        try {
            // maybeSingle avoids treating "no rows" as an error.
            const { data: existingUser, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('phone', cleanPhone)
                .maybeSingle();

            if (fetchError) throw fetchError;

            let userData: User;
            let isNewUser = false;

            if (existingUser) {
                userData = existingUser as User;
                isNewUser = !existingUser.name;
            } else {
                const { data: newUser, error: createError } = await supabase
                    .from('users')
                    .insert([{ phone: cleanPhone }])
                    .select()
                    .single();

                if (createError) throw createError;
                userData = newUser as User;
                isNewUser = true;
            }

            applyUser(userData);
            return { user: userData, isNewUser };
        } finally {
            setLoading(false);
        }
    };

    const updateUserName = async (name: string) => {
        const current = userRef.current;
        if (!current) throw new Error('Usuário não autenticado');

        const trimmed = name.trim();
        if (!trimmed) throw new Error('Nome é obrigatório');

        const { data: updatedUser, error } = await supabase
            .from('users')
            .update({ name: trimmed })
            .eq('id', current.id)
            .select()
            .maybeSingle();

        if (error) throw error;
        if (!updatedUser) throw new Error('Usuário não encontrado');
        applyUser(updatedUser as User);
    };

    const updateUserAddress = async (address: Address) => {
        const current = userRef.current;
        if (!current) throw new Error('Usuário não autenticado');

        const { data: updatedUser, error } = await supabase
            .from('users')
            .update({ address })
            .eq('id', current.id)
            .select()
            .maybeSingle();

        if (error) throw error;
        if (!updatedUser) throw new Error('Usuário não encontrado');
        applyUser(updatedUser as User);
    };

    const logout = () => {
        applyUser(null);
    };

    const isAdmin = user?.is_admin === true;

    return (
        <AuthContext.Provider value={{ user, loading, isAdmin, login, logout, updateUserName, updateUserAddress, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
