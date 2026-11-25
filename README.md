# YAARO.live — Contemporary Shared-Living Platform

> *“Find your people. Find your place.”*

YAARO is a modern shared-living platform built for urban India. It replaces awkward broker interactions, clashing lifestyle rhythms, and delayed expense settlements with compatibility-first flatmate discovery, authentic room listings, real-time messaging, and multi-member household finance management.

---

## Architecture & Completed Phases

### Phase 1 — Brand Identity, Foundations & Schema
- Distinctive editorial magazine aesthetic featuring **Cream** (`#F4EBDD`), **Forest Green** (`#263F32`), **Tomato Red** (`#E95D43`), and **Butter Yellow** (`#F2C75C`).
- Expressive typography: *Playfair Display* for headlines, *Plus Jakarta Sans* for UI, and *Dancing Script* for narrative accents.
- PostgreSQL master schema featuring 19 normalized tables, Row Level Security (RLS) policies, and performance indexes.

### Phase 2 — Authentication & Multi-Step Onboarding
- Supabase SSR authentication with secure cookies and session management.
- Google OAuth 2.0 integration with automatic profile initialization.
- 7-step interactive onboarding questionnaire assessing budget, sleeping rhythms, dietary preferences, work habits, and social boundaries.

### Phase 3 — Roommate Discovery & Chemistry Engine
- 8-dimension weighted roommate compatibility matching algorithm (Harmony Score 0–100%).
- 4 interactive chemistry game modes:
  1. *2 Truths & A Lie*
  2. *Hypothetical Flat Dilemma*
  3. *Daily Rhythm Sync*
  4. *Chai & Chill Socializer*
- Discovery card feed with swipe mechanics and multi-city filters (Pune, Mumbai, Nagpur, Bangalore, Hyderabad).

### Phase 4 — Matching, Real-Time Messaging & Notifications
- Mutual like verification with instant match celebration modals.
- Real-time 1-on-1 messaging powered by Supabase Realtime with read receipts and unread badges.
- In-chat interactive card sharing for room listings, user profiles, compatibility scorecards, and digital rent agreements.
- Safety and trust safeguards: Unmatch, Block User, and Report User with immediate database audit trails.

### Phase 5 — Room & Accommodation Marketplace
- Two-sided marketplace for finding and listing shared apartments and private rooms.
- Listing creation wizard with rent, security deposit, bed types, furnishing, amenities, and photo galleries.
- Multi-city search with neighborhood-level location privacy (approximate localities only; never exposes private residential addresses).
- Authentic listing lifecycle: active, paused, performance metrics, and in-app enquiries.

### Phase 6 — Shared Finances & Split Ledger
- 5-state conditional lifecycle: from empty state to confirmed flatmate activation.
- Monthly rent manager with contribution ratios, due date tracking, and agreement OCR data extraction.
- Multi-member household groups with roommate invitations and audit history.
- 8 expense categories: Rent, Electricity, Water, Internet, Groceries, Maintenance, Cleaning, and Custom.
- 4 splitting methods: Equal split, Custom exact ₹ amount, Percentage % split, and Individual assignment.
- Greedy pairwise debt simplification matrix and user-recorded settlement audit logs.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Lucide Icons
- **Backend & Auth**: Supabase SSR (`@supabase/ssr`, `@supabase/supabase-js`)
- **Database**: PostgreSQL with Row-Level Security (RLS)
- **Realtime**: Supabase Realtime WebSockets

---

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Installation
```bash
# Clone the repository
git clone https://github.com/suryanshforcommunity-oss/yaaro.git
cd yaaro

# Install dependencies
pnpm install

# Configure environment variables
cp .env.example .env.local
# Add your NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY

# Run development server
pnpm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

---

## License
MIT © 2026 YAARO.live
