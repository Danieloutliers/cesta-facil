import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AdminProtectedRouteProps {
    children: React.ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
    const { user, isAdmin, loading } = useAuth();
    const location = useLocation();

    if (loading) {
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
    if (!isAdmin) {
        return <Navigate to="/" replace state={{ error: 'Acesso negado. Você não tem permissão para acessar esta área.' }} />;
    }

    return <>{children}</>;
}
