import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '../components/AdminLayout';
import { ProtectedAdminRoute } from '../components/ProtectedAdminRoute';
import { AdminDashboard } from '../pages/AdminDashboard';
import { OrdersManager } from '../pages/OrdersManager';
import { ProductsManager } from '../pages/ProductsManager';
import { ReviewsManager } from '../pages/ReviewsManager';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';

export function AdminRouter() {
  return (
    <Routes>
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route element={<ProtectedAdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<ProductsManager />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<ProductsManager />} />
          <Route path="orders" element={<OrdersManager />} />
          <Route path="reviews" element={<ReviewsManager />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
