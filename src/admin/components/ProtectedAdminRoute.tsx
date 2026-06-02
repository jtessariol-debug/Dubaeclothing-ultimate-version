import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';

export function ProtectedAdminRoute() {
  const { loading, isAdmin } = useAdminAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-50">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 px-8 py-10 text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-sky-400">Checking access</p>
          <h1 className="mt-3 text-2xl font-semibold">Loading admin session</h1>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
