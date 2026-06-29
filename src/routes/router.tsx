import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { AdminRoute, PrivateRoute } from '../components/routing/PrivateRoute';

const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const ProductsPage = lazy(() => import('../pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('../pages/ProductDetailPage'));
const CategoriesPage = lazy(() => import('../pages/CategoriesPage'));
const InventoryPage = lazy(() => import('../pages/InventoryPage'));
const SalesPage = lazy(() => import('../pages/SalesPage'));
const PurchasesPage = lazy(() => import('../pages/PurchasesPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const UsersPage = lazy(() => import('../pages/UsersPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/registro', element: <RegisterPage /> },
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/productos', element: <ProductsPage /> },
          { path: '/productos/:id', element: <ProductDetailPage /> },
          { path: '/categorias', element: <CategoriesPage /> },
          { path: '/ventas', element: <SalesPage /> },
          { path: '/compras', element: <PurchasesPage /> },
          { path: '/perfil', element: <ProfilePage /> },
          {
            element: <AdminRoute />,
            children: [
              { path: '/inventario', element: <InventoryPage /> },
              { path: '/usuarios', element: <UsersPage /> }
            ]
          }
        ]
      }
    ]
  },
  { path: '*', element: <NotFoundPage /> }
]);
