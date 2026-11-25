-- ==============================================================================
-- YAARO PHASE 1 COMPLETE POSTGRESQL SCHEMA MIGRATION
-- Shared-Living Platform: Identity, Compatibility, Matching, Housing & Expenses
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES (Extends Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT UNIQUE,
    bio TEXT,
    age INTEGER CHECK (age >= 18 AND age <= 100),
    gender TEXT CHECK (gender IN ('male', 'female', 'non_binary', 'prefer_not_to_say')),
    occupation TEXT,
    company_or_college TEXT,
    city TEXT NOT NULL DEFAULT 'Bengaluru',
    locality TEXT,
    budget_min NUMERIC(10, 2),
    budget_max NUMERIC(10, 2),
    move_in_date DATE,
    verification_tier TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_tier IN ('unverified', 'basic_phone', 'work_or_college', 'gov_id_verified')),
    is_looking_for_room BOOLEAN NOT NULL DEFAULT true,
    is_looking_for_roommate BOOLEAN NOT NULL DEFAULT true,
    audio_vibe_url TEXT,
    is_profile_public BOOLEAN NOT NULL DEFAULT true
);

-- Ensure is_profile_public exists if profiles table pre-existed
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_profile_public BOOLEAN NOT NULL DEFAULT true;

-- ------------------------------------------------------------------------------
-- 2. USER PREFERENCES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    preferred_cities TEXT[] NOT NULL DEFAULT '{"Bengaluru"}',
    preferred_localities TEXT[] NOT NULL DEFAULT '{}',
    room_type_preference TEXT[] NOT NULL DEFAULT '{"private"}', -- private, shared
    target_budget_min NUMERIC(10, 2) NOT NULL DEFAULT 8000,
    target_budget_max NUMERIC(10, 2) NOT NULL DEFAULT 25000,
    preferred_gender TEXT NOT NULL DEFAULT 'any' CHECK (preferred_gender IN ('any', 'female_only', 'male_only')),
    dietary_preference TEXT NOT NULL DEFAULT 'any' CHECK (dietary_preference IN ('any', 'vegetarian', 'vegan', 'non_vegetarian', 'eggetarian')),
    pet_tolerance TEXT NOT NULL DEFAULT 'pet_friendly' CHECK (pet_tolerance IN ('pet_friendly', 'no_pets', 'has_pets')),
    smoking_tolerance TEXT NOT NULL DEFAULT 'non_smoker' CHECK (smoking_tolerance IN ('non_smoker', 'outside_only', 'open_to_smokers')),
    drinking_tolerance TEXT NOT NULL DEFAULT 'social' CHECK (drinking_tolerance IN ('teetotaler', 'social', 'regular')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_preferences UNIQUE (user_id)
);

-- ------------------------------------------------------------------------------
-- 3. PHOTOS (For User Profiles and Room Listings)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID, -- NULL if user profile photo, populated if room listing
    storage_path TEXT NOT NULL,
    photo_type TEXT NOT NULL CHECK (photo_type IN ('profile', 'lifestyle', 'room_main', 'room_bedroom', 'room_balcony', 'room_bathroom', 'room_common')),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_verified BOOLEAN NOT NULL DEFAULT false
);

-- ------------------------------------------------------------------------------
-- 4. QUIZ QUESTIONS (The YAARO Harmony Vibe Test)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_order INTEGER NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK (category IN ('cleanliness', 'sleep_noise', 'food_kitchen', 'guests_parties', 'chores_sharing', 'expenses_attitude', 'work_habits')),
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- [{ key: 'A', text: '...', score_weight: 1, vibe_tag: '...' }]
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 5. QUIZ ANSWERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    selected_option_key TEXT NOT NULL,
    importance_weight INTEGER NOT NULL DEFAULT 3 CHECK (importance_weight BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_question UNIQUE (user_id, question_id)
);

-- ------------------------------------------------------------------------------
-- 6. COMPATIBILITY RESULTS (Pre-calculated pairwise scores)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.compatibility_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_a UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_b UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    harmony_score INTEGER NOT NULL CHECK (harmony_score BETWEEN 0 AND 100),
    dimension_scores JSONB NOT NULL DEFAULT '{}', -- { cleanliness: 95, sleep: 90, food: 88, social: 94 }
    mutual_tags TEXT[] NOT NULL DEFAULT '{}',
    friction_notes TEXT[] NOT NULL DEFAULT '{}',
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_pairwise_compatibility UNIQUE (user_a, user_b),
    CONSTRAINT chk_pairwise_order CHECK (user_a < user_b)
);

