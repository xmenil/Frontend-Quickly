import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from '../components/shared/Navbar';
import { MobileNav } from '../components/shared/MobileNav';
import { DemoSwitcher } from '../components/shared/DemoSwitcher';
import { useAuthStore } from '../store/authStore';

export const CustomerLayout: React.FC = () => {
  const { isAuthenticated, currentUser } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        <Outlet />
      </main>
      <MobileNav />
      <DemoSwitcher />
    </div>
  );
};
