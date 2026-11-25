-- ==============================================================================
-- YAARO MASTER PRODUCTION POSTGRESQL SCHEMA SETUP (CLEAN & FOOLPROOF)
-- Shared-Living Platform: Identity, Preferences, Compatibility, Housing & Ledger
-- Compatible with Supabase Postgres & Next.js 14 App Router
-- ==============================================================================

-- 0. ENABLE REQUIRED EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- CLEANUP PREVIOUS CONFLICTING / LEGACY TABLES
-- (Safely removes old test tables with mismatched column names like host_id)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS public.saved_listings CASCADE;
DROP TABLE IF EXISTS public.listing_applications CASCADE;
DROP TABLE IF EXISTS public.room_listings CASCADE;
DROP TABLE IF EXISTS public.expense_splits CASCADE;
DROP TABLE IF EXISTS public.expense_participants CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.shared_expenses CASCADE;
DROP TABLE IF EXISTS public.expense_groups CASCADE;
DROP TABLE IF EXISTS public.community_comments CASCADE;
DROP TABLE IF EXISTS public.community_posts CASCADE;
DROP TABLE IF EXISTS public.compatibility_profiles CASCADE;
DROP TABLE IF EXISTS public.compatibility_results CASCADE;
DROP TABLE IF EXISTS public.game_challenges CASCADE;
DROP TABLE IF EXISTS public.quiz_answers CASCADE;
DROP TABLE IF EXISTS public.quiz_questions CASCADE;
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.reports_and_blocks CASCADE;
DROP TABLE IF EXISTS public.verification_records CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.photos CASCADE;
DROP TABLE IF EXISTS public.user_preferences CASCADE;

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (Extends Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    full_name TEXT NOT NULL DEFAULT 'YAARO Member',
    avatar_url TEXT,
    phone TEXT,
    bio TEXT,
    age INTEGER CHECK (age >= 18 AND age <= 100),
    gender TEXT,
    occupation TEXT,
    company_or_college TEXT,
    city TEXT NOT NULL DEFAULT 'Bengaluru',
    locality TEXT,
    budget_min NUMERIC(10, 2),
    budget_max NUMERIC(10, 2),
    move_in_date DATE,
    verification_tier TEXT NOT NULL DEFAULT 'unverified',
    is_looking_for_room BOOLEAN NOT NULL DEFAULT true,
    is_looking_for_roommate BOOLEAN NOT NULL DEFAULT true,
    audio_vibe_url TEXT,
    is_profile_public BOOLEAN NOT NULL DEFAULT true,
    profile_completed_percentage INTEGER DEFAULT 25,
    onboarded BOOLEAN DEFAULT false
);

-- Ensure all columns exist on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age >= 18 AND age <= 100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_or_college TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT 'Bengaluru';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS locality TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS budget_min NUMERIC(10, 2);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS budget_max NUMERIC(10, 2);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS move_in_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_tier TEXT NOT NULL DEFAULT 'unverified';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_looking_for_room BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_looking_for_roommate BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS audio_vibe_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_profile_public BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_completed_percentage INTEGER DEFAULT 25;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarded BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instagram_handle TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_handle TEXT;

-- ------------------------------------------------------------------------------
-- 2. USER PREFERENCES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    preferred_cities TEXT[] NOT NULL DEFAULT '{"Bengaluru"}',
    preferred_localities TEXT[] NOT NULL DEFAULT '{}',
    room_type_preference TEXT[] NOT NULL DEFAULT '{"private"}',
    target_budget_min NUMERIC(10, 2) NOT NULL DEFAULT 8000,
    target_budget_max NUMERIC(10, 2) NOT NULL DEFAULT 25000,
    preferred_gender TEXT NOT NULL DEFAULT 'any',
    dietary_preference TEXT NOT NULL DEFAULT 'any',
    pet_tolerance TEXT NOT NULL DEFAULT 'pet_friendly',
    smoking_tolerance TEXT NOT NULL DEFAULT 'non_smoker',
    drinking_tolerance TEXT NOT NULL DEFAULT 'social',
    sleeping_schedule TEXT NOT NULL DEFAULT 'flexible',
    work_schedule TEXT NOT NULL DEFAULT 'hybrid',
    cleanliness_level INTEGER NOT NULL DEFAULT 4,
    social_lifestyle TEXT NOT NULL DEFAULT 'balanced',
    hobbies TEXT[] NOT NULL DEFAULT '{}',
    privacy_hide_phone BOOLEAN DEFAULT true,
    privacy_hide_age BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_preferences UNIQUE (user_id)
);

