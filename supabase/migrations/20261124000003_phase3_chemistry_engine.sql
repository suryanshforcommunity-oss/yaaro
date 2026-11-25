-- ==============================================================================
-- YAARO PHASE 3: ROOMMATE CHEMISTRY ENGINE & GAMES SCHEMA EXTENSION
-- ==============================================================================

-- 1. Ensure quiz_questions table exists and extend with game_category
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_order INTEGER NOT NULL UNIQUE,
    category TEXT NOT NULL,
    game_category TEXT DEFAULT 'lifestyle_match',
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.quiz_questions
    ADD COLUMN IF NOT EXISTS game_category TEXT CHECK (
        game_category IN ('lifestyle_match', 'personality_match', 'roommate_situations', 'fun_compatibility')
    ) DEFAULT 'lifestyle_match';

-- 2. Create game_challenges table for challenger-invite mechanics
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
    CONSTRAINT chk_different_users CHECK (challenger_id <> challenged_id)
);

-- RLS for game_challenges
ALTER TABLE public.game_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view game challenges involving themselves"
    ON public.game_challenges FOR SELECT
    USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

CREATE POLICY "Users can initiate game challenges"
    ON public.game_challenges FOR INSERT
    WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Participants can update game challenges"
    ON public.game_challenges FOR UPDATE
    USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

CREATE INDEX IF NOT EXISTS idx_game_challenges_users ON public.game_challenges(challenger_id, challenged_id);

-- 3. Seed Comprehensive Chemistry Questions Across All 4 Game Categories
DELETE FROM public.quiz_questions WHERE question_order BETWEEN 1 AND 20;

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
