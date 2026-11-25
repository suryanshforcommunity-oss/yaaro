-- ==============================================================================
-- YAARO Master Schema Migration
-- Shared-Living Platform: Roommate Discovery, Compatibility, Rooms & Expenses
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    bio TEXT,
    age INTEGER CHECK (age >= 18 AND age <= 100),
    gender TEXT,
    occupation TEXT,
    city TEXT NOT NULL DEFAULT 'Bengaluru',
    budget_min NUMERIC(10, 2),
    budget_max NUMERIC(10, 2),
    preferred_location TEXT,
    move_in_date DATE,
    verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified')),
    is_looking_for_room BOOLEAN NOT NULL DEFAULT true,
    is_looking_for_roommate BOOLEAN NOT NULL DEFAULT true
);

-- 3. Roommate Compatibility Profiles Table
CREATE TABLE IF NOT EXISTS public.compatibility_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    cleanliness_level INTEGER NOT NULL CHECK (cleanliness_level BETWEEN 1 AND 5),
    sleep_schedule TEXT NOT NULL CHECK (sleep_schedule IN ('early_bird', 'night_owl', 'flexible')),
    social_habit TEXT NOT NULL CHECK (social_habit IN ('introvert', 'balanced', 'extrovert')),
    guest_policy TEXT NOT NULL CHECK (guest_policy IN ('never', 'weekends', 'anytime_with_notice')),
    smoking_policy TEXT NOT NULL CHECK (smoking_policy IN ('non_smoker', 'outside_only', 'smoker')),
    drinking_habit TEXT NOT NULL CHECK (drinking_habit IN ('non_drinker', 'socially', 'regular')),
    food_preference TEXT NOT NULL CHECK (food_preference IN ('vegetarian', 'vegan', 'non_vegetarian', 'any')),
    pet_friendly BOOLEAN NOT NULL DEFAULT true,
    work_style TEXT NOT NULL CHECK (work_style IN ('wfh', 'office', 'hybrid')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_compatibility_user UNIQUE (user_id)
);

-- 4. Room Listings Table
CREATE TABLE IF NOT EXISTS public.room_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    rent_amount NUMERIC(10, 2) NOT NULL,
    deposit_amount NUMERIC(10, 2) NOT NULL,
    city TEXT NOT NULL,
    area TEXT NOT NULL,
    full_address TEXT,
    property_type TEXT NOT NULL CHECK (property_type IN ('apartment', 'independent_house', 'villa', 'pg')),
    room_type TEXT NOT NULL CHECK (room_type IN ('private', 'shared')),
    attached_bathroom BOOLEAN NOT NULL DEFAULT false,
    available_from DATE NOT NULL,
    furnishing_status TEXT NOT NULL CHECK (furnishing_status IN ('fully_furnished', 'semi_furnished', 'unfurnished')),
    amenities TEXT[] NOT NULL DEFAULT '{}',
    photos TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'occupied'))
);

-- 5. Listing Applications / Inquiries
CREATE TABLE IF NOT EXISTS public.listing_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    listing_id UUID NOT NULL REFERENCES public.room_listings(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    CONSTRAINT uq_listing_applicant UNIQUE (listing_id, applicant_id)
);

-- 6. Shared Expense Groups Table
CREATE TABLE IF NOT EXISTS public.expense_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    members UUID[] NOT NULL DEFAULT '{}'
);

-- 7. Shared Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    group_id UUID NOT NULL REFERENCES public.expense_groups(id) ON DELETE CASCADE,
    paid_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('rent', 'groceries', 'utilities', 'wifi', 'maid', 'other')),
    split_among UUID[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'settled'))
);

-- 8. Community Discussion Posts
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    city TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('roommate_search', 'sublet', 'furniture_swap', 'neighbourhood_advice', 'general')),
    likes_count INTEGER NOT NULL DEFAULT 0
);

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- ==============================================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compatibility_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Compatibility Profiles Policies
CREATE POLICY "Compatibility profiles viewable by authenticated users"
    ON public.compatibility_profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert their own compatibility profile"
    ON public.compatibility_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own compatibility profile"
    ON public.compatibility_profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Room Listings Policies
CREATE POLICY "Available listings viewable by everyone"
    ON public.room_listings FOR SELECT
    USING (status = 'available' OR auth.uid() = host_id);

CREATE POLICY "Hosts can create room listings"
    ON public.room_listings FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their own room listings"
    ON public.room_listings FOR UPDATE
    USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their own room listings"
    ON public.room_listings FOR DELETE
    USING (auth.uid() = host_id);

-- Listing Applications Policies
CREATE POLICY "Users can view applications they made or received"
    ON public.listing_applications FOR SELECT
    TO authenticated
    USING (
        auth.uid() = applicant_id 
        OR auth.uid() IN (SELECT host_id FROM public.room_listings WHERE id = listing_id)
    );

CREATE POLICY "Authenticated users can submit applications"
    ON public.listing_applications FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = applicant_id);

-- Expense Groups Policies
CREATE POLICY "Members can view their expense groups"
    ON public.expense_groups FOR SELECT
    TO authenticated
    USING (auth.uid() = ANY(members) OR auth.uid() = created_by);

CREATE POLICY "Authenticated users can create expense groups"
    ON public.expense_groups FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group members can update group details"
    ON public.expense_groups FOR UPDATE
    TO authenticated
    USING (auth.uid() = ANY(members) OR auth.uid() = created_by);

-- Expenses Policies
CREATE POLICY "Group members can view expenses"
    ON public.expenses FOR SELECT
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT unnest(members) FROM public.expense_groups WHERE id = group_id
        )
    );

CREATE POLICY "Group members can insert expenses"
    ON public.expenses FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() IN (
            SELECT unnest(members) FROM public.expense_groups WHERE id = group_id
        )
    );

-- Community Posts Policies
CREATE POLICY "Community posts viewable by everyone"
    ON public.community_posts FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create posts"
    ON public.community_posts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own posts"
    ON public.community_posts FOR UPDATE
    USING (auth.uid() = author_id);

-- ==============================================================================
-- Performance Indexes
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);
CREATE INDEX IF NOT EXISTS idx_room_listings_city_area ON public.room_listings(city, area);
CREATE INDEX IF NOT EXISTS idx_room_listings_rent ON public.room_listings(rent_amount);
CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON public.expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_city_cat ON public.community_posts(city, category);
