import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { ProductFormValues, ProductRecord } from '../types';

type ProductFormModalProps = {
  open: boolean;
  product?: ProductRecord;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: ProductFormValues) => Promise<void>;
};

function createEmptyValues(): ProductFormValues {
  return {
    name: '',
    description: '',
    price: '',
    stock: '',
    sizes: [],
    category: '',
    productType: 'sneakers',
    imageFiles: [null, null, null, null, null],
    imageUrl: '',
    imageUrls: ['', '', '', '', ''],
    imagePublished: [true, false, false, false, false],
  };
}

function normalizeFormSizes(sizes: ProductRecord['sizes']): ProductFormValues['sizes'] {
  if (!Array.isArray(sizes)) {
    return [];
  }

  return sizes.reduce<ProductFormValues['sizes']>((normalizedSizes, sizeRow) => {
    if (!sizeRow || sizeRow.size === undefined || sizeRow.size === null) {
      return normalizedSizes;
    }

    const size = String(sizeRow.size).trim();
    if (!size) {
      return normalizedSizes;
    }

    const stock = Number(sizeRow.stock);
    normalizedSizes.push({
      size,
      stock: Number.isFinite(stock) ? stock : 0,
    });
    return normalizedSizes;
  }, []);
}

function buildProductFormValues(product: ProductRecord): ProductFormValues {
  return {
    name: product.name,
    description: product.description ?? '',
    price: String(product.price),
    stock: String(product.stock),
    sizes: normalizeFormSizes(product.sizes),
    category: product.category ?? '',
    productType: product.product_type ?? 'sneakers',
    imageFiles: [null, null, null, null, null],
    imageUrl: product.image_url ?? '',
    imageUrls: Array.from({ length: 5 }, (_, index) => product.image_gallery?.[index]?.url ?? product.image_urls?.[index] ?? (index === 0 ? product.image_url ?? '' : '')),
    imagePublished: Array.from({ length: 5 }, (_, index) => product.image_gallery?.[index]?.published ?? index === 0),
  };
}

export function ProductFormModal({ open, product, saving, onClose, onSubmit }: ProductFormModalProps) {
  const [values, setValues] = useState<ProductFormValues>(() => createEmptyValues());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setError(null);

    if (!product) {
      setValues(createEmptyValues());
      return;
    }

    setValues(buildProductFormValues(product));
  }, [open, product?.id]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!values.name.trim()) {
      setError('Product name is required.');
      return;
    }

    if (Number.isNaN(Number(values.price)) || Number(values.price) < 0) {
      setError('Price must be a valid number.');
      return;
    }

    if (Number.isNaN(Number(values.stock)) || Number(values.stock) < 0) {
      setError('Stock must be a valid number.');
      return;
    }

    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save product.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/85 px-3 py-4 sm:items-center sm:px-4 sm:py-8">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl shadow-sky-950/30">
        <div className="shrink-0 flex items-center justify-between border-b border-slate-800 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-400">{product ? 'Edit product' : 'New product'}</p>
            <h2 className="mt-2 text-xl font-semibold text-white">{product ? product.name : 'Create product'}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            Close
          </button>
        </div>

        <form className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-slate-300">Name</span>
              <input
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-500"
                value={values.name}
                onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
                placeholder="Air Max 97"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-slate-300">Category</span>
              <input
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-500"
                value={values.category}
                onChange={(event) => setValues((current) => ({ ...current, category: event.target.value }))}
                placeholder="Sneakers"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-slate-300">Tipo de producto</span>
              <select
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-500"
                value={values.productType}
                onChange={(event) => setValues((current) => ({ ...current, productType: event.target.value }))}
              >
                <option value="sneakers">Sneakers</option>
                <option value="tshirts">T-Shirts</option>
                <option value="pants">Pantalones</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm text-slate-300">Price</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-500"
                value={values.price}
                onChange={(event) => setValues((current) => ({ ...current, price: event.target.value }))}
                placeholder="129.99"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-slate-300">Stock</span>
              <input
                type="number"
                min="0"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-500"
                value={values.stock}
                onChange={(event) => setValues((current) => ({ ...current, stock: event.target.value }))}
                placeholder="20"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Description</span>
            <textarea
              className="min-h-32 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-500"
              value={values.description}
              onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
              placeholder="Premium upper, lightweight sole..."
            />
          </label>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Sizes</span>
              <button
                type="button"
                onClick={() =>
                  setValues((current) => ({
                    ...current,
                    sizes: [...current.sizes, { size: '', stock: 0 }],
                  }))
                }
                className="rounded-full border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Add size
              </button>
            </div>

            <div className="space-y-3">
              {values.sizes.map((sizeRow, index) => (
                <div key={index} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                  <label className="space-y-2">
                    <span className="text-sm text-slate-300">Size</span>
                    <input
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-500"
                      value={sizeRow.size}
                      onChange={(event) =>
                        setValues((current) => {
                          const nextSizes = [...current.sizes];
                          nextSizes[index] = { ...nextSizes[index], size: event.target.value };
                          return {
                            ...current,
                            sizes: nextSizes,
                          };
                        })
                      }
                      placeholder="8"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-slate-300">Stock</span>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-500"
                      value={sizeRow.stock}
                      onChange={(event) =>
                        setValues((current) => {
                          const nextSizes = [...current.sizes];
                          nextSizes[index] = { ...nextSizes[index], stock: Number(event.target.value) };
                          return {
                            ...current,
                            sizes: nextSizes,
                          };
                        })
                      }
                      placeholder="5"
                    />
                  </label>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() =>
                        setValues((current) => ({
                          ...current,
                          sizes: current.sizes.filter((_, sizeIndex) => sizeIndex !== index),
                        }))
                      }
                      className="w-full rounded-full border border-rose-500/30 px-4 py-3 text-sm font-medium text-rose-200 transition hover:border-rose-400 hover:text-white md:w-auto"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-slate-300">Fotos del producto</span>
              <span className="text-xs text-slate-500">Cada foto se puede publicar por separado</span>
            </div>

            {values.imageUrls.slice(0, 5).map((url, index) => (
              <div key={index} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-white">Foto {index + 1}</span>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={values.imagePublished[index]}
                      onChange={(event) =>
                        setValues((current) => {
                          const nextPublished = [...current.imagePublished];
                          nextPublished[index] = event.target.checked;
                          return {
                            ...current,
                            imagePublished: nextPublished,
                          };
                        })
                      }
                    />
                    Publicar
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm text-slate-300">Subir foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="block w-full rounded-2xl border border-dashed border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-sky-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-950"
                      onChange={(event) =>
                        setValues((current) => {
                          const nextFiles = [...current.imageFiles];
                          nextFiles[index] = event.target.files?.[0] ?? null;
                          return {
                            ...current,
                            imageFiles: nextFiles,
                          };
                        })
                      }
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-slate-300">URL foto</span>
                    <input
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-500"
                      value={url}
                      onChange={(event) =>
                        setValues((current) => {
                          const nextImageUrls = [...current.imageUrls];
                          nextImageUrls[index] = event.target.value;
                          return {
                            ...current,
                            imageUrls: nextImageUrls,
                            imageUrl: index === 0 ? event.target.value : current.imageUrl,
                          };
                        })
                      }
                      placeholder={`https://.../foto-${index + 1}.jpg`}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : product ? 'Update product' : 'Create product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
