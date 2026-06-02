import { useEffect, useMemo, useState } from 'react';
import { approveReview, declineReview, deleteReview, getReviews } from '../services/reviewsAdminService';
import type { ReviewRecord } from '../types';

function getReviewGroup(status: string) {
  if (status === 'approved') {
    return 'approved';
  }
  if (status === 'declined') {
    return 'declined';
  }
  return 'pending';
}

function renderStars(rating: number) {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
  return `${'★'.repeat(safeRating)}${'☆'.repeat(5 - safeRating)}`;
}

export function ReviewsManager() {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function loadReviews() {
    setLoading(true);
    try {
      const data = await getReviews();
      setReviews(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load reviews.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReviews();
  }, []);

  const pendingReviews = useMemo(() => reviews.filter((review) => getReviewGroup(review.status) === 'pending'), [reviews]);
  const approvedReviews = useMemo(() => reviews.filter((review) => getReviewGroup(review.status) === 'approved'), [reviews]);
  const declinedReviews = useMemo(() => reviews.filter((review) => getReviewGroup(review.status) === 'declined'), [reviews]);

  async function handleApprove(reviewId: string) {
    try {
      await approveReview(reviewId);
      await loadReviews();
      setFeedback('Review approved.');
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Unable to approve review.');
    }
  }

  async function handleDecline(reviewId: string) {
    try {
      await declineReview(reviewId);
      await loadReviews();
      setFeedback('Review declined.');
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Unable to decline review.');
    }
  }

  async function handleDelete(reviewId: string) {
    const confirmed = window.confirm('¿Seguro que quieres borrar este review definitivamente?');
    if (!confirmed) {
      return;
    }

    try {
      await deleteReview(reviewId);
      await loadReviews();
      setFeedback('Review borrado correctamente.');
    } catch (err) {
      console.error('Delete review error:', err);
      setFeedback('No se pudo borrar el review.');
    }
  }

  function renderReviewSection(title: string, items: ReviewRecord[], emptyMessage: string) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.25em] text-slate-400">
            {items.length}
          </span>
        </div>

        {!items.length ? (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/60 p-6 text-center text-slate-400">
            {emptyMessage}
          </div>
        ) : null}

        {items.map((review) => (
          <article key={review.id} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-sky-400">{getReviewGroup(review.status)}</p>
                <h3 className="mt-2 text-xl font-semibold text-white">{review.full_name}</h3>
                <p className="mt-2 text-sm text-slate-400">{review.email}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Producto: {review.products?.name ?? review.product_id ?? 'Review general'}
                </p>
              </div>
              <div className="text-left lg:text-right">
                <p className="text-lg font-semibold text-white">{renderStars(review.rating)}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {review.created_at ? new Date(review.created_at).toLocaleString() : 'Sin fecha'}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm leading-relaxed text-slate-200">
              {review.review}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {getReviewGroup(review.status) !== 'approved' ? (
                <button
                  type="button"
                  onClick={() => void handleApprove(review.id)}
                  className="rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
                >
                  Approve
                </button>
              ) : null}
              {getReviewGroup(review.status) !== 'declined' ? (
                <button
                  type="button"
                  onClick={() => void handleDecline(review.id)}
                  className="rounded-full border border-amber-500/30 px-5 py-3 text-sm font-medium text-amber-200 transition hover:border-amber-400 hover:text-white"
                >
                  Decline
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void handleDelete(review.id)}
                className="rounded-full border border-rose-500/30 px-5 py-3 text-sm font-medium text-rose-200 transition hover:border-rose-400 hover:text-white"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-sky-400">Reviews</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Reviews manager</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-400">
          Approve or decline public reviews before they appear on the storefront.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <p className="text-sm text-slate-400">Pending reviews</p>
          <p className="mt-4 text-4xl font-semibold text-white">{pendingReviews.length}</p>
        </section>
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <p className="text-sm text-slate-400">Approved reviews</p>
          <p className="mt-4 text-4xl font-semibold text-white">{approvedReviews.length}</p>
        </section>
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <p className="text-sm text-slate-400">Declined reviews</p>
          <p className="mt-4 text-4xl font-semibold text-white">{declinedReviews.length}</p>
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

      {loading ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-slate-300">Loading reviews...</div>
      ) : null}

      {!loading ? (
        <div className="space-y-8">
          {renderReviewSection('Pending', pendingReviews, 'No pending reviews.')}
          {renderReviewSection('Approved', approvedReviews, 'No approved reviews.')}
          {renderReviewSection('Declined', declinedReviews, 'No declined reviews.')}
        </div>
      ) : null}
    </div>
  );
}
