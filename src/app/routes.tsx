/* =====================================================
   Charlie Marketplace Builder — Router Config (React Router v7)
   ===================================================== */
import { createBrowserRouter } from 'react-router';
import MensajePage             from './public/MensajePage';
import AdminDashboard          from './AdminDashboard';
import OddyStorefront          from './public/OddyStorefront';
import CarritoPage             from './public/CarritoPage';
import CheckoutPage            from './public/CheckoutPage';
import OrdenPage               from './public/OrdenPage';
import { ProtectedRoute }      from './components/auth/ProtectedRoute';

export const router = createBrowserRouter([
  /* ── Raíz — Frontstore (público) ───────────── */
  {
    path: '/',
    Component: OddyStorefront,
  },

  /* ── Tienda (Storefront) — alias ───────────── */
  {
    path: '/tienda',
    Component: OddyStorefront,
  },

  /* ── Carrito y Checkout ────────────────────── */
  {
    path: '/carrito',
    Component: CarritoPage,
  },
  {
    path: '/checkout',
    Component: CheckoutPage,
  },
  {
    path: '/orden/:id',
    Component: OrdenPage,
  },

  /* ── Admin — Requiere autenticación ─────────── */
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },

  /* ── Etiqueta Emotiva — pública ─────────────── */
  {
    path: '/m/:token',
    Component: MensajePage,
  },
]);