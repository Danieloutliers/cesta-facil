import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export interface Address {
    street: string;
    number: string;
    neighborhood: string;
    complement?: string;
    city: string;
    state: string;
    zip?: string;
}

interface User {
    id: string;
    phone: string;
    name?: string;
    is_admin?: boolean;
    address?: Address;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    login: (phone: string) => Promise<{ user: User; isNewUser: boolean }>;
    logout: () => void;
    updateUserName: (name: string) => Promise<void>;
    updateUserAddress: (address: Address) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            // Load user from localStorage on mount
            const savedUser = localStorage.getItem('mercadofacil_user');

            if (savedUser) {
                try {
                    const parsedUser = JSON.parse(savedUser);
                    setUser(parsedUser);

                    // Verify/Update with latest data from Supabase
                    const { data: latestUser, error } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', parsedUser.id)
                        .single();

                    if (latestUser && !error) {
                        setUser(latestUser);
                        localStorage.setItem('mercadofacil_user', JSON.stringify(latestUser));
                    }
                } catch (error) {
                    console.error('Error restoring session:', error);
                    // If error, clear invalid session
                    localStorage.removeItem('mercadofacil_user');
                }
            }
            setLoading(false);
        };

        initAuth();
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

    const updateUserAddress = async (address: Address) => {
        if (!user) return;

        try {
            const { data: updatedUser, error } = await supabase
                .from('users')
                .update({ address })
                .eq('id', user.id)
                .select()
                .single();

            if (error) throw error;

            setUser(updatedUser);
            localStorage.setItem('mercadofacil_user', JSON.stringify(updatedUser));
        } catch (error) {
            console.error('Update address error:', error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('mercadofacil_user');
    };

    const isAdmin = user?.is_admin === true;

    return (
        <AuthContext.Provider value={{ user, loading, isAdmin, login, logout, updateUserName, updateUserAddress }}>
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
