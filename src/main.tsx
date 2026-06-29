import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { router } from './routes/router';
import { LoadingState } from './components/feedback/LoadingState';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <AuthProvider>
        <Suspense fallback={<LoadingState label="Cargando modulo" fullPage />}>
          <RouterProvider router={router} />
        </Suspense>
      </AuthProvider>
    </ToastProvider>
  </React.StrictMode>
);
