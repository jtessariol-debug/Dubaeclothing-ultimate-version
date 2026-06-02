import { supabase } from './supabaseClient';
import type { ReviewRecord } from '../types';

function normalizeReviewStatus(status: string | null | undefined) {
  const normalized = String(status ?? '').trim().toLowerCase();
  if (normalized === 'approved' || normalized === 'published') {
    return 'approved';
  }
  if (normalized === 'declined' || normalized === 'rejected') {
    return 'declined';
  }
  return 'pending';
}

function normalizeReview(record: ReviewRecord): ReviewRecord {
  const normalizedStatus = normalizeReviewStatus(record.status);
  return {
    ...record,
    product_id: record.product_id ?? null,
    status: normalizedStatus,
    approved: normalizedStatus === 'approved',
    created_at: record.created_at ?? null,
  };
}

function sortByCreatedAtDesc(a: ReviewRecord, b: ReviewRecord) {
  return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
}

export async function getReviews() {
  const { data: pendingData, error: pendingError } = await supabase
    .from('reviews')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  console.log('Pending reviews loaded:', pendingData);
  console.error('Admin reviews load error:', pendingError);
  if (pendingError) {
    throw new Error(pendingError.message);
  }

  const { data: approvedData, error: approvedError } = await supabase
    .from('reviews')
    .select('*')
    .in('status', ['approved', 'published'])
    .order('created_at', { ascending: false });

  console.log('Approved reviews loaded:', approvedData);
  console.error('Admin reviews load error:', approvedError);
  if (approvedError) {
    throw new Error(approvedError.message);
  }

  const { data: declinedData, error: declinedError } = await supabase
    .from('reviews')
    .select('*')
    .in('status', ['declined', 'rejected'])
    .order('created_at', { ascending: false });

  console.log('Declined reviews loaded:', declinedData);
  console.error('Admin reviews load error:', declinedError);
  if (declinedError) {
    throw new Error(declinedError.message);
  }

  return [
    ...((pendingData ?? []) as ReviewRecord[]),
    ...((approvedData ?? []) as ReviewRecord[]),
    ...((declinedData ?? []) as ReviewRecord[]),
  ]
    .map(normalizeReview)
    .sort(sortByCreatedAtDesc);
}

export async function approveReview(reviewId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .update({ status: 'approved' })
    .eq('id', reviewId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Unable to approve review.');
  }

  return normalizeReview(data as ReviewRecord);
}

export async function declineReview(reviewId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .update({ status: 'declined' })
    .eq('id', reviewId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Unable to decline review.');
  }

  return normalizeReview(data as ReviewRecord);
}

export async function deleteReview(reviewId: string) {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId);

  if (error) {
    console.error('Delete review error:', error);
    throw new Error(error.message);
  }
}
