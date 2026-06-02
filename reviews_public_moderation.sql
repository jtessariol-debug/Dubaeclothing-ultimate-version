ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
CHECK (status IN ('pending', 'approved', 'published', 'rejected', 'declined'));

ALTER TABLE public.reviews
ALTER COLUMN product_id DROP NOT NULL;

DROP POLICY IF EXISTS "Anyone can insert pending reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can read approved reviews" ON public.reviews;

CREATE POLICY "Anyone can insert pending reviews"
ON public.reviews
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'pending'
  AND rating >= 1
  AND rating <= 5
  AND full_name IS NOT NULL
  AND email IS NOT NULL
  AND review IS NOT NULL
);

CREATE POLICY "Anyone can read approved reviews"
ON public.reviews
FOR SELECT
TO anon, authenticated
USING (
  status IN ('approved', 'published')
);

-- IMPORTANT:
-- The current storefront/admin identifies admins with Firebase Auth, not Supabase Auth.
-- Supabase RLS cannot securely recognize Firebase admin state from this frontend anon key alone.
-- For secure approve/decline policies in SQL, move admin moderation to a backend or Supabase-authenticated path.
