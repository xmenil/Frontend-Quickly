import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import './styles/index.css';
import { SessionBoundary } from './features/auth/SessionBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SessionBoundary><RouterProvider router={router} /></SessionBoundary>
  </React.StrictMode>
);
