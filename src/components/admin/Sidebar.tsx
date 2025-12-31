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
    Image
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { useState } from 'react';

interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
    label: string;
    items: NavItem[];
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

export function AdminSidebar() {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div
            className={cn(
                'relative flex flex-col border-r bg-background transition-all duration-300',
                collapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b px-4">
                {!collapsed && (
                    <h2 className="text-lg font-semibold">Admin Panel</h2>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(!collapsed)}
                    className={cn(!collapsed && 'ml-auto')}
                >
                    {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-4 px-2 py-4 overflow-y-auto">
                {navGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="space-y-1">
                        {!collapsed && (
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
                                            collapsed && 'justify-center px-2'
                                        )}
                                        title={collapsed ? item.title : undefined}
                                    >
                                        <Icon className="h-5 w-5 flex-shrink-0" />
                                        {!collapsed && <span>{item.title}</span>}
                                    </Link>
                                );
                            })}
                        </div>
                        {groupIndex < navGroups.length - 1 && collapsed && (
                            <div className="my-2 border-t border-border/50" />
                        )}
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="border-t p-4">
                <div className={cn('flex items-center', collapsed ? 'justify-center' : 'justify-between')}>
                    {!collapsed && <span className="text-xs text-muted-foreground">v1.0.0</span>}
                    <ThemeToggle />
                </div>
            </div>
        </div>
    );
}