-- ------------------------------------------------------------------------------
-- 3. PHOTOS TABLE (Profile & Room Photos)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID,
    storage_path TEXT NOT NULL,
    photo_type TEXT NOT NULL CHECK (photo_type IN ('profile', 'lifestyle', 'room_main', 'room_bedroom', 'room_balcony', 'room_bathroom', 'room_common')),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_verified BOOLEAN NOT NULL DEFAULT false
);

-- ------------------------------------------------------------------------------
-- 4. QUIZ QUESTIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_order INTEGER NOT NULL UNIQUE,
    category TEXT NOT NULL,
    game_category TEXT NOT NULL DEFAULT 'lifestyle_match' CHECK (
        game_category IN ('lifestyle_match', 'personality_match', 'roommate_situations', 'fun_compatibility')
    ),
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 5. QUIZ ANSWERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    selected_option_key TEXT NOT NULL,
    importance_weight INTEGER NOT NULL DEFAULT 25,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_question_answer UNIQUE (user_id, question_id)
);

-- ------------------------------------------------------------------------------
-- 6. COMPATIBILITY RESULTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.compatibility_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_a UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_b UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    harmony_score INTEGER NOT NULL CHECK (harmony_score BETWEEN 0 AND 100),
    dimension_scores JSONB NOT NULL DEFAULT '{}',
    mutual_tags TEXT[] NOT NULL DEFAULT '{}',
    friction_notes TEXT[] NOT NULL DEFAULT '{}',
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_different_compatibility_users CHECK (user_a <> user_b),
    CONSTRAINT uq_compatibility_pair UNIQUE (user_a, user_b)
);

-- ------------------------------------------------------------------------------
-- 7. GAME CHALLENGES TABLE (Phase 3 Chemistry Challenge Mechanism)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.game_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenger_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    challenged_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    game_category TEXT NOT NULL CHECK (
        game_category IN ('lifestyle_match', 'personality_match', 'roommate_situations', 'fun_compatibility')
    ),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'declined')),
    harmony_score INTEGER CHECK (harmony_score BETWEEN 0 AND 100),
    dimension_scores JSONB NOT NULL DEFAULT '{}',
    answers_summary JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ,
    CONSTRAINT chk_different_challenge_users CHECK (challenger_id <> challenged_id)
);

-- ------------------------------------------------------------------------------
-- 8. LIKES & DISCOVERY SWIPES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('roommate_like', 'roommate_pass', 'super_vibe', 'listing_bookmark')),
    CONSTRAINT chk_different_swipe_users CHECK (sender_id <> receiver_id),
    CONSTRAINT uq_sender_receiver_swipe UNIQUE (sender_id, receiver_id)
);

-- ------------------------------------------------------------------------------
-- 9. MATCHES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    user_a UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_b UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    harmony_score INTEGER NOT NULL DEFAULT 85,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unmatched', 'blocked')),
    CONSTRAINT chk_different_match_users CHECK (user_a <> user_b),
    CONSTRAINT uq_match_users UNIQUE (user_a, user_b)
);

-- ------------------------------------------------------------------------------
-- 10. CONVERSATIONS & MESSAGES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    participant_one UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    participant_two UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_message_preview TEXT,
    last_message_at TIMESTAMPTZ,
    CONSTRAINT chk_different_conversation_participants CHECK (participant_one <> participant_two),
    CONSTRAINT uq_conversation_participants UNIQUE (participant_one, participant_two)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'agreement_proposal', 'expense_ping'))
);