-- ------------------------------------------------------------------------------
-- 7. LIKES (Roommate Discovery Swipes & Listing Bookmarks)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_listing_id UUID,
    like_type TEXT NOT NULL CHECK (like_type IN ('roommate_like', 'roommate_pass', 'super_vibe', 'listing_bookmark')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_target_exists CHECK (target_user_id IS NOT NULL OR target_listing_id IS NOT NULL)
);

-- ------------------------------------------------------------------------------
-- 8. MATCHES (Mutual Mutual Vibe / Acceptance)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_a UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_b UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    harmony_score INTEGER NOT NULL DEFAULT 85,
    matched_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unmatched', 'archived')),
    CONSTRAINT uq_matches_pair UNIQUE (user_a, user_b),
    CONSTRAINT chk_matches_order CHECK (user_a < user_b)
);

-- ------------------------------------------------------------------------------
-- 9. CONVERSATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    conversation_type TEXT NOT NULL DEFAULT 'direct' CHECK (conversation_type IN ('direct', 'flat_group')),
    title TEXT,
    associated_listing_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}'
);

-- ------------------------------------------------------------------------------
-- 10. CONVERSATION PARTICIPANTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    is_muted BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT uq_conversation_user UNIQUE (conversation_id, user_id)
);

-- ------------------------------------------------------------------------------
-- 11. MESSAGES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video_tour', 'system_match', 'flat_agreement', 'expense_split', 'visit_schedule')),
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 12. ROOM LISTINGS (Marketplace)
-- ------------------------------------------------------------------------------
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
    locality TEXT NOT NULL,
    full_address TEXT,
    property_type TEXT NOT NULL CHECK (property_type IN ('apartment', 'independent_house', 'villa', 'gated_society', 'pg')),
    room_type TEXT NOT NULL CHECK (room_type IN ('private', 'shared')),
    attached_bathroom BOOLEAN NOT NULL DEFAULT false,
    available_from DATE NOT NULL,
    furnishing_status TEXT NOT NULL CHECK (furnishing_status IN ('fully_furnished', 'semi_furnished', 'unfurnished')),
    amenities TEXT[] NOT NULL DEFAULT '{}',
    current_flatmates_count INTEGER NOT NULL DEFAULT 1,
    brokerage_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00, -- YAARO is 0% Brokerage
    is_verified_listing BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'occupied', 'hidden'))
);

-- Add Foreign Key to photos and likes for listings
ALTER TABLE public.photos 
    ADD CONSTRAINT fk_photos_listing FOREIGN KEY (listing_id) REFERENCES public.room_listings(id) ON DELETE CASCADE;

ALTER TABLE public.likes 
    ADD CONSTRAINT fk_likes_listing FOREIGN KEY (target_listing_id) REFERENCES public.room_listings(id) ON DELETE CASCADE;

-- ------------------------------------------------------------------------------
-- 13. SAVED LISTINGS (Bookmarks)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.room_listings(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_saved_listing UNIQUE (user_id, listing_id)
);

-- ------------------------------------------------------------------------------
-- 14. SHARED EXPENSES (Flat Groups & Ledgers)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shared_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    group_id UUID NOT NULL, -- references flat group conversation / ledger
    paid_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL CHECK (category IN ('rent', 'cook_maid', 'groceries', 'utilities', 'wifi', 'house_repairs', 'party_leisure', 'other')),
    split_type TEXT NOT NULL DEFAULT 'equal' CHECK (split_type IN ('equal', 'exact_amounts', 'percentage')),
    receipt_url TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'settled', 'cancelled'))
);

-- ------------------------------------------------------------------------------
-- 15. EXPENSE PARTICIPANTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expense_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_id UUID NOT NULL REFERENCES public.shared_expenses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    share_amount NUMERIC(10, 2) NOT NULL CHECK (share_amount >= 0),
    is_settled BOOLEAN NOT NULL DEFAULT false,
    settled_at TIMESTAMPTZ,
    payment_reference TEXT, -- UPI transaction ID / Ref
    CONSTRAINT uq_expense_participant UNIQUE (expense_id, user_id)
);

-- ------------------------------------------------------------------------------
-- 16. VERIFICATION RECORDS (Gov-ID, College & Workplace)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.verification_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL CHECK (verification_type IN ('aadhaar', 'digilocker', 'work_email', 'college_id', 'social_linkedin')),
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    verified_data JSONB NOT NULL DEFAULT '{}', -- Redacted verification payload (e.g., name, company domain, last 4 digits)
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    reviewed_at TIMESTAMPTZ
);

-- ------------------------------------------------------------------------------
-- 17. SUBSCRIPTIONS (Freemium & YAARO Pro)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_tier TEXT NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'yaaro_pro', 'landlord_verified')),
    billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual')),
    valid_from TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    valid_until TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_subscription UNIQUE (user_id)
);

