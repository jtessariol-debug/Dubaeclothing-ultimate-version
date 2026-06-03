import { supabase } from './admin/services/supabaseClient';

declare global {
  interface Window {
    __DUBAE_PRODUCTS_REALTIME_INITIALIZED__?: boolean;
    __DUBAE_PRODUCTS_CHANNEL__?: ReturnType<typeof supabase.channel> | null;
    refreshStorefrontProductsFromSupabase?: () => Promise<void>;
    refreshReviewProductsForDropdown?: () => Promise<void>;
  }
}

function cleanupProductsRealtime() {
  if (window.__DUBAE_PRODUCTS_CHANNEL__) {
    void supabase.removeChannel(window.__DUBAE_PRODUCTS_CHANNEL__);
    window.__DUBAE_PRODUCTS_CHANNEL__ = null;
  }
  window.__DUBAE_PRODUCTS_REALTIME_INITIALIZED__ = false;
}

function initProductsRealtime() {
  if (window.__DUBAE_PRODUCTS_REALTIME_INITIALIZED__) return;
  window.__DUBAE_PRODUCTS_REALTIME_INITIALIZED__ = true;

  const channel = supabase
    .channel('public-products-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
      console.log('Realtime products change received');
      void window.refreshStorefrontProductsFromSupabase?.();
      void window.refreshReviewProductsForDropdown?.();
    })
    .subscribe();

  window.__DUBAE_PRODUCTS_CHANNEL__ = channel;

  window.addEventListener('beforeunload', cleanupProductsRealtime, { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProductsRealtime, { once: true });
} else {
  initProductsRealtime();
}