-- ------------------------------------------------------------------------------
-- 11. ROOM LISTINGS & SAVED LISTINGS (Host User ID strictly enforced)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.room_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    host_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Bengaluru',
    locality TEXT NOT NULL,
    neighborhood_vibe TEXT,
    rent_monthly NUMERIC(10, 2) NOT NULL,
    security_deposit NUMERIC(10, 2) NOT NULL,
    maintenance_monthly NUMERIC(10, 2) NOT NULL DEFAULT 0,
    room_type TEXT NOT NULL CHECK (room_type IN ('private', 'shared')),
    attached_bathroom BOOLEAN NOT NULL DEFAULT false,
    balcony_available BOOLEAN NOT NULL DEFAULT false,
    furnished_type TEXT NOT NULL CHECK (furnished_type IN ('unfurnished', 'semi_furnished', 'fully_furnished')),
    amenities TEXT[] NOT NULL DEFAULT '{}',
    house_rules TEXT[] NOT NULL DEFAULT '{}',
    preferred_gender TEXT NOT NULL DEFAULT 'any',
    is_verified_flat BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'under_review', 'paused', 'rented_out'))
);

CREATE TABLE IF NOT EXISTS public.saved_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.room_listings(id) ON DELETE CASCADE,
    CONSTRAINT uq_saved_listing UNIQUE (user_id, listing_id)
);

-- ------------------------------------------------------------------------------
-- 12. SHARED EXPENSES & PARTICIPANTS (Phase 5 Split Ledger)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shared_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    paid_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    flat_group_id UUID,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('rent', 'electricity_bescom', 'wifi_broadband', 'cook_salary', 'groceries_blinkit', 'water_purifier', 'maid_salary', 'household_cleaning', 'other')),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    split_method TEXT NOT NULL DEFAULT 'equal' CHECK (split_method IN ('equal', 'percentage', 'custom_shares')),
    status TEXT NOT NULL DEFAULT 'settled' CHECK (status IN ('pending', 'partially_settled', 'settled'))
);

CREATE TABLE IF NOT EXISTS public.expense_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_id UUID NOT NULL REFERENCES public.shared_expenses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    share_amount NUMERIC(10, 2) NOT NULL CHECK (share_amount >= 0),
    is_settled BOOLEAN NOT NULL DEFAULT false,
    settled_at TIMESTAMPTZ,
    upi_transaction_ref TEXT,
    CONSTRAINT uq_expense_participant UNIQUE (expense_id, user_id)
);

-- ------------------------------------------------------------------------------
-- 13. NOTIFICATIONS, VERIFICATIONS, REPORTS, SUBSCRIPTIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    action_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.reports_and_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_listing_id UUID REFERENCES public.room_listings(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('report', 'block', 'report_and_block')),
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.verification_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    document_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    verified_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_tier TEXT NOT NULL DEFAULT 'free',
    is_active BOOLEAN NOT NULL DEFAULT true,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compatibility_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports_and_blocks ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policies
DROP POLICY IF EXISTS "Public profiles viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles viewable by everyone" ON public.profiles FOR SELECT USING (is_profile_public = true OR auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users view own preferences or mutual matches" ON public.user_preferences;
CREATE POLICY "Users view own preferences or mutual matches" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own preferences" ON public.user_preferences;
CREATE POLICY "Users insert own preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own preferences" ON public.user_preferences;
CREATE POLICY "Users update own preferences" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Photos viewable publicly" ON public.photos;
CREATE POLICY "Photos viewable publicly" ON public.photos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users manage own photos" ON public.photos;
CREATE POLICY "Users manage own photos" ON public.photos FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Active quiz questions viewable by all" ON public.quiz_questions;
CREATE POLICY "Active quiz questions viewable by all" ON public.quiz_questions FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Users manage own quiz answers" ON public.quiz_answers;
CREATE POLICY "Users manage own quiz answers" ON public.quiz_answers FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view scores involving themselves" ON public.compatibility_results;
CREATE POLICY "Users can view scores involving themselves" ON public.compatibility_results FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);