-- ------------------------------------------------------------------------------
-- 18. NOTIFICATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('match_received', 'message_new', 'expense_split', 'expense_settled', 'visit_scheduled', 'verification_update', 'system')),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    action_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 19. REPORTS AND BLOCKS (Safety, Harassment & Scammer Protection)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports_and_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_listing_id UUID REFERENCES public.room_listings(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('report', 'block', 'report_and_block')),
    reason TEXT NOT NULL CHECK (reason IN ('broker_disguised', 'inaccurate_photos', 'harassment', 'scam_deposit', 'discriminatory_behavior', 'spam', 'other')),
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'action_taken', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compatibility_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports_and_blocks ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Public profiles viewable by everyone" ON public.profiles FOR SELECT USING (is_profile_public = true OR auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. User Preferences Policies
CREATE POLICY "Users view own preferences or mutual matches" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own preferences" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);

-- 3. Photos Policies
CREATE POLICY "Photos viewable publicly" ON public.photos FOR SELECT USING (true);
CREATE POLICY "Users manage own photos" ON public.photos FOR ALL USING (auth.uid() = user_id);

-- 4. Quiz Questions Policies
CREATE POLICY "Active quiz questions viewable by all" ON public.quiz_questions FOR SELECT USING (is_active = true);

-- 5. Quiz Answers Policies
CREATE POLICY "Users manage own quiz answers" ON public.quiz_answers FOR ALL USING (auth.uid() = user_id);

-- 6. Compatibility Results Policies
CREATE POLICY "Users can view scores involving themselves" ON public.compatibility_results FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);

-- 7. Likes Policies
CREATE POLICY "Users view own sent likes" ON public.likes FOR SELECT USING (auth.uid() = sender_id);
CREATE POLICY "Users insert likes" ON public.likes FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 8. Matches Policies
CREATE POLICY "Users view own matches" ON public.matches FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);

-- 9. Conversations Policies
CREATE POLICY "Participants view conversations" ON public.conversations FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = id AND user_id = auth.uid())
);

-- 10. Conversation Participants Policies
CREATE POLICY "Participants view members" ON public.conversation_participants FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid())
);

-- 11. Messages Policies
CREATE POLICY "Participants view messages" ON public.messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Participants send messages" ON public.messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND 
    EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);

-- 12. Room Listings Policies
CREATE POLICY "Available listings are public" ON public.room_listings FOR SELECT USING (status = 'available' OR auth.uid() = host_id);
CREATE POLICY "Hosts manage own room listings" ON public.room_listings FOR ALL USING (auth.uid() = host_id);

-- 13. Saved Listings Policies
CREATE POLICY "Users view own saved listings" ON public.saved_listings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own saved listings" ON public.saved_listings FOR ALL USING (auth.uid() = user_id);

-- 14. Shared Expenses Policies
CREATE POLICY "Flat members view expenses" ON public.shared_expenses FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = group_id AND user_id = auth.uid())
);
CREATE POLICY "Flat members insert expenses" ON public.shared_expenses FOR INSERT WITH CHECK (
    auth.uid() = paid_by AND
    EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = group_id AND user_id = auth.uid())
);

-- 15. Expense Participants Policies
CREATE POLICY "Members view expense splits" ON public.expense_participants FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.shared_expenses se 
            JOIN public.conversation_participants cp ON cp.conversation_id = se.group_id 
            WHERE se.id = expense_id AND cp.user_id = auth.uid())
);

-- 16. Verification Records Policies
CREATE POLICY "Users view own verification records" ON public.verification_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert verification records" ON public.verification_records FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 17. Subscriptions Policies
CREATE POLICY "Users view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- 18. Notifications Policies
CREATE POLICY "Users manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- 19. Reports and Blocks Policies
CREATE POLICY "Users view own submitted reports" ON public.reports_and_blocks FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Users create reports" ON public.reports_and_blocks FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- ==============================================================================
-- PERFORMANCE & FILTER INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_city_locality ON public.profiles(city, locality);
CREATE INDEX IF NOT EXISTS idx_profiles_budget ON public.profiles(budget_min, budget_max);
CREATE INDEX IF NOT EXISTS idx_room_listings_city_locality ON public.room_listings(city, locality);
CREATE INDEX IF NOT EXISTS idx_room_listings_rent ON public.room_listings(rent_amount);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_compatibility_users ON public.compatibility_results(user_a, user_b);
CREATE INDEX IF NOT EXISTS idx_shared_expenses_group ON public.shared_expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expense_participants_user ON public.expense_participants(user_id, is_settled);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);
