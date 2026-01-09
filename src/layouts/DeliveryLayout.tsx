import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Truck, MapPin, List, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { toast } from "sonner";

const DeliveryLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const isLoggedIn = localStorage.getItem('delivery_driver_logged_in');
        if (!isLoggedIn) {
            navigate('/delivery/login');
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('delivery_driver_logged_in');
        localStorage.removeItem('delivery_driver_phone');
        toast.success('Logout efetuado!');
        navigate('/delivery/login');
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b p-4 sticky top-0 z-10 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Truck className="h-6 w-6 text-blue-600" />
                    </div>
                    <h1 className="text-lg font-bold text-gray-800">Rota de Entrega</h1>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto pb-20 p-4">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <nav className="bg-white border-t fixed bottom-0 w-full z-20 pb-safe">
                <div className="flex justify-around items-center h-16">
                    <button
                        onClick={() => navigate("/delivery")}
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-full space-y-1",
                            isActive("/delivery") ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
                        )}
                    >
                        <List className="h-6 w-6" />
                        <span className="text-xs font-medium">Lista</span>
                    </button>

                    <button
                        onClick={() => navigate("/delivery/map")}
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-full space-y-1",
                            isActive("/delivery/map") ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
                        )}
                    >
                        <MapPin className="h-6 w-6" />
                        <span className="text-xs font-medium">Mapa</span>
                    </button>

                    <button
                        onClick={() => navigate("/delivery/profile")}
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-full space-y-1",
                            isActive("/delivery/profile") ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
                        )}
                    >
                        <User className="h-6 w-6" />
                        <span className="text-xs font-medium">Perfil</span>
                    </button>
                </div>
            </nav>
        </div>
    );
};

export default DeliveryLayout;
