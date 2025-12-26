import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface User {
    id: string;
    phone: string;
    name?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (phone: string) => Promise<{ user: User; isNewUser: boolean }>;
    logout: () => void;
    updateUserName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load user from localStorage on mount
        const savedUser = localStorage.getItem('mercadofacil_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = async (phone: string): Promise<{ user: User; isNewUser: boolean }> => {
        try {
            setLoading(true);

            // Check if user exists
            const { data: existingUser, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('phone', phone)
                .single();

            let userData: User;
            let isNewUser = false;

            if (existingUser) {
                // User exists, use it
                userData = existingUser;
                // Check if they don't have a name (old user before this feature)
                isNewUser = !existingUser.name;
            } else {
                // Create new user without name (will be collected later)
                const { data: newUser, error: createError } = await supabase
                    .from('users')
                    .insert([{ phone }])
                    .select()
                    .single();

                if (createError) throw createError;
                userData = newUser;
                isNewUser = true;
            }

            // Save to state and localStorage
            setUser(userData);
            localStorage.setItem('mercadofacil_user', JSON.stringify(userData));

            return { user: userData, isNewUser };
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updateUserName = async (name: string) => {
        if (!user) return;

        try {
            const { data: updatedUser, error } = await supabase
                .from('users')
                .update({ name })
                .eq('id', user.id)
                .select()
                .single();

            if (error) throw error;

            setUser(updatedUser);
            localStorage.setItem('mercadofacil_user', JSON.stringify(updatedUser));
        } catch (error) {
            console.error('Update name error:', error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('mercadofacil_user');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, updateUserName }}>
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