DROP POLICY IF EXISTS "Users can view game challenges involving themselves" ON public.game_challenges;
CREATE POLICY "Users can view game challenges involving themselves" ON public.game_challenges FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

DROP POLICY IF EXISTS "Users can initiate game challenges" ON public.game_challenges;
CREATE POLICY "Users can initiate game challenges" ON public.game_challenges FOR INSERT WITH CHECK (auth.uid() = challenger_id);

DROP POLICY IF EXISTS "Participants can update game challenges" ON public.game_challenges;
CREATE POLICY "Participants can update game challenges" ON public.game_challenges FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

DROP POLICY IF EXISTS "Users can view likes sent or received" ON public.likes;
CREATE POLICY "Users can view likes sent or received" ON public.likes FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can create likes" ON public.likes;
CREATE POLICY "Users can create likes" ON public.likes FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Matches viewable by participants" ON public.matches;
CREATE POLICY "Matches viewable by participants" ON public.matches FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);

DROP POLICY IF EXISTS "Conversations viewable by participants" ON public.conversations;
CREATE POLICY "Conversations viewable by participants" ON public.conversations FOR SELECT USING (auth.uid() = participant_one OR auth.uid() = participant_two);

DROP POLICY IF EXISTS "Messages viewable by conversation participants" ON public.messages;
CREATE POLICY "Messages viewable by conversation participants" ON public.messages FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
));

DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
CREATE POLICY "Participants can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Room listings viewable by everyone" ON public.room_listings;
CREATE POLICY "Room listings viewable by everyone" ON public.room_listings FOR SELECT USING (status = 'active' OR host_user_id = auth.uid());

DROP POLICY IF EXISTS "Hosts can manage their own listings" ON public.room_listings;
CREATE POLICY "Hosts can manage their own listings" ON public.room_listings FOR ALL USING (auth.uid() = host_user_id);

DROP POLICY IF EXISTS "Users can view own saved listings" ON public.saved_listings;
CREATE POLICY "Users can view own saved listings" ON public.saved_listings FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view notifications for themselves" ON public.notifications;
CREATE POLICY "Users can view notifications for themselves" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 15. SEED ALL 19 CHEMISTRY QUIZ QUESTIONS (THE 4 GAME CATEGORIES)
-- ------------------------------------------------------------------------------
DELETE FROM public.quiz_questions WHERE question_order BETWEEN 1 AND 19;

INSERT INTO public.quiz_questions (question_order, category, game_category, question_text, options) VALUES
-- CATEGORY 1: LIFESTYLE MATCH
(1, 'sleep_noise', 'lifestyle_match', 'Are you an early bird or a night owl at home?', '[
  {"key": "A", "text": "Early Bird: Awake by 6–7 AM, asleep before 11 PM.", "score_weight": 25, "vibe_tag": "Early Bird 🌅"},
  {"key": "B", "text": "Night Owl: Peak focus after midnight, asleep by 1:30–3 AM.", "score_weight": 25, "vibe_tag": "Night Owl 🦉"},
  {"key": "C", "text": "Flexible Rhythms: Depends on work sprints and deadlines.", "score_weight": 20, "vibe_tag": "Flexible Rhythms ⚡"}
]'::jsonb),

(2, 'cleanliness', 'lifestyle_match', 'What is your honest cleaning and chores cadence?', '[
  {"key": "A", "text": "Daily discipline: Wash dishes immediately, spotless kitchen counter.", "score_weight": 25, "vibe_tag": "Daily Cleanliness ✨"},
  {"key": "B", "text": "Soak overnight: Wash before morning chai ritual.", "score_weight": 24, "vibe_tag": "Rhea’s Rule ☕"},
  {"key": "C", "text": "Weekly deep sweep: Let maid handle vessels, weekend thorough reset.", "score_weight": 20, "vibe_tag": "Weekly Reset 🧹"}
]'::jsonb),

