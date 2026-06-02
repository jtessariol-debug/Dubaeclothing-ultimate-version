import { supabase } from './admin/services/supabaseClient';

type RawReview = {
  id: string | number;
  product_id: string | null;
  full_name: string;
  email: string;
  rating: number | string;
  review: string;
  status: string;
  created_at?: string | null;
};

type ReviewRecord = {
  id: string;
  productId: string | null;
  product_id: string | null;
  fullName: string;
  full_name: string;
  email: string;
  rating: number;
  comment: string;
  review: string;
  status: string;
  approved: boolean;
  createdAt: string | null;
  created_at: string | null;
};

type ReviewProduct = {
  id: string;
  name: string;
  brand: string;
};

declare global {
  interface Window {
    i18n: Record<string, Record<string, string>>;
    currentReviewRating?: number;
    currentHomeReviewRating?: number;
    latestApprovedReviews?: ReviewRecord[];
    reviewsUnsubscribe?: (() => void) | null;
    currentUser?: { displayName?: string } | null;
    ReviewService: {
      addReview: (reviewData: {
        product_id: string | null;
        full_name: string;
        email: string;
        rating: number;
        review: string;
      }) => Promise<{ success: boolean }>;
      subscribeToApprovedReviews: (productId: string | null, callback: (reviews: ReviewRecord[]) => void) => () => void;
      subscribeToRecentApprovedReviews: (callback: (reviews: ReviewRecord[]) => void) => () => void;
      getPendingReviews: () => Promise<ReviewRecord[]>;
      approveReview: (reviewId: string) => Promise<unknown>;
      declineReview: (reviewId: string) => Promise<unknown>;
      deleteReview?: (reviewId: string) => Promise<unknown>;
    };
    renderHomeReviewsSection?: (reviews: ReviewRecord[]) => void;
    refreshReviewProductsForDropdown?: () => Promise<void>;
    loadPublicApprovedReviews?: () => Promise<void>;
    subscribeToHomepageReviews?: () => void;
    submitReview?: (productId?: string | number | null) => Promise<void>;
    submitHomeReview?: () => Promise<void>;
    setReviewRating?: (value: number) => void;
    setHomeReviewRating?: (value: number) => void;
    initPublicReviews?: () => Promise<void>;
    getStorefrontProductById?: (productId: string | number | null | undefined) => { id?: string | number; name?: string; brand?: string } | null;
    showToast?: (message: string) => void;
    openDetail?: (productId: string | number) => void;
  }
}

const REVIEW_FIELDS = 'id, product_id, full_name, email, rating, review, status, created_at';

let reviewProducts: ReviewProduct[] = [];
let reviewProductsLoadMessage = '';
let initialized = false;

function getCurrentLang(): string {
  return localStorage.getItem('dubae_lang') || 'en';
}

function getTranslation(key: string, fallback = ''): string {
  return window.i18n?.[key]?.[getCurrentLang()] ?? fallback;
}

function showToast(message: string): void {
  window.showToast?.(message);
}

function normalizeReviewRecord(review: RawReview): ReviewRecord {
  const status = String(review?.status ?? '').trim().toLowerCase() || 'pending';
  const productId = review?.product_id == null ? null : String(review.product_id);
  const fullName = String(review?.full_name ?? '').trim();
  const createdAt = review?.created_at ?? null;

  return {
    id: String(review.id),
    productId,
    product_id: productId,
    fullName,
    full_name: fullName,
    email: String(review?.email ?? '').trim(),
    rating: Number(review?.rating) || 0,
    comment: String(review?.review ?? ''),
    review: String(review?.review ?? ''),
    status,
    approved: status === 'approved' || status === 'published',
    createdAt,
    created_at: createdAt,
  };
}

