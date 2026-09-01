-- Trusted Places Table Schema & Row Level Security (RLS) Policies
-- Run this in your Supabase SQL Editor if the table has not yet been created.

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.trusted_places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    place_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Home', 'College', 'School', 'Work', 'Friend''s House', 'Relative''s House', 'Other')),
    formatted_address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_trusted_places_user_id ON public.trusted_places(user_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.trusted_places ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: Ensure users can ONLY access & manage their own saved places
CREATE POLICY "Users can select own trusted places"
    ON public.trusted_places
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trusted places"
    ON public.trusted_places
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trusted places"
    ON public.trusted_places
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trusted places"
    ON public.trusted_places
    FOR DELETE
    USING (auth.uid() = user_id);
