import React from 'react';
import { OrderDetailPage } from '../orders/OrderDetailPage';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { RemoteState } from '../operations/shared';

/** Multi-store receipts use the same rich original order view. */
export const GroupCheckoutPage: React.FC = () => {
  const { sessionStatus, sessionError, initialize, isAuthenticated } = useAuthStore();
  const location = useLocation();
  if (sessionStatus !== 'ready') return <RemoteState loading={sessionStatus === 'checking'} error={sessionError || undefined} retry={() => void initialize()} />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <OrderDetailPage group />;
};