function normalizeSelectedProductId(value: string | number | null | undefined): string | null {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

function getProductById(productId: string | null | undefined) {
  if (!productId) return null;

  const reviewProduct = reviewProducts.find((product) => product.id === String(productId));
  if (reviewProduct) return reviewProduct;

  return window.getStorefrontProductById?.(productId) ?? null;
}

function renderStars(rating: number): string {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
  return `${'★'.repeat(safeRating)}${'☆'.repeat(5 - safeRating)}`;
}

function formatReviewDate(createdAt: string | null | undefined): string {
  if (!createdAt) return getTranslation('lbl_just_now', 'Just now');

  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) return getTranslation('lbl_just_now', 'Just now');

  return parsed.toLocaleDateString();
}

function renderReviewProductOptions(): string {
  if (!reviewProducts.length) {
    return `<option value="">${reviewProductsLoadMessage || 'No hay productos disponibles para review.'}</option>`;
  }

  const placeholder = getTranslation('reviews_select_product_optional', 'Select a product (optional)');
  return [
    `<option value="">${placeholder}</option>`,
    ...reviewProducts.map((product) => `<option value="${product.id}">${product.name}</option>`),
  ].join('');
}

function setHomeReviewRating(value: number): void {
  window.currentHomeReviewRating = value;
  for (let index = 1; index <= 5; index += 1) {
    const element = document.getElementById(`home-star-${index}`);
    if (!element) continue;

    if (index <= value) element.classList.add('active', 'text-dubae-gold');
    else element.classList.remove('active', 'text-dubae-gold');
  }
}

function setReviewRating(value: number): void {
  window.currentReviewRating = value;
  for (let index = 1; index <= 5; index += 1) {
    const element = document.getElementById(`star-${index}`);
    if (!element) continue;

    if (index <= value) element.classList.add('active', 'text-dubae-gold');
    else element.classList.remove('active', 'text-dubae-gold');
  }
}

async function refreshReviewProductsForDropdown(): Promise<void> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, stock, image_url')
    .order('name', { ascending: true });

  console.log('PUBLIC PRODUCTS DATA:', data);
  console.error('PUBLIC PRODUCTS ERROR:', error);

  if (error) {
    reviewProducts = [];
    reviewProductsLoadMessage = 'No pudimos cargar los productos.';
    return;
  }

  reviewProducts = Array.isArray(data)
    ? data
        .map((product) => ({
          id: String(product?.id ?? '').trim(),
          name: String(product?.name ?? '').trim(),
          brand: '',
        }))
        .filter((product) => product.id && product.name)
    : [];

  reviewProductsLoadMessage = reviewProducts.length ? '' : 'No hay productos disponibles para review.';
}

async function loadPublicApprovedReviews(): Promise<void> {
  const { data, error } = await supabase
    .from('reviews')
    .select(REVIEW_FIELDS)
    .in('status', ['approved', 'published'])
    .order('created_at', { ascending: false });

  console.log('PUBLIC REVIEWS DATA:', data);
  console.error('PUBLIC REVIEWS ERROR:', error);

  window.latestApprovedReviews = error || !Array.isArray(data) ? [] : data.map(normalizeReviewRecord);
  renderHomeReviewsSection(window.latestApprovedReviews);
}

