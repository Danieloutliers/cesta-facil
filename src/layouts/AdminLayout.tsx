import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/Sidebar';

const AdminLayout = () => {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