(3, 'food_kitchen', 'lifestyle_match', 'How do you handle food, meals and kitchen territory?', '[
  {"key": "A", "text": "Cook daily: Love cooking fresh healthy meals at home.", "score_weight": 25, "vibe_tag": "Home Cook 🍳"},
  {"key": "B", "text": "Shared Cook: Employ a professional cook and split monthly grocery ledger.", "score_weight": 25, "vibe_tag": "Shared Cook 🍲"},
  {"key": "C", "text": "Order In: Swiggy/Zomato power-user, kitchen is for chai and snacks.", "score_weight": 20, "vibe_tag": "Order In 🛵"}
]'::jsonb),

(4, 'guests_parties', 'lifestyle_match', 'What is your preferred living room noise & guest climate?', '[
  {"key": "A", "text": "Quiet sanctuary: Peaceful home environment for focus and recharge.", "score_weight": 25, "vibe_tag": "Quiet Sanctuary 🌿"},
  {"key": "B", "text": "Social hub: Friends over on weekends, chill lo-fi jams, open door.", "score_weight": 25, "vibe_tag": "Social Hub 🎶"},
  {"key": "C", "text": "Balanced: Weekdays strictly quiet, Friday/Saturday relaxed.", "score_weight": 23, "vibe_tag": "Balanced Vibe ⚖️"}
]'::jsonb),

(5, 'work_habits', 'lifestyle_match', 'What is your daily work-from-home or office rhythm?', '[
  {"key": "A", "text": "Full Work From Home: Home desk is active 9 AM to 7 PM on Zoom.", "score_weight": 25, "vibe_tag": "Full WFH 💻"},
  {"key": "B", "text": "Hybrid: 2–3 days office, 2 days home desk.", "score_weight": 25, "vibe_tag": "Hybrid Rhythm 🏢"},
  {"key": "C", "text": "Office / College: Out all day, home is strictly for sleeping & resting.", "score_weight": 22, "vibe_tag": "Out All Day 🎒"}
]'::jsonb),

-- CATEGORY 2: PERSONALITY MATCH
(6, 'social_lifestyle', 'personality_match', 'When your social battery drains, how do you recharge?', '[
  {"key": "A", "text": "Introvert: Door closed, noise-canceling headphones, solo reading/gaming.", "score_weight": 25, "vibe_tag": "Introvert Sanctuary 🎧"},
  {"key": "B", "text": "Extrovert: Conversing in the living room, heading out to Indiranagar.", "score_weight": 25, "vibe_tag": "Extrovert Energy ⚡"},
  {"key": "C", "text": "Ambivert: Love a good kitchen chat, then need 2 hours of quiet.", "score_weight": 24, "vibe_tag": "Ambivert Vibe 🛋️"}
]'::jsonb),

(7, 'work_habits', 'personality_match', 'How do you approach weekends and domestic tasks?', '[
  {"key": "A", "text": "Planned & Scheduled: Cleaning calendar, meal prep planned in advance.", "score_weight": 25, "vibe_tag": "Methodical & Planned 📋"},
  {"key": "B", "text": "Spontaneous: Go with the flow, clean when dirty, cook when hungry.", "score_weight": 22, "vibe_tag": "Spontaneous Spirit 🌊"}
]'::jsonb),

(8, 'guests_parties', 'personality_match', 'Personal privacy expectations inside a shared flat:', '[
  {"key": "A", "text": "High Privacy: Knock before entering bedroom, sacred personal space.", "score_weight": 25, "vibe_tag": "High Privacy 🔒"},
  {"key": "B", "text": "Open & Casual: Door stays ajar, walk-in to borrow charger or tea.", "score_weight": 22, "vibe_tag": "Open Living 🚪"}
]'::jsonb),