function renderHomeReviewsSection(reviews: ReviewRecord[]): void {
  window.latestApprovedReviews = Array.isArray(reviews) ? reviews : [];

  const summary = document.getElementById('reviews-summary');
  const form = document.getElementById('home-review-form');
  const grid = document.getElementById('recent-reviews-grid');
  if (!summary || !form || !grid) return;

  const publishedCount = window.latestApprovedReviews.length;
  summary.textContent = publishedCount
    ? `${publishedCount} ${getTranslation('reviews_summary_count', 'reviews published')}`
    : getTranslation('reviews_summary_zero', 'No reviews yet');

  form.innerHTML = `
    <p class="text-[10px] font-bold uppercase tracking-[0.34em] text-dubae-gold">${getTranslation('reviews_form_title', 'Drop your review')}</p>
    <h3 class="mt-3 max-w-xl font-serif text-2xl italic leading-tight text-black dark:text-white">${getTranslation('reviews_form_copy', 'Pick your product, drop your take, and tell us if the piece arrived strong.')}</h3>
    <div class="mt-6 space-y-4">
      <select id="home-review-product" class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-dubae-gold dark:border-gray-700 dark:bg-black dark:text-white" ${reviewProducts.length ? '' : 'disabled'}>
        ${renderReviewProductOptions()}
      </select>
      <input id="home-review-name" type="text" placeholder="${getTranslation('reviews_home_name_placeholder', 'Your name')}" class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-dubae-gold dark:border-gray-700 dark:bg-black dark:text-white">
      <input id="home-review-email" type="email" placeholder="${getTranslation('reviews_home_email_placeholder', 'Your email')}" class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-dubae-gold dark:border-gray-700 dark:bg-black dark:text-white">
      <div class="flex gap-2 text-2xl">
        ${[1, 2, 3, 4, 5].map((index) => `<button type="button" id="home-star-${index}" class="star-input ${index <= (window.currentHomeReviewRating || 5) ? 'active text-dubae-gold' : ''}" onclick="window.setHomeReviewRating(${index})">★</button>`).join('')}
      </div>
      <textarea id="home-review-comment" rows="4" placeholder="${getTranslation('reviews_home_comment_placeholder', 'Tell us how it fit, what you bought, and how the quality felt...')}" class="w-full rounded-[1.5rem] border border-gray-200 bg-white p-4 text-sm outline-none transition focus:border-dubae-gold resize-none dark:border-gray-700 dark:bg-black dark:text-white"></textarea>
      <button onclick="window.submitHomeReview()" class="w-full rounded-full bg-black px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.24em] text-white shadow-[0_16px_40px_rgba(0,0,0,0.16)] transition duration-300 hover:-translate-y-0.5 hover:bg-dubae-gold hover:text-black hover:shadow-[0_22px_48px_rgba(212,175,55,0.22)] dark:bg-white dark:text-black dark:hover:bg-dubae-gold">
        ${getTranslation('reviews_home_submit', 'Drop Review')}
      </button>
    </div>
  `;

  if (!window.latestApprovedReviews.length) {
    grid.innerHTML = `
      <div class="md:col-span-2 xl:col-span-3 rounded-[1.75rem] border border-dashed border-gray-200 bg-gray-50/80 px-6 py-12 text-center text-sm leading-relaxed text-gray-500 dark:border-gray-800 dark:bg-[#0f0f0f] dark:text-gray-400">
        ${getTranslation('reviews_empty', 'No published reviews yet. Be the first to say how the flow landed.')}
      </div>
    `;
    setHomeReviewRating(window.currentHomeReviewRating || 5);
    return;
  }

  grid.innerHTML = window.latestApprovedReviews.slice(0, 6).map((review) => {
    const product = getProductById(review.product_id ?? review.productId);
    const productLabel = review.product_id ? product?.name || 'Review general' : 'Review general';
    const productMeta = review.product_id ? product?.brand || 'Review general' : 'Review general';
    const createdLabel = formatReviewDate(review.created_at ?? review.createdAt);
    const reviewId = product?.id;

    return `
      <article class="h-full rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:border-dubae-gold hover:shadow-[0_22px_55px_rgba(15,23,42,0.1)] dark:border-gray-800 dark:bg-[#111]">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-400">${productMeta}</p>
            <h4 class="mt-2 text-sm font-semibold leading-snug text-black dark:text-white">${productLabel}</h4>
          </div>
          <span class="text-[10px] text-gray-400">${createdLabel}</span>
        </div>
        <div class="mt-4 flex text-dubae-gold text-sm">${renderStars(review.rating)}</div>
        <p class="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">"${review.review}"</p>
        <div class="mt-5 flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <div class="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-[10px] font-bold uppercase text-black dark:border-gray-700 dark:bg-black dark:text-white">${(review.full_name || '?').slice(0, 1)}</div>
            <span class="text-xs font-bold text-black dark:text-white">${review.full_name}</span>
          </div>
          ${reviewId ? `<button onclick="window.openDetail?.(${JSON.stringify(reviewId)})" class="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 transition hover:text-dubae-gold dark:text-gray-300">${getTranslation('reviews_view_product', 'View product')}</button>` : ''}
        </div>
      </article>
    `;
  }).join('');

  setHomeReviewRating(window.currentHomeReviewRating || 5);
}

