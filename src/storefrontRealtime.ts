import { supabase } from './admin/services/supabaseClient';

console.log('STOREFRONT REALTIME MODULE LOADED');

declare global {
  interface Window {
    __DUBAE_PRODUCTS_REALTIME_INITIALIZED__?: boolean;
    __DUBAE_PRODUCTS_CHANNEL__?: ReturnType<typeof supabase.channel> | null;
    __DUBAE_REVIEWS_CHANNEL__?: ReturnType<typeof supabase.channel> | null;
    __DUBAE_PUBLIC_REFRESH_INITIALIZED__?: boolean;
    __DUBAE_PUBLIC_REFRESH_INTERVAL__?: number | null;
    refreshStorefrontProductsFromSupabase?: () => Promise<void>;
    refreshReviewProductsForDropdown?: () => Promise<void>;
    loadPublicApprovedReviews?: () => Promise<void>;
  }
}

async function refreshPublicStorefrontData() {
  console.log('Polling storefront refresh running');
  await Promise.allSettled([
    window.refreshStorefrontProductsFromSupabase?.(),
    window.refreshReviewProductsForDropdown?.(),
    window.loadPublicApprovedReviews?.(),
  ]);
}

function cleanupPublicStorefrontRealtime() {
  if (window.__DUBAE_PRODUCTS_CHANNEL__) {
    void supabase.removeChannel(window.__DUBAE_PRODUCTS_CHANNEL__);
    window.__DUBAE_PRODUCTS_CHANNEL__ = null;
  }
  if (window.__DUBAE_REVIEWS_CHANNEL__) {
    void supabase.removeChannel(window.__DUBAE_REVIEWS_CHANNEL__);
    window.__DUBAE_REVIEWS_CHANNEL__ = null;
  }
  if (window.__DUBAE_PUBLIC_REFRESH_INTERVAL__) {
    window.clearInterval(window.__DUBAE_PUBLIC_REFRESH_INTERVAL__);
    window.__DUBAE_PUBLIC_REFRESH_INTERVAL__ = null;
  }
  window.__DUBAE_PRODUCTS_REALTIME_INITIALIZED__ = false;
  window.__DUBAE_PUBLIC_REFRESH_INITIALIZED__ = false;
}

function initPublicStorefrontRealtime() {
  if (window.__DUBAE_PUBLIC_REFRESH_INITIALIZED__) return;
  window.__DUBAE_PUBLIC_REFRESH_INITIALIZED__ = true;
  window.__DUBAE_PRODUCTS_REALTIME_INITIALIZED__ = true;

  console.log('Storefront realtime functions available:', {
    refreshStorefrontProductsFromSupabase: Boolean(window.refreshStorefrontProductsFromSupabase),
    refreshReviewProductsForDropdown: Boolean(window.refreshReviewProductsForDropdown),
    loadPublicApprovedReviews: Boolean(window.loadPublicApprovedReviews),
  });

  void refreshPublicStorefrontData();

  const productsChannel = supabase
    .channel('public-products-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
      console.log('Realtime products change received', payload);
      void window.refreshStorefrontProductsFromSupabase?.();
      void window.refreshReviewProductsForDropdown?.();
    })
    .subscribe((status) => {
      console.log('Products realtime status:', status);
    });

  const reviewsChannel = supabase
    .channel('public-reviews-changes-fallback')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, (payload) => {
      console.log('Realtime reviews change received', payload);
      void window.loadPublicApprovedReviews?.();
    })
    .subscribe((status) => {
      console.log('Reviews realtime status:', status);
    });

  window.__DUBAE_PRODUCTS_CHANNEL__ = productsChannel;
  window.__DUBAE_REVIEWS_CHANNEL__ = reviewsChannel;
  window.__DUBAE_PUBLIC_REFRESH_INTERVAL__ = window.setInterval(() => {
    void refreshPublicStorefrontData();
  }, 20000);

  window.addEventListener('beforeunload', cleanupPublicStorefrontRealtime, { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPublicStorefrontRealtime, { once: true });
} else {
  initPublicStorefrontRealtime();
}
