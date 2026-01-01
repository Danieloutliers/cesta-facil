import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/Sidebar';
import { MobileNav } from '@/components/admin/MobileNav';
import { useState } from 'react';

const AdminLayout = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar */}
            <AdminSidebar
                mobileOpen={mobileMenuOpen}
                onMobileClose={() => setMobileMenuOpen(false)}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile Nav Header */}
                <MobileNav onMenuClick={() => setMobileMenuOpen(true)} />

                <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;

