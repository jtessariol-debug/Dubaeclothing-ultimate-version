import { useProducts } from '../hooks/useProducts';

export function AdminDashboard() {
  const { products } = useProducts();
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  const inventoryValue = products.reduce((sum, product) => sum + product.price * product.stock, 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-sky-400">Overview</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Admin dashboard</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-400">
          Manage catalog data in Supabase without touching the storefront rendering layer.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <p className="text-sm text-slate-400">Products</p>
          <p className="mt-4 text-4xl font-semibold text-white">{products.length}</p>
        </section>
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <p className="text-sm text-slate-400">Total stock</p>
          <p className="mt-4 text-4xl font-semibold text-white">{totalStock}</p>
        </section>
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <p className="text-sm text-slate-400">Inventory value</p>
          <p className="mt-4 text-4xl font-semibold text-white">${inventoryValue.toFixed(2)}</p>
        </section>
      </div>
    </div>
  );
}
