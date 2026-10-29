import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from '../components/shared/Navbar';
import { MobileNav } from '../components/shared/MobileNav';
import { RoleSwitcher } from '../components/shared/RoleSwitcher';
import { useAuthStore } from '../store/authStore';
import { RemoteState } from '../features/operations/shared';

export const CustomerLayout: React.FC = () => {
  const { isAuthenticated, currentUser, roles, sessionStatus, sessionError, initialize } = useAuthStore();
  const location = useLocation();

  if (sessionStatus !== "ready") return <div className="min-h-screen flex flex-col bg-gray-50/50"><Navbar /><main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6"><RemoteState loading={sessionStatus === "checking"} error={sessionError || undefined} retry={() => void initialize()} /></main><MobileNav /></div>;

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (currentUser.status !== "activo" || !roles.some(role => role === "cliente" || role === "admin")) return <Navigate to="/acceso-denegado" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        <Outlet key={currentUser.id} />
      </main>
      <MobileNav />
      <RoleSwitcher />
    </div>
  );
};