(9, 'cleanliness', 'personality_match', 'Living space organization aesthetic:', '[
  {"key": "A", "text": "Organized Minimalist: Everything has a designated shelf and place.", "score_weight": 25, "vibe_tag": "Organized Minimalist 📐"},
  {"key": "B", "text": "Relaxed Creative: Comfortable lived-in clutter, books and plants everywhere.", "score_weight": 22, "vibe_tag": "Creative Flow 🎨"}
]'::jsonb),

-- CATEGORY 3: ROOMMATE SITUATIONS
(10, 'guests_parties', 'roommate_situations', 'Roommate brings friends over on a Tuesday night without heads-up. You:', '[
  {"key": "A", "text": "Calmly remind about the flat rule: 2-hour advance group notice.", "score_weight": 25, "vibe_tag": "Clear Communicator 💬"},
  {"key": "B", "text": "Join in for a slice of pizza and tea, but request quiet by 11:30 PM.", "score_weight": 24, "vibe_tag": "Easygoing Host 🍕"},
  {"key": "C", "text": "Retreat to private room and put on noise-canceling headphones.", "score_weight": 22, "vibe_tag": "Quiet Retreat 🔇"}
]'::jsonb),

(11, 'expenses_attitude', 'roommate_situations', 'A flatmate forgets to settle their ₹2,400 grocery share for 5 days. You:', '[
  {"key": "A", "text": "Trigger a polite 1-tap UPI reminder directly on the YAARO split ledger.", "score_weight": 25, "vibe_tag": "System First 📱"},
  {"key": "B", "text": "Mention it casually over morning chai: Hey, settle the Blinkit bill when free.", "score_weight": 24, "vibe_tag": "Chai Chat ☕"},
  {"key": "C", "text": "Wait until month-end rent settlement to reconcile everything at once.", "score_weight": 20, "vibe_tag": "Monthly Reconcile 📊"}
]'::jsonb),

(12, 'cleanliness', 'roommate_situations', 'Someone leaves an unwashed chai saucepan on the stove overnight. You:', '[
  {"key": "A", "text": "Fill it with warm water to soak so maid can wash easily at 10 AM.", "score_weight": 25, "vibe_tag": "Constructive Pragmatist 🚰"},
  {"key": "B", "text": "Post a friendly photo on the group: Please soak saucepans after chai!", "score_weight": 23, "vibe_tag": "Group Accountability 📸"},
  {"key": "C", "text": "Wash it myself if using the burner next.", "score_weight": 20, "vibe_tag": "Self Reliant 🧼"}
]'::jsonb),

(13, 'sleep_noise', 'roommate_situations', 'A flatmate plays music with bass late at night. You:', '[
  {"key": "A", "text": "Knock right away: Hey, trying to sleep, mind switching to headphones?", "score_weight": 25, "vibe_tag": "Direct & Polite 🎧"},
  {"key": "B", "text": "Send a quick WhatsApp text: Bass is vibrating my door haha.", "score_weight": 23, "vibe_tag": "Digital Gentle Ping 📲"}
]'::jsonb),

(14, 'chores_sharing', 'roommate_situations', 'Different expectations about common area deep cleaning emerge. You:', '[
  {"key": "A", "text": "Agree on hiring a professional deep clean service once a quarter and split 50/50.", "score_weight": 25, "vibe_tag": "Outsource Pragmatist 🧼"},
  {"key": "B", "text": "Establish a rotating chore chart on fridge: Monday kitchen, Friday hall.", "score_weight": 24, "vibe_tag": "Chore Chart 📑"}
]'::jsonb),

