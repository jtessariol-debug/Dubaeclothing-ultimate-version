import { useCallback, useEffect, useState } from 'react';
import { createProduct, deleteProduct, getProducts, importStorefrontCatalog, updateProduct } from '../services/productsAdminService';
import type { ProductFormValues, ProductRecord } from '../types';

export function useProducts() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const nextProducts = await getProducts();
      setProducts(nextProducts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshProducts();
  }, [refreshProducts]);

  const saveProduct = useCallback(
    async (values: ProductFormValues, product?: ProductRecord) => {
      if (product) {
        const updated = await updateProduct(product.id, values, product.image_url);
        setProducts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        return updated;
      }

      const created = await createProduct(values);
      setProducts((current) => [created, ...current]);
      return created;
    },
    [],
  );

  const removeProduct = useCallback(async (productId: string) => {
    await deleteProduct(productId);
    setProducts((current) => current.filter((item) => item.id !== productId));
  }, []);

  const importCatalog = useCallback(async () => {
    const result = await importStorefrontCatalog();
    await refreshProducts();
    return result;
  }, [refreshProducts]);

  return {
    products,
    loading,
    error,
    refreshProducts,
    saveProduct,
    removeProduct,
    importCatalog,
  };
}
