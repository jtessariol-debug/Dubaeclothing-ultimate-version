export type ProductImageSlot = {
  url: string;
  published: boolean;
};

export type ProductSizeRecord = {
  size: string;
  stock: number;
};

export type OrderItemRecord = {
  name: string;
  size?: string;
  qty: number;
  price: number;
};

export type ProductRecord = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  sizes?: ProductSizeRecord[];
  image_url: string | null;
  image_urls?: string[];
  image_gallery?: ProductImageSlot[];
  category: string | null;
  product_type?: string | null;
  created_at: string;
};

export type ProductFormValues = {
  name: string;
  description: string;
  price: string;
  stock: string;
  sizes: ProductSizeRecord[];
  category: string;
  productType: string;
  imageFiles: Array<File | null>;
  imageUrl: string;
  imageUrls: string[];
  imagePublished: boolean[];
};

export type AdminUserRole = 'admin' | 'user' | 'unknown';

export type OrderRecord = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items: OrderItemRecord[];
  total: number;
  currency: string;
  status: string;
  payment_source: string | null;
  payment_mode: string | null;
  paypal_order_id: string | null;
  paypal_capture_id: string | null;
  created_at: string;
};

export type ReviewRecord = {
  id: string;
  product_id: string | null;
  full_name: string;
  email: string;
  rating: number;
  review: string;
  status: string;
  approved?: boolean;
  created_at: string | null;
  products?: {
    name: string | null;
  } | null;
};
