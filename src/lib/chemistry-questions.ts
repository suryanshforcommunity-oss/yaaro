export interface OptionItem {
  key: string
  text: string
  score_weight: number
  vibe_tag: string
}

export interface ChemistryQuestion {
  id: string
  question_order: number
  category: string
  game_category: 'lifestyle_match' | 'personality_match' | 'roommate_situations' | 'fun_compatibility'
  question_text: string
  options: OptionItem[]
  domestic_tip?: string
}

export const CHEMISTRY_QUESTIONS: ChemistryQuestion[] = [
  // CATEGORY 1: LIFESTYLE MATCH
  {
    id: 'q-1',
    question_order: 1,
    category: 'sleep_noise',
    game_category: 'lifestyle_match',
    question_text: 'Are you an early bird or a night owl at home?',
    options: [
      { key: 'A', text: 'Early Bird: Awake by 6–7 AM, asleep before 11 PM.', score_weight: 25, vibe_tag: 'Early Bird 🌅' },
      { key: 'B', text: 'Night Owl: Peak focus after midnight, asleep by 1:30–3 AM.', score_weight: 25, vibe_tag: 'Night Owl 🦉' },
      { key: 'C', text: 'Flexible Rhythms: Depends on work sprints and deadlines.', score_weight: 20, vibe_tag: 'Flexible Rhythms ⚡' },
    ],
    domestic_tip: 'Aligning sleep routines reduces weekday morning and night tension by over 80%.',
  },
  {
    id: 'q-2',
    question_order: 2,
    category: 'cleanliness',
    game_category: 'lifestyle_match',
    question_text: 'What is your honest cleaning and chores cadence?',
    options: [
      { key: 'A', text: 'Daily discipline: Wash dishes immediately, spotless kitchen counter.', score_weight: 25, vibe_tag: 'Daily Cleanliness ✨' },
      { key: 'B', text: 'Soak overnight: Wash before morning chai ritual.', score_weight: 24, vibe_tag: "Rhea's Rule ☕" },
      { key: 'C', text: 'Weekly deep sweep: Let maid handle vessels, weekend thorough reset.', score_weight: 20, vibe_tag: 'Weekly Reset 🧹' },
    ],
    domestic_tip: '78% of Koramangala flatmate disputes start over unsoaked chai saucepans on the stove.',
  },
  {
    id: 'q-3',
    question_order: 3,
    category: 'food_kitchen',
    game_category: 'lifestyle_match',
    question_text: 'How do you handle food, meals and kitchen territory?',
    options: [
      { key: 'A', text: 'Cook daily: Love cooking fresh healthy meals at home.', score_weight: 25, vibe_tag: 'Home Cook 🍳' },
      { key: 'B', text: 'Shared Cook: Employ a professional cook and split monthly grocery ledger.', score_weight: 25, vibe_tag: 'Shared Cook 🍲' },
      { key: 'C', text: 'Order In: Swiggy/Zomato power-user, kitchen is for chai and snacks.', score_weight: 20, vibe_tag: 'Order In 🛵' },
    ],
    domestic_tip: 'Deciding on a shared cook upfront saves ₹4,000/month per flatmate on groceries.',
  },
  {
    id: 'q-4',
    question_order: 4,
    category: 'guests_parties',
    game_category: 'lifestyle_match',
    question_text: 'What is your preferred living room noise & guest climate?',
    options: [
      { key: 'A', text: 'Quiet sanctuary: Peaceful home environment for focus and recharge.', score_weight: 25, vibe_tag: 'Quiet Sanctuary 🌿' },
      { key: 'B', text: 'Social hub: Friends over on weekends, chill lo-fi jams, open door.', score_weight: 25, vibe_tag: 'Social Hub 🎶' },
      { key: 'C', text: 'Balanced: Weekdays strictly quiet, Friday/Saturday relaxed.', score_weight: 23, vibe_tag: 'Balanced Vibe ⚖️' },
    ],
    domestic_tip: 'Designated weekday quiet hours preserve domestic sanity for hybrid startup workers.',
  },
  {
    id: 'q-5',
    question_order: 5,
    category: 'work_habits',
    game_category: 'lifestyle_match',
    question_text: 'What is your daily work-from-home or office rhythm?',
    options: [
      { key: 'A', text: 'Full Work From Home: Home desk is active 9 AM to 7 PM on Zoom.', score_weight: 25, vibe_tag: 'Full WFH 💻' },
      { key: 'B', text: 'Hybrid: 2–3 days office, 2 days home desk.', score_weight: 25, vibe_tag: 'Hybrid Rhythm 🏢' },
      { key: 'C', text: 'Office / College: Out all day, home is strictly for sleeping & resting.', score_weight: 22, vibe_tag: 'Out All Day 🎒' },
    ],
    domestic_tip: 'Complementary WFH schedules prevent Wi-Fi bandwidth bottlenecks and call echoes.',
  },

  // CATEGORY 2: PERSONALITY MATCH
  {
    id: 'q-6',
    question_order: 6,
    category: 'social_lifestyle',
    game_category: 'personality_match',
    question_text: 'When your social battery drains, how do you recharge?',
    options: [
      { key: 'A', text: 'Introvert: Door closed, noise-canceling headphones, solo reading/gaming.', score_weight: 25, vibe_tag: 'Introvert Sanctuary 🎧' },
      { key: 'B', text: 'Extrovert: Conversing in the living room, heading out to Indiranagar.', score_weight: 25, vibe_tag: 'Extrovert Energy ⚡' },
      { key: 'C', text: 'Ambivert: Love a good kitchen chat, then need 2 hours of quiet.', score_weight: 24, vibe_tag: 'Ambivert Vibe 🛋️' },
    ],
    domestic_tip: 'Knowing your roommate’s recharge style prevents misinterpreting quietness as friction.',
  },
  {
    id: 'q-7',
    question_order: 7,
    category: 'work_habits',
    game_category: 'personality_match',
    question_text: 'How do you approach weekends and domestic tasks?',
    options: [
      { key: 'A', text: 'Planned & Scheduled: Cleaning calendar, meal prep planned in advance.', score_weight: 25, vibe_tag: 'Methodical & Planned 📋' },
      { key: 'B', text: 'Spontaneous: Go with the flow, clean when dirty, cook when hungry.', score_weight: 22, vibe_tag: 'Spontaneous Spirit 🌊' },
    ],
    domestic_tip: 'Pairing methodical and spontaneous flatmates creates a well-kept, fun home when balanced.',
  },
  {
    id: 'q-8',
    question_order: 8,
    category: 'guests_parties',
    game_category: 'personality_match',
    question_text: 'Personal privacy expectations inside a shared flat:',
    options: [
      { key: 'A', text: 'High Privacy: Knock before entering bedroom, sacred personal space.', score_weight: 25, vibe_tag: 'High Privacy 🔒' },
      { key: 'B', text: 'Open & Casual: Door stays ajar, walk-in to borrow charger or tea.', score_weight: 22, vibe_tag: 'Open Living 🚪' },
    ],
    domestic_tip: 'Knocking etiquette is non-negotiable for 91% of urban co-livers.',
  },
  {
    id: 'q-9',
    question_order: 9,
    category: 'cleanliness',
    game_category: 'personality_match',
    question_text: 'Living space organization aesthetic:',
    options: [
      { key: 'A', text: 'Organized Minimalist: Everything has a designated shelf and place.', score_weight: 25, vibe_tag: 'Organized Minimalist 📐' },
      { key: 'B', text: 'Relaxed Creative: Comfortable lived-in clutter, books and plants everywhere.', score_weight: 22, vibe_tag: 'Creative Flow 🎨' },
    ],
    domestic_tip: 'Designate common areas as minimalist while keeping private bedrooms expressive.',
  },

  // CATEGORY 3: ROOMMATE SITUATIONS
  {
    id: 'q-10',
    question_order: 10,
    category: 'guests_parties',
    game_category: 'roommate_situations',
    question_text: 'Roommate brings friends over on a Tuesday night without heads-up. You:',
    options: [
      { key: 'A', text: 'Calmly remind about the flat rule: 2-hour advance group notice.', score_weight: 25, vibe_tag: 'Clear Communicator 💬' },
      { key: 'B', text: 'Join in for a slice of pizza and tea, but request quiet by 11:30 PM.', score_weight: 24, vibe_tag: 'Easygoing Host 🍕' },
      { key: 'C', text: 'Retreat to private room and put on noise-canceling headphones.', score_weight: 22, vibe_tag: 'Quiet Retreat 🔇' },
    ],
    domestic_tip: 'A 2-hour WhatsApp heads-up rule eliminates 95% of surprise guest awkwardness.',
  },
  {
    id: 'q-11',
    question_order: 11,
    category: 'expenses_attitude',
    game_category: 'roommate_situations',
    question_text: 'A flatmate forgets to settle their ₹2,400 grocery share for 5 days. You:',
    options: [
      { key: 'A', text: 'Trigger a polite 1-tap UPI reminder directly on the YAARO split ledger.', score_weight: 25, vibe_tag: 'System First 📱' },
      { key: 'B', text: 'Mention it casually over morning chai: Hey, settle the Blinkit bill when free.', score_weight: 24, vibe_tag: 'Chai Chat ☕' },
      { key: 'C', text: 'Wait until month-end rent settlement to reconcile everything at once.', score_weight: 20, vibe_tag: 'Monthly Reconcile 📊' },
    ],
    domestic_tip: 'Automated 1-tap UPI reminders remove the social embarrassment of asking for money back.',
  },
  {
    id: 'q-12',
    question_order: 12,
    category: 'cleanliness',
    game_category: 'roommate_situations',
    question_text: 'Someone leaves an unwashed chai saucepan on the stove overnight. You:',
    options: [
      { key: 'A', text: 'Fill it with warm water to soak so maid can wash easily at 10 AM.', score_weight: 25, vibe_tag: 'Constructive Pragmatist 🚰' },
      { key: 'B', text: 'Post a friendly photo on the group: Please soak saucepans after chai!', score_weight: 23, vibe_tag: 'Group Accountability 📸' },
      { key: 'C', text: 'Wash it myself if using the burner next.', score_weight: 20, vibe_tag: 'Self Reliant 🧼' },
    ],
    domestic_tip: 'Soaking the vessel immediately defuses burnt milk residue friction.',
  },
  {
    id: 'q-13',
    question_order: 13,
    category: 'sleep_noise',
    game_category: 'roommate_situations',
    question_text: 'A flatmate plays music with bass late at night. You:',
    options: [
      { key: 'A', text: 'Knock right away: Hey, trying to sleep, mind switching to headphones?', score_weight: 25, vibe_tag: 'Direct & Polite 🎧' },
      { key: 'B', text: 'Send a quick WhatsApp text: Bass is vibrating my door haha.', score_weight: 23, vibe_tag: 'Digital Gentle Ping 📲' },
    ],
    domestic_tip: 'Polite in-person direct requests resolve late-night audio issues in 10 seconds.',
  },
  {
    id: 'q-14',
    question_order: 14,
    category: 'chores_sharing',
    game_category: 'roommate_situations',
    question_text: 'Different expectations about common area deep cleaning emerge. You:',
    options: [
      { key: 'A', text: 'Agree on hiring a professional deep clean service once a quarter and split 50/50.', score_weight: 25, vibe_tag: 'Outsource Pragmatist 🧼' },
      { key: 'B', text: 'Establish a rotating chore chart on fridge: Monday kitchen, Friday hall.', score_weight: 24, vibe_tag: 'Chore Chart 📑' },
    ],
    domestic_tip: 'Outsourcing deep cleaning once a quarter preserves friendship and bathroom cleanliness.',
  },

  // CATEGORY 4: FUN COMPATIBILITY QUIZ
  {
    id: 'q-15',
    question_order: 15,
    category: 'social_lifestyle',
    game_category: 'fun_compatibility',
    question_text: 'Ideal Sunday afternoon in Bengaluru:',
    options: [
      { key: 'A', text: 'Filter coffee & avocado toast at Third Wave, followed by book shopping at Blossom.', score_weight: 25, vibe_tag: 'Blossom & Brews 📖' },
      { key: 'B', text: 'Sunday sleep-in until noon, gaming session, ordering biryani.', score_weight: 24, vibe_tag: 'Biryani & Binge 🍗' },
      { key: 'C', text: 'Cubbon Park morning run, indoor plant shopping, cleaning the balcony.', score_weight: 25, vibe_tag: 'Cubbon & Plants 🌿' },
    ],
    domestic_tip: 'Complementary Sunday rhythms allow flatmates to either explore together or enjoy solo sanctuary.',
  },
  {
    id: 'q-16',
    question_order: 16,
    category: 'social_lifestyle',
    game_category: 'fun_compatibility',
    question_text: 'Your home entertainment vibe of choice:',
    options: [
      { key: 'A', text: 'Living room movie nights on projector with popcorn and indie cinema.', score_weight: 25, vibe_tag: 'Projector Cinema 🍿' },
      { key: 'B', text: 'Board games (Catan, Secret Hitler) or Nintendo Switch multiplayer.', score_weight: 24, vibe_tag: 'Board Game Night 🎲' },
      { key: 'C', text: 'Ambient music in the background while everyone does their own creative work.', score_weight: 25, vibe_tag: 'Parallel Play 🎨' },
    ],
    domestic_tip: 'Parallel play—working quietly in the same room—is Gen Z co-living’s highest bonding art.',
  },
  {
    id: 'q-17',
    question_order: 17,
    category: 'social_lifestyle',
    game_category: 'fun_compatibility',
    question_text: 'Travel and weekend roadtrip philosophy:',
    options: [
      { key: 'A', text: 'Spontaneous roadtrip to Coorg or Gokarna at 4 AM on Saturday.', score_weight: 25, vibe_tag: 'Western Ghats Roadtripper 🚙' },
      { key: 'B', text: 'Staycation in the flat: iced tea on the balcony and uninterrupted reading.', score_weight: 24, vibe_tag: 'Balcony Staycation 🧊' },
    ],
    domestic_tip: 'Shared weekend wanderlust turns co-living flatmates into lifelong travel companions.',
  },
  {
    id: 'q-18',
    question_order: 18,
    category: 'food_kitchen',
    game_category: 'fun_compatibility',
    question_text: 'The late-night kitchen snack emergency solution:',
    options: [
      { key: 'A', text: 'Classic Maggi with chopped green chillies and cheese slice.', score_weight: 25, vibe_tag: 'Maggi Maestro 🍜' },
      { key: 'B', text: 'Gourmet toasted sourdough sandwich with salted butter.', score_weight: 24, vibe_tag: 'Artisanal Toast 🍞' },
      { key: 'C', text: 'Blinkit ice cream tub ordered at 1 AM.', score_weight: 23, vibe_tag: 'Midnight Gelato 🍨' },
    ],
    domestic_tip: 'A well-stocked spice and Maggi cabinet has defused 100% of midnight hunger crises.',
  },
  {
    id: 'q-19',
    question_order: 19,
    category: 'work_habits',
    game_category: 'fun_compatibility',
    question_text: 'Your work environment beverage companion:',
    options: [
      { key: 'A', text: 'South Indian filter coffee with frothy chicory brew.', score_weight: 25, vibe_tag: 'Filter Coffee Devotee ☕' },
      { key: 'B', text: 'Adrak Elaichi chai brewed in a brass pan.', score_weight: 25, vibe_tag: 'Masala Chai Purist 🫖' },
      { key: 'C', text: 'Cold brew or matcha latte with oat milk.', score_weight: 23, vibe_tag: 'Matcha & Cold Brew 🍵' },
    ],
    domestic_tip: 'Chai and coffee making is the greatest organic conversation starter in shared flats.',
  },
]
