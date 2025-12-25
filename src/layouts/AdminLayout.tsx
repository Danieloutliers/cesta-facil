import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Tag, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
// import { supabase } from '@/lib/supabase'; // We'll use this for auth check later

const AdminLayout = () => {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Todo: Add Auth Check here
    // const [session, setSession] = useState(null);

    const navItems = [
        { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/admin' },
        { label: 'Produtos', icon: <Package size={20} />, href: '/admin/products' },
        { label: 'Categorias', icon: <Tag size={20} />, href: '/admin/categories' },
        { label: 'Configurações', icon: <Settings size={20} />, href: '/admin/settings' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex w-64 flex-col bg-white border-r">
                <div className="p-6 border-b">
                    <h1 className="text-xl font-bold text-primary">Cesta Fácil Admin</h1>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <Link key={item.href} to={item.href}>
                            <Button
                                variant={location.pathname === item.href ? 'secondary' : 'ghost'}
                                className={cn(
                                    "w-full justify-start gap-3",
                                    location.pathname === item.href && "bg-primary/10 text-primary hover:bg-primary/20"
                                )}
                            >
                                {item.icon}
                                {item.label}
                            </Button>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t">
                    <Button variant="ghost" className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50">
                        <LogOut size={20} />
                        Sair
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header - Mobile Only */}
                <header className="md:hidden bg-white border-b p-4 flex items-center justify-between">
                    <h1 className="font-bold text-primary">Admin</h1>
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        <LayoutDashboard />
                    </Button>
                </header>

                <main className="flex-1 p-6 md:p-8 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
