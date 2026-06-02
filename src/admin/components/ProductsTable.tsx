import type { ProductRecord } from '../types';

type ProductsTableProps = {
  products: ProductRecord[];
  loading: boolean;
  onEdit: (product: ProductRecord) => void;
  onDelete: (product: ProductRecord) => void;
};

export function ProductsTable({ products, loading, onEdit, onDelete }: ProductsTableProps) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-slate-300">
        Loading products...
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center text-slate-400">
        No products found. Create the first product to populate the catalog.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-950/70">
            <tr className="text-left text-xs uppercase tracking-[0.25em] text-slate-400">
              <th className="px-6 py-4">Image</th>
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-sm text-slate-200">
            {products.map((product) => (
              <tr key={product.id} className="transition hover:bg-slate-800/50">
                <td className="px-6 py-4">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="h-14 w-14 rounded-2xl object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-xs text-slate-500">
                      No image
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-white">{product.name}</p>
                    <p className="mt-1 text-xs text-slate-400">{product.category ?? 'Uncategorized'}</p>
                  </div>
                </td>
                <td className="px-6 py-4">${product.price.toFixed(2)}</td>
                <td className="px-6 py-4">{product.stock}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(product)}
                      className="rounded-full border border-slate-700 px-4 py-2 text-xs font-medium text-slate-200 transition hover:border-sky-500 hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(product)}
                      className="rounded-full border border-rose-500/40 px-4 py-2 text-xs font-medium text-rose-200 transition hover:bg-rose-500/10"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