function subscribeToHomepageReviews(): void {
  void loadPublicApprovedReviews();
}

async function addReview(reviewData: {
  product_id: string | null;
  full_name: string;
  email: string;
  rating: number;
  review: string;
}): Promise<{ success: boolean }> {
  const { error } = await supabase.from('reviews').insert({
    product_id: reviewData.product_id || null,
    full_name: reviewData.full_name,
    email: reviewData.email,
    rating: reviewData.rating,
    review: reviewData.review,
    status: 'pending',
  });

  if (error) {
    console.error('Review insert error:', error);
    return { success: false };
  }

  return { success: true };
}

async function submitReview(productId?: string | number | null): Promise<void> {
  const normalizedProductId = normalizeSelectedProductId(productId);
  const fullName = (document.getElementById('review-full-name') as HTMLInputElement | null)?.value || '';
  const email = (document.getElementById('review-email') as HTMLInputElement | null)?.value || '';
  const comment = (document.getElementById('review-comment') as HTMLTextAreaElement | null)?.value || '';
  const rating = window.currentReviewRating || 0;

  if (!fullName.trim()) {
    showToast('Please enter your full name');
    return;
  }
  if (!email.trim()) {
    showToast('Please enter your email');
    return;
  }
  if (!comment.trim()) {
    showToast('Please write a comment');
    return;
  }
  if (!Number.isFinite(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
    showToast('Please select a star rating');
    return;
  }

  const submitButton = document.querySelector('#review-form button') as HTMLButtonElement | null;
  const originalText = submitButton?.innerText || '';
  if (submitButton) {
    submitButton.innerText = 'Sending...';
    submitButton.disabled = true;
  }

  const result = await addReview({
    product_id: normalizedProductId,
    full_name: fullName.trim(),
    email: email.trim(),
    rating,
    review: comment.trim(),
  });

  if (result.success) {
    const formContainer = document.getElementById('review-form');
    if (formContainer) {
      formContainer.innerHTML = `
        <div class="text-center py-6 animate-fade-in">
          <svg class="w-12 h-12 text-dubae-gold mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <p class="text-sm font-bold text-black dark:text-white uppercase tracking-widest">Review enviada</p>
          <p class="text-xs text-gray-500 mt-2">La publicaremos después de revisarla.</p>
        </div>
      `;
    }
    showToast('Tu review fue enviada. La publicaremos después de revisarla.');
    return;
  }

  showToast('No pudimos enviar tu review ahora. Inténtalo de nuevo en unos minutos.');
  if (submitButton) {
    submitButton.innerText = originalText;
    submitButton.disabled = false;
  }
}

async function submitHomeReview(): Promise<void> {
  const selectedProductId = normalizeSelectedProductId((document.getElementById('home-review-product') as HTMLSelectElement | null)?.value);
  const fullName = (document.getElementById('home-review-name') as HTMLInputElement | null)?.value || '';
  const email = (document.getElementById('home-review-email') as HTMLInputElement | null)?.value || '';
  const comment = (document.getElementById('home-review-comment') as HTMLTextAreaElement | null)?.value || '';
  const rating = window.currentHomeReviewRating || 0;

  if (!fullName.trim()) {
    showToast('Please enter your full name');
    return;
  }
  if (!email.trim()) {
    showToast('Please enter your email');
    return;
  }
  if (!comment.trim()) {
    showToast('Please write a comment');
    return;
  }
  if (!Number.isFinite(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
    showToast('Please select a star rating');
    return;
  }

  const submitButton = document.querySelector('#home-review-form button') as HTMLButtonElement | null;
  const originalText = submitButton?.innerText || '';
  if (submitButton) {
    submitButton.innerText = 'Sending...';
    submitButton.disabled = true;
  }

  const result = await addReview({
    product_id: selectedProductId,
    full_name: fullName.trim(),
    email: email.trim(),
    rating,
    review: comment.trim(),
  });

  if (result.success) {
    renderHomeReviewsSection(window.latestApprovedReviews || []);
    showToast('Tu review fue enviada. La publicaremos después de revisarla.');
    return;
  }

  showToast('No pudimos enviar tu review ahora. Inténtalo de nuevo en unos minutos.');
  if (submitButton) {
    submitButton.innerText = originalText;
    submitButton.disabled = false;
  }
}

async function getPendingReviews(): Promise<ReviewRecord[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(REVIEW_FIELDS)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('PUBLIC REVIEWS ERROR:', error);
    return [];
  }

  return Array.isArray(data) ? data.map(normalizeReviewRecord) : [];
}

async function approveReview(reviewId: string): Promise<unknown> {
  const { data, error } = await supabase.from('reviews').update({ status: 'approved' }).eq('id', reviewId).select();
  if (error) throw error;
  return data;
}

async function declineReview(reviewId: string): Promise<unknown> {
  const { data, error } = await supabase.from('reviews').update({ status: 'declined' }).eq('id', reviewId).select();
  if (error) throw error;
  return data;
}

async function deleteReview(reviewId: string): Promise<unknown> {
  const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
  if (error) throw error;
  return { success: true };
}

function subscribeToApprovedReviews(productId: string | null, callback: (reviews: ReviewRecord[]) => void): () => void {
  if (!productId) {
    callback([]);
    return () => {};
  }

  void supabase
    .from('reviews')
    .select(REVIEW_FIELDS)
    .eq('product_id', productId)
    .in('status', ['approved', 'published'])
    .order('created_at', { ascending: false })
    .then(({ data, error }) => {
      if (error) {
        console.error('PUBLIC REVIEWS ERROR:', error);
        callback([]);
        return;
      }

      callback(Array.isArray(data) ? data.map(normalizeReviewRecord) : []);
    });

  return () => {};
}

function subscribeToRecentApprovedReviews(callback: (reviews: ReviewRecord[]) => void): () => void {
  void loadPublicApprovedReviews().then(() => callback(window.latestApprovedReviews || []));
  return () => {};
}

async function initPublicReviews(): Promise<void> {
  if (initialized) return;
  initialized = true;

  console.log('PUBLIC REVIEWS MODULE LOADED');
  window.latestApprovedReviews = window.latestApprovedReviews || [];
  window.reviewsUnsubscribe = window.reviewsUnsubscribe || null;

  window.ReviewService = {
    addReview,
    subscribeToApprovedReviews,
    subscribeToRecentApprovedReviews,
    getPendingReviews,
    approveReview,
    declineReview,
    deleteReview,
  };
  window.setReviewRating = setReviewRating;
  window.setHomeReviewRating = setHomeReviewRating;
  window.submitReview = submitReview;
  window.submitHomeReview = submitHomeReview;
  window.renderHomeReviewsSection = renderHomeReviewsSection;
  window.refreshReviewProductsForDropdown = refreshReviewProductsForDropdown;
  window.loadPublicApprovedReviews = loadPublicApprovedReviews;
  window.subscribeToHomepageReviews = subscribeToHomepageReviews;
  window.initPublicReviews = initPublicReviews;

  window.currentReviewRating = window.currentReviewRating || 5;
  window.currentHomeReviewRating = window.currentHomeReviewRating || 5;

  await refreshReviewProductsForDropdown();
  await loadPublicApprovedReviews();
}

window.initPublicReviews = initPublicReviews;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void initPublicReviews();
  });
} else {
  void initPublicReviews();
}
