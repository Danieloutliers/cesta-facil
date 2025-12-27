import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, ShoppingCart, History, User, Menu, Shield, Settings, LogOut, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function MobileNavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    {
      href: '/',
      label: 'Início',
      icon: Home,
      isCenter: false
    },
    {
      href: '/historico',
      label: 'Pedidos',
      icon: History,
      isCenter: false
    },
    {
      href: '/montar-cesta',
      label: 'Comprar',
      icon: ShoppingCart,
      isCenter: true,
      badge: itemCount > 0 ? itemCount : undefined
    },
    {
      href: user ? '/historico' : '/login',
      label: 'Conta',
      icon: User,
      isCenter: false
    },
    {
      href: '#menu',
      label: 'Menu',
      icon: Menu,
      isCenter: false,
      isMenu: true
    },
  ];

  const menuOptions = [
    { href: '/admin', label: 'Painel Admin', icon: Shield },
    { href: '/admin/settings', label: 'Configurações', icon: Settings },
  ];

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border shadow-2xl">
      <div className="safe-area-inset-bottom">
        <div className="flex items-end justify-around px-2 py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            if (item.isCenter) {
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className="relative flex flex-col items-center -mt-6 group"
                >
                  {/* Floating Action Button Central */}
                  <div className={cn(
                    "relative flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 transform group-hover:scale-110 group-active:scale-95",
                    isActive
                      ? "bg-gradient-to-br from-primary via-primary to-emerald-600 shadow-primary"
                      : "bg-gradient-to-br from-primary/90 to-emerald-500/90"
                  )}>
                    <Icon className="h-6 w-6 text-primary-foreground" />

                    {/* Badge de Contador */}
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-warning text-warning-foreground text-xs font-bold shadow-lg animate-pulse">
                        {item.badge}
                      </span>
                    )}

                    {/* Glow Effect quando ativo */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
                    )}
                  </div>

                  {/* Label */}
                  <span className={cn(
                    "text-[10px] font-medium mt-1 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </Link>
              );
            }

            // Item Menu especial
            if (item.isMenu) {
              return (
                <button
                  key={item.label}
                  onClick={handleMenuClick}
                  className="flex flex-col items-center justify-center min-w-[50px] py-1 group"
                >
                  <div className={cn(
                    "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 group-hover:scale-110 group-active:scale-95",
                    isMenuOpen
                      ? "bg-primary/10"
                      : "hover:bg-muted/50"
                  )}>
                    <Icon className={cn(
                      "h-5 w-5 transition-colors",
                      isMenuOpen ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )} />

                    {isMenuOpen && (
                      <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>

                  <span className={cn(
                    "text-[10px] font-medium transition-colors",
                    isMenuOpen ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                to={item.href}
                className="flex flex-col items-center justify-center min-w-[50px] py-1 group"
              >
                <div className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 group-hover:scale-110 group-active:scale-95",
                  isActive
                    ? "bg-primary/10"
                    : "hover:bg-muted/50"
                )}>
                  <Icon className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )} />

                  {/* Indicador de Ativo */}
                  {isActive && (
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary animate-pulse" />
                  )}
                </div>

                <span className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Menu Drawer/Sheet */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div className="fixed bottom-20 right-4 left-4 max-w-sm mx-auto z-50 bg-card rounded-xl border border-border shadow-2xl animate-slide-up overflow-hidden">
            <div className="p-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">Menu</h3>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Menu Items */}
              <div className="space-y-1">
                {menuOptions.map((option) => {
                  const OptionIcon = option.icon;
                  return (
                    <Link
                      key={option.href}
                      to={option.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-all group"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary group-hover:bg-primary/10 transition-colors">
                        <OptionIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <span className="text-sm font-medium">{option.label}</span>
                    </Link>
                  );
                })}

                {/* Logout */}
                {user && (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-destructive/10 transition-all group"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary group-hover:bg-destructive/10 transition-colors">
                      <LogOut className="h-4 w-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                    </div>
                    <span className="text-sm font-medium group-hover:text-destructive transition-colors">Sair</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
