import { useMemo, useState } from 'react';
import { ProductFormModal } from '../components/ProductFormModal';
import { ProductsTable } from '../components/ProductsTable';
import { useProducts } from '../hooks/useProducts';
import type { ProductFormValues, ProductRecord } from '../types';

export function ProductsManager() {
  const { products, loading, error, saveProduct, removeProduct, refreshProducts, importCatalog } = useProducts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRecord | undefined>();
  const [saving, setSaving] = useState(false);
  const [syncingCatalog, setSyncingCatalog] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const lowStockCount = useMemo(() => products.filter((product) => product.stock <= 5).length, [products]);

  function handleCreateClick() {
    setEditingProduct(undefined);
    setIsModalOpen(true);
  }

  function handleEditClick(product: ProductRecord) {
    setEditingProduct(product);
    setIsModalOpen(true);
  }

  async function handleDeleteClick(product: ProductRecord) {
    const confirmed = window.confirm(`Delete "${product.name}"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    try {
      await removeProduct(product.id);
      setFeedback(`Deleted ${product.name}.`);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Unable to delete product.');
    }
  }

  async function handleSubmit(values: ProductFormValues) {
    setSaving(true);

    try {
      await saveProduct(values, editingProduct);
      setFeedback(editingProduct ? `Updated ${values.name}.` : `Created ${values.name}.`);
      setIsModalOpen(false);
      setEditingProduct(undefined);
    } finally {
      setSaving(false);
    }
  }

  async function handleImportCatalog() {
    setSyncingCatalog(true);

    try {
      const result = await importCatalog();
      setFeedback(
        result.inserted > 0
          ? `Loaded ${result.inserted} storefront products into the admin catalog.`
          : `The admin catalog is already aligned with the storefront defaults.`,
      );
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Unable to import storefront catalog.');
    } finally {
      setSyncingCatalog(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-sky-400">Catalog</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Products manager</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Detect, edit, create, and delete the products that power the storefront catalog.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleImportCatalog()}
            disabled={syncingCatalog}
            className="rounded-full border border-slate-700 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {syncingCatalog ? 'Resetting...' : 'Reset from storefront catalog'}
          </button>
          <button
            type="button"
            onClick={() => void refreshProducts()}
            className="rounded-full border border-slate-700 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={handleCreateClick}
            className="rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
          >
            Add product
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <p className="text-sm text-slate-400">Total products</p>
          <p className="mt-4 text-4xl font-semibold text-white">{products.length}</p>
        </section>
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <p className="text-sm text-slate-400">Low stock</p>
          <p className="mt-4 text-4xl font-semibold text-white">{lowStockCount}</p>
        </section>
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <p className="text-sm text-slate-400">Catalog status</p>
          <p className="mt-4 text-lg font-medium text-white">{loading ? 'Reading catalog' : 'Connected'}</p>
        </section>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {feedback ? (
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200">
          {feedback}
        </div>
      ) : null}

      <ProductsTable products={products} loading={loading} onEdit={handleEditClick} onDelete={handleDeleteClick} />

      <ProductFormModal
        open={isModalOpen}
        product={editingProduct}
        saving={saving}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(undefined);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
