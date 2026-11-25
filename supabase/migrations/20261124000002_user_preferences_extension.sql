-- ==============================================================================
-- YAARO PHASE 2: EXTENDED ONBOARDING PREFERENCES & STORAGE BUCKET MIGRATION
-- ==============================================================================

-- 1. Extend user_preferences to cover all 20 onboarding dimensions
ALTER TABLE public.user_preferences
    ADD COLUMN IF NOT EXISTS sleeping_schedule TEXT CHECK (sleeping_schedule IN ('early_bird', 'night_owl', 'flexible')) DEFAULT 'flexible',
    ADD COLUMN IF NOT EXISTS work_schedule TEXT CHECK (work_schedule IN ('wfh', 'office', 'hybrid', 'student')) DEFAULT 'hybrid',
    ADD COLUMN IF NOT EXISTS cleanliness_level INTEGER CHECK (cleanliness_level BETWEEN 1 AND 5) DEFAULT 4,
    ADD COLUMN IF NOT EXISTS social_lifestyle TEXT CHECK (social_lifestyle IN ('introvert', 'balanced', 'extrovert')) DEFAULT 'balanced',
    ADD COLUMN IF NOT EXISTS hobbies TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS privacy_hide_phone BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS privacy_hide_age BOOLEAN DEFAULT false;

-- 2. Ensure profiles has all presentation helpers
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS profile_completed_percentage INTEGER DEFAULT 25,
    ADD COLUMN IF NOT EXISTS onboarded BOOLEAN DEFAULT false;

-- 3. Storage Bucket Definition for Avatars & User Photos (Supabase Storage)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 4. Storage Security Policies for Avatars
CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update their own avatar"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own avatar"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );
