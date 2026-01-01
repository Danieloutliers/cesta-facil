import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    Tags,
    MessageCircle,
    Users,
    BarChart3,
    Settings,
    ChevronLeft,
    ChevronRight,
    Store,
    DollarSign,
    Image,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { useState, useEffect } from 'react';

interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
    label: string;
    items: NavItem[];
}

interface AdminSidebarProps {
    mobileOpen?: boolean;
    onMobileClose?: () => void;
}

const navGroups: NavGroup[] = [
    {
        label: 'Visão Geral',
        items: [
            {
                title: 'Dashboard',
                href: '/admin',
                icon: LayoutDashboard
            },
            {
                title: 'Relatórios',
                href: '/admin/reports',
                icon: BarChart3
            }
        ]
    },
    {
        label: 'Vendas & Clientes',
        items: [
            {
                title: 'Pedidos',
                href: '/admin/orders',
                icon: ShoppingBag
            },
            {
                title: 'Clientes',
                href: '/admin/customers',
                icon: Users
            }
        ]
    },
    {
        label: 'Catálogo',
        items: [
            {
                title: 'Produtos',
                href: '/admin/products',
                icon: Package
            },
            {
                title: 'Categorias',
                href: '/admin/categories',
                icon: Tags
            },
            {
                title: 'Orçamentos',
                href: '/admin/budgets',
                icon: DollarSign
            },
            {
                title: 'Banners',
                href: '/admin/banners',
                icon: Image
            }
        ]
    },
    {
        label: 'Sistema',
        items: [
            {
                title: 'WhatsApp',
                href: '/admin/whatsapp',
                icon: MessageCircle
            },
            {
                title: 'Configurações',
                href: '/admin/settings',
                icon: Settings
            }
        ]
    }
];

export function AdminSidebar({ mobileOpen = false, onMobileClose }: AdminSidebarProps) {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    // Close mobile menu when route changes
    useEffect(() => {
        if (mobileOpen && onMobileClose) {
            onMobileClose();
        }
    }, [location.pathname]);

    // Prevent body scroll when mobile sidebar is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileOpen]);

    const SidebarContent = () => (
        <>
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b px-4">
                {(!collapsed || mobileOpen) && (
                    <h2 className="text-lg font-semibold">Admin Panel</h2>
                )}

                {/* Desktop: Collapse button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(!collapsed)}
                    className={cn('hidden md:flex', !collapsed && 'ml-auto')}
                >
                    {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </Button>

                {/* Mobile: Close button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onMobileClose}
                    className="md:hidden ml-auto"
                >
                    <X className="h-5 w-5" />
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-4 px-2 py-4 overflow-y-auto">
                {navGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="space-y-1">
                        {(!collapsed || mobileOpen) && (
                            <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                                {group.label}
                            </h3>
                        )}
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.href;

                                return (
                                    <Link
                                        key={item.href}
                                        to={item.href}
                                        className={cn(
                                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                                            'hover:bg-primary/10 hover:text-primary',
                                            isActive
                                                ? 'bg-primary/10 text-primary shadow-sm'
                                                : 'text-muted-foreground',
                                            collapsed && !mobileOpen && 'justify-center px-2'
                                        )}
                                        title={collapsed && !mobileOpen ? item.title : undefined}
                                    >
                                        <Icon className="h-5 w-5 flex-shrink-0" />
                                        {(!collapsed || mobileOpen) && <span>{item.title}</span>}
                                    </Link>
                                );
                            })}
                        </div>
                        {groupIndex < navGroups.length - 1 && collapsed && !mobileOpen && (
                            <div className="my-2 border-t border-border/50" />
                        )}
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="border-t p-4">
                <div className={cn('flex items-center', (collapsed && !mobileOpen) ? 'justify-center' : 'justify-between')}>
                    {(!collapsed || mobileOpen) && <span className="text-xs text-muted-foreground">v1.0.0</span>}
                    <ThemeToggle />
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onMobileClose}
                />
            )}

            {/* Desktop Sidebar */}
            <div
                className={cn(
                    'hidden md:flex relative flex-col border-r bg-background transition-all duration-300',
                    collapsed ? 'w-16' : 'w-64'
                )}
            >
                <SidebarContent />
            </div>

            {/* Mobile Sidebar (Drawer) */}
            <div
                className={cn(
                    'fixed top-0 left-0 bottom-0 z-50 w-64 bg-background border-r transition-transform duration-300 md:hidden flex flex-col',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <SidebarContent />
            </div>
        </>
    );
}