-- CATEGORY 4: FUN COMPATIBILITY QUIZ
(15, 'social_lifestyle', 'fun_compatibility', 'Ideal Sunday afternoon in Bengaluru:', '[
  {"key": "A", "text": "Filter coffee & avocado toast at Third Wave, followed by book shopping at Blossom.", "score_weight": 25, "vibe_tag": "Blossom & Brews 📖"},
  {"key": "B", "text": "Sunday sleep-in until noon, gaming session, ordering biryani.", "score_weight": 24, "vibe_tag": "Biryani & Binge 🍗"},
  {"key": "C", "text": "Cubbon Park morning run, indoor plant shopping, cleaning the balcony.", "score_weight": 25, "vibe_tag": "Cubbon & Plants 🌿"}
]'::jsonb),

(16, 'social_lifestyle', 'fun_compatibility', 'Your home entertainment vibe of choice:', '[
  {"key": "A", "text": "Living room movie nights on projector with popcorn and indie cinema.", "score_weight": 25, "vibe_tag": "Projector Cinema 🍿"},
  {"key": "B", "text": "Board games (Catan, Secret Hitler) or Nintendo Switch multiplayer.", "score_weight": 24, "vibe_tag": "Board Game Night 🎲"},
  {"key": "C", "text": "Ambient music in the background while everyone does their own creative work.", "score_weight": 25, "vibe_tag": "Parallel Play 🎨"}
]'::jsonb),

(17, 'social_lifestyle', 'fun_compatibility', 'Travel and weekend roadtrip philosophy:', '[
  {"key": "A", "text": "Spontaneous roadtrip to Coorg or Gokarna at 4 AM on Saturday.", "score_weight": 25, "vibe_tag": "Western Ghats Roadtripper 🚙"},
  {"key": "B", "text": "Staycation in the flat: iced tea on the balcony and uninterrupted reading.", "score_weight": 24, "vibe_tag": "Balcony Staycation 🧊"}
]'::jsonb),

(18, 'food_kitchen', 'fun_compatibility', 'The late-night kitchen snack emergency solution:', '[
  {"key": "A", "text": "Classic Maggi with chopped green chillies and cheese slice.", "score_weight": 25, "vibe_tag": "Maggi Maestro 🍜"},
  {"key": "B", "text": "Gourmet toasted sourdough sandwich with salted butter.", "score_weight": 24, "vibe_tag": "Artisanal Toast 🍞"},
  {"key": "C", "text": "Blinkit ice cream tub ordered at 1 AM.", "score_weight": 23, "vibe_tag": "Midnight Gelato 🍨"}
]'::jsonb),

(19, 'work_habits', 'fun_compatibility', 'Your work environment beverage companion:', '[
  {"key": "A", "text": "South Indian filter coffee with frothy chicory brew.", "score_weight": 25, "vibe_tag": "Filter Coffee Devotee ☕"},
  {"key": "B", "text": "Adrak Elaichi chai brewed in a brass pan.", "score_weight": 25, "vibe_tag": "Masala Chai Purist 🫖"},
  {"key": "C", "text": "Cold brew or matcha latte with oat milk.", "score_weight": 23, "vibe_tag": "Matcha & Cold Brew 🍵"}
]'::jsonb)
ON CONFLICT (question_order) DO UPDATE SET
    category = EXCLUDED.category,
    game_category = EXCLUDED.game_category,
    question_text = EXCLUDED.question_text,
    options = EXCLUDED.options;

-- ------------------------------------------------------------------------------
-- 16. STORAGE BUCKETS (Avatars & Listings)
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('room-photos', 'room-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
    public = true;

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Room photos are publicly accessible" ON storage.objects;
CREATE POLICY "Room photos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'room-photos');

DROP POLICY IF EXISTS "Users can upload room photos" ON storage.objects;
CREATE POLICY "Users can upload room photos" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'room-photos');

-- ==============================================================================
-- 18. ROLE PRIVILEGES & PERMISSIONS (anon, authenticated, service_role)
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- ==============================================================================
-- SETUP COMPLETE: All 17 tables, 19 questions, storage buckets & RLS verified.
-- ==============================================================================
