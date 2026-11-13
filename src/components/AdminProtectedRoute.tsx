import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface AdminProtectedRouteProps {
    children: React.ReactNode;
}

interface Verification {
    userId: string;
    allowed: boolean;
}

/**
 * Guards the admin area.
 *
 * The cached `is_admin` flag in localStorage is only a hint: before rendering
 * any admin screen we confirm the permission against the database, so editing
 * localStorage cannot grant access.
 */
export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
    const { user, isAdmin, loading } = useAuth();
    const location = useLocation();
    const [verification, setVerification] = useState<Verification | null>(null);

    useEffect(() => {
        let cancelled = false;

        if (!user) {
            setVerification(null);
            return;
        }

        const verify = async () => {
            let allowed = false;
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('is_admin')
                    .eq('id', user.id)
                    .maybeSingle();

                allowed = !error && data?.is_admin === true;
            } catch (error) {
                console.error('Could not verify admin permission:', error);
            }

            if (!cancelled) {
                setVerification({ userId: user.id, allowed });
            }
        };

        void verify();
        return () => {
            cancelled = true;
        };
    }, [user]);

    const isCurrentUserVerified = Boolean(user && verification?.userId === user.id);

    // Wait for both the session restore and the permission check before
    // rendering anything from the admin area (prevents a redirect race).
    if (loading || (user && !isCurrentUserVerified)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Verificando permissões...</p>
                </div>
            </div>
        );
    }

    // Not logged in - redirect to login
    if (!user) {
        return <Navigate to={`/login?returnUrl=${encodeURIComponent(location.pathname)}`} replace />;
    }

    // Logged in but not admin - redirect to home with error message
    if (!verification?.allowed || !isAdmin) {
        return <Navigate to="/" replace state={{ error: 'Acesso negado. Você não tem permissão para acessar esta área.' }} />;
    }

    return <>{children}</>;
}
