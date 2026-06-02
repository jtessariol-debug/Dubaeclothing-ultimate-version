import { storefrontCatalogSeed } from './storefrontCatalog';
import { supabase } from './supabaseClient';
import type { ProductFormValues, ProductImageSlot, ProductRecord, ProductSizeRecord } from '../types';

const ADMIN_PRODUCTS_STORAGE_KEY = 'dubae_admin_products_v1';
const LEGACY_ADMIN_PRODUCTS_STORAGE_KEY = 'dabe_admin_products_v1';
const PRODUCTS_BUCKET = import.meta.env.VITE_SUPABASE_PRODUCTS_BUCKET ?? 'product-images';
const MAX_PRODUCT_IMAGES = 5;

type ProductPayload = Omit<ProductRecord, 'id' | 'created_at'>;
type SupabaseProductRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  sizes?: ProductSizeRecord[] | null;
  image_url: string | null;
  category: string | null;
  product_type?: string | null;
  created_at: string;
  image_urls?: string[] | null;
  image_gallery?: ProductImageSlot[] | null;
};

function normalizeProductType(productType: string | null | undefined) {
  return productType === 'tshirts' || productType === 'pants' ? productType : 'sneakers';
}

function removeTinyCache() {
  try {
    localStorage.removeItem(ADMIN_PRODUCTS_STORAGE_KEY);
    localStorage.removeItem(LEGACY_ADMIN_PRODUCTS_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
}

function writeTinyCache(ids: string[]) {
  try {
    const tinyCache = JSON.stringify({
      lastSync: Date.now(),
      ids,
    });
    localStorage.setItem(ADMIN_PRODUCTS_STORAGE_KEY, tinyCache);
    localStorage.removeItem(LEGACY_ADMIN_PRODUCTS_STORAGE_KEY);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      removeTinyCache();
      return;
    }
    try {
      localStorage.removeItem(LEGACY_ADMIN_PRODUCTS_STORAGE_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }
  }
}

function normalizeProductRecord(row: SupabaseProductRow): ProductRecord {
  const gallery =
    Array.isArray(row.image_gallery) && row.image_gallery.length > 0
      ? row.image_gallery
      : Array.isArray(row.image_urls) && row.image_urls.length > 0
        ? row.image_urls.filter(Boolean).map((url) => ({ url, published: true }))
        : row.image_url
          ? [{ url: row.image_url, published: true }]
          : [];

  return {
    id: String(row.id),
    name: row.name,
    description: row.description,
    price: Number(row.price) || 0,
    stock: Number(row.stock) || 0,
    sizes: sanitizeSizes(Array.isArray(row.sizes) ? row.sizes : []),
    image_url: row.image_url,
    image_urls: gallery.map((slot) => slot.url),
    image_gallery: gallery,
    category: row.category,
    product_type: normalizeProductType(row.product_type),
    created_at: row.created_at,
  };
}

function normalizeCurrentGallery(currentProduct: ProductRecord | undefined): ProductImageSlot[] {
  if (!currentProduct) {
    return [];
  }

  if (currentProduct.image_gallery && currentProduct.image_gallery.length > 0) {
    return currentProduct.image_gallery;
  }

  const fallbackUrls = currentProduct.image_urls ?? (currentProduct.image_url ? [currentProduct.image_url] : []);
  return fallbackUrls.map((url) => ({ url, published: true }));
}

function sanitizeImageGallery(gallery: ProductImageSlot[] = []) {
  return gallery
    .filter((slot) => typeof slot?.url === 'string' && slot.url.trim().length > 0)
    .map((slot) => ({
      url: slot.url.trim(),
      published: Boolean(slot.published),
    }));
}

function sanitizeSizes(sizes: ProductSizeRecord[] = []) {
  return sizes
    .filter((item) => typeof item?.size === 'string' && item.size.trim().length > 0)
    .map((item) => ({
      size: item.size.trim(),
      stock: Number(item.stock) || 0,
    }));
}

function sanitizeFilename(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
}

function createSafeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function uploadImageFile(file: File) {
  const objectPath = `admin-products/${Date.now()}-${createSafeId()}-${sanitizeFilename(file.name)}`;
  console.log('Admin product image upload:start', {
    operation: 'storage.upload',
    bucket: PRODUCTS_BUCKET,
    objectPath,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  });
  const uploadResponse = await supabase.storage.from(PRODUCTS_BUCKET).upload(objectPath, file, {
    cacheControl: '3600',
    upsert: false,
  });
  console.log('Admin product image upload:response', {
    operation: 'storage.upload',
    bucket: PRODUCTS_BUCKET,
    objectPath,
    data: uploadResponse.data ?? null,
    error: uploadResponse.error ?? null,
  });

  if (uploadResponse.error) {
    console.error('Admin product image upload:error', uploadResponse.error);
    throw new Error(uploadResponse.error.message);
  }

  const { data } = supabase.storage.from(PRODUCTS_BUCKET).getPublicUrl(objectPath);
  console.log('Admin product image upload:success', {
    bucket: PRODUCTS_BUCKET,
    objectPath,
    publicUrl: data.publicUrl,
  });
  return data.publicUrl;
}

async function buildProductPayload(
  values: ProductFormValues,
  currentImageUrl?: string | null,
  currentGallery: ProductImageSlot[] = [],
): Promise<ProductPayload> {
  const nextGallery: ProductImageSlot[] = [];

  for (let index = 0; index < MAX_PRODUCT_IMAGES; index += 1) {
    const file = values.imageFiles[index];
    const manualUrl = values.imageUrls[index]?.trim() ?? '';
    const fallbackUrl = currentGallery[index]?.url ?? '';
    const url = file ? await uploadImageFile(file) : manualUrl || fallbackUrl;

    if (!url) {
      continue;
    }

    nextGallery.push({
      url,
      published: values.imagePublished[index] ?? currentGallery[index]?.published ?? false,
    });
  }

  const publishedUrls = nextGallery.filter((slot) => slot.published).map((slot) => slot.url);
  const imageUrl = publishedUrls[0] ?? nextGallery[0]?.url ?? values.imageUrl ?? currentImageUrl ?? null;

  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    price: Number(values.price),
    stock: Number(values.stock),
    sizes: sanitizeSizes(values.sizes),
    category: values.category.trim() || null,
    product_type: normalizeProductType(values.productType),
    image_url: imageUrl,
    image_urls: nextGallery.map((slot) => slot.url),
    image_gallery: nextGallery,
  };
}

function toBaseColumns(payload: ProductPayload) {
  return {
    name: payload.name,
    description: payload.description,
    price: Number(payload.price),
    stock: Number(payload.stock),
    sizes: sanitizeSizes(payload.sizes),
    image_url: payload.image_url,
    category: payload.category,
    product_type: normalizeProductType(payload.product_type),
  };
}

async function fetchProductsFromSupabase() {
  console.log('Admin products fetch:start', {
    operation: 'products.select',
    table: 'products',
  });
  const response = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  console.log('Admin products fetch:response', {
    operation: 'products.select',
    table: 'products',
    data: response.data ?? null,
    error: response.error ?? null,
  });

  if (response.error) {
    console.error('Admin products fetch:error', response.error);
    throw new Error(response.error.message);
  }

  const records = (response.data ?? []) as SupabaseProductRow[];
  console.log('Admin products fetch:success', { count: records.length });
  writeTinyCache(records.map((record) => String(record.id)));
  return records.map(normalizeProductRecord);
}

async function insertProductRow(payload: ProductPayload) {
  const imageGallery = sanitizeImageGallery(payload.image_gallery);
  const cleanSizes = sanitizeSizes(payload.sizes);
  const insertPayload = {
    name: payload.name.trim(),
    description: payload.description?.trim() || '',
    price: Number(payload.price),
    stock: Number(payload.stock),
    sizes: cleanSizes,
    image_url: payload.image_url || '',
    category: payload.category?.trim() || '',
    product_type: normalizeProductType(payload.product_type),
    image_gallery: imageGallery,
  };
  console.log('Saving product sizes:', cleanSizes);
  console.log('Admin product insert payload:', insertPayload);

  const response = await supabase.from('products').insert(insertPayload).select('*').single();

  if (response.error || !response.data) {
    throw new Error(response.error?.message ?? 'Unable to create product.');
  }

  return normalizeProductRecord(response.data as SupabaseProductRow);
}

async function syncProductGalleryMetadata(productId: string, payload: ProductPayload) {
  const imageGallery = sanitizeImageGallery(payload.image_gallery);
  const galleryPayload = {
    image_gallery: imageGallery,
  };

  console.log('Admin product gallery sync:start', {
    operation: 'products.update.gallery',
    table: 'products',
    productId,
    payload: galleryPayload,
  });

  const response = await supabase
    .from('products')
    .update(galleryPayload)
    .eq('id', productId)
    .select();

  console.log('Admin product gallery sync:response', {
    operation: 'products.update.gallery',
    table: 'products',
    productId,
    data: response.data ?? null,
    error: response.error ?? null,
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data?.[0] ? normalizeProductRecord(response.data[0] as SupabaseProductRow) : null;
}

async function updateProductRow(productId: string, payload: ProductPayload) {
  const imageGallery = sanitizeImageGallery(payload.image_gallery);
  const cleanSizes = sanitizeSizes(payload.sizes);
  const productUpdate = {
    name: payload.name.trim(),
    description: payload.description?.trim() || '',
    price: Number(payload.price),
    stock: Number(payload.stock),
    sizes: cleanSizes,
    image_url: payload.image_url || '',
    category: payload.category?.trim() || '',
    product_type: normalizeProductType(payload.product_type),
    image_gallery: imageGallery,
  };

  console.log('Saving product sizes:', cleanSizes);
  console.log('Admin product update payload:', {
    operation: 'products.update',
    table: 'products',
    productId,
    payload: productUpdate,
  });

  console.log('Admin product update:start', {
    operation: 'products.update',
    table: 'products',
    productId,
  });
  const response = await supabase
    .from('products')
    .update(productUpdate)
    .eq('id', productId)
    .select();
  console.log('Admin product update:response', {
    operation: 'products.update',
    table: 'products',
    productId,
    data: response.data ?? null,
    error: response.error ?? null,
  });

  if (response.error || !response.data?.[0]) {
    console.error('Admin product update:error', response.error);
    throw new Error(response.error?.message ?? 'Unable to update product.');
  }

  console.log('Admin product update:success', {
    productId,
    returnedId: response.data[0].id,
  });
  return normalizeProductRecord(response.data[0] as SupabaseProductRow);
}

function createSeedProducts(): ProductPayload[] {
  return storefrontCatalogSeed.map((product) => ({
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    image_url: product.image_url,
    image_urls: product.image_url ? [product.image_url] : [],
    image_gallery: product.image_url ? [{ url: product.image_url, published: true }] : [],
    category: product.category,
    product_type: 'sneakers',
  }));
}

function normalizeProductName(name: string) {
  return name.trim().toLowerCase();
}

export async function getProducts() {
  return fetchProductsFromSupabase();
}

export async function createProduct(values: ProductFormValues) {
  const payload = await buildProductPayload(values);
  let createdProduct = await insertProductRow(payload);
  if ((payload.image_gallery?.length ?? 0) > 0) {
    const gallerySyncedProduct = await syncProductGalleryMetadata(createdProduct.id, payload);
    if (gallerySyncedProduct) {
      createdProduct = gallerySyncedProduct;
    }
  }
  writeTinyCache([createdProduct.id]);
  return createdProduct;
}

export async function updateProduct(productId: string, values: ProductFormValues, currentImageUrl?: string | null) {
  console.log('Admin update flow:start', {
    productId,
    hasFiles: values.imageFiles.map((file) => Boolean(file)),
    imagePublished: values.imagePublished,
  });
  const products = await fetchProductsFromSupabase();
  const currentProduct = products.find((product) => product.id === productId);

  if (!currentProduct) {
    throw new Error('Product not found.');
  }

  const payload = await buildProductPayload(values, currentImageUrl, normalizeCurrentGallery(currentProduct));
  console.log('Admin update flow:normalized payload', {
    productId,
    image_url: payload.image_url,
    image_urls_count: payload.image_urls?.length ?? 0,
    image_gallery_count: payload.image_gallery?.length ?? 0,
  });
  let updatedProduct = await updateProductRow(productId, payload);
  if ((payload.image_gallery?.length ?? 0) > 0) {
    const gallerySyncedProduct = await syncProductGalleryMetadata(productId, payload);
    if (gallerySyncedProduct) {
      updatedProduct = gallerySyncedProduct;
    }
  }
  writeTinyCache([updatedProduct.id]);
  return updatedProduct;
}

export async function deleteProduct(productId: string) {
  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) {
    throw new Error(error.message);
  }

  writeTinyCache([productId]);
}

export async function importStorefrontCatalog() {
  const seedPayloads = createSeedProducts().map((product) => toBaseColumns(product));
  const { data: existingProducts, error: existingError } = await supabase
    .from('products')
    .select('id, name');

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingNames = new Set(
    ((existingProducts ?? []) as Array<{ id: string; name: string | null }>)
      .map((product) => product.name)
      .filter((name): name is string => Boolean(name))
      .map(normalizeProductName),
  );

  const missingSeedPayloads = seedPayloads.filter(
    (product) => !existingNames.has(normalizeProductName(product.name)),
  );

  if (missingSeedPayloads.length === 0) {
    writeTinyCache([]);
    return { inserted: 0, total: existingNames.size };
  }

  const { data, error } = await supabase.from('products').insert(missingSeedPayloads).select('id');

  if (error) {
    throw new Error(error.message);
  }

  const insertedIds = (data ?? []).map((row: { id: string }) => String(row.id));
  writeTinyCache(insertedIds);
  return { inserted: insertedIds.length, total: existingNames.size + insertedIds.length };
}
