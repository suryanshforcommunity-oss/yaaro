export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          full_name: string
          avatar_url: string | null
          phone: string | null
          bio: string | null
          age: number | null
          gender: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | null
          occupation: string | null
          company_or_college: string | null
          city: string
          locality: string | null
          budget_min: number | null
          budget_max: number | null
          move_in_date: string | null
          verification_tier: 'unverified' | 'basic_phone' | 'work_or_college' | 'gov_id_verified'
          is_looking_for_room: boolean
          is_looking_for_roommate: boolean
          audio_vibe_url: string | null
          is_profile_public: boolean
          profile_completed_percentage?: number
          onboarded?: boolean
          instagram_handle?: string | null
          linkedin_handle?: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          full_name: string
          avatar_url?: string | null
          phone?: string | null
          bio?: string | null
          age?: number | null
          gender?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | null
          occupation?: string | null
          company_or_college?: string | null
          city?: string
          locality?: string | null
          budget_min?: number | null
          budget_max?: number | null
          move_in_date?: string | null
          verification_tier?: 'unverified' | 'basic_phone' | 'work_or_college' | 'gov_id_verified'
          is_looking_for_room?: boolean
          is_looking_for_roommate?: boolean
          audio_vibe_url?: string | null
          is_profile_public?: boolean
          profile_completed_percentage?: number
          onboarded?: boolean
          instagram_handle?: string | null
          linkedin_handle?: string | null
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          preferred_cities: string[]
          preferred_localities: string[]
          room_type_preference: string[]
          target_budget_min: number
          target_budget_max: number
          preferred_gender: 'any' | 'female_only' | 'male_only'
          dietary_preference: 'any' | 'vegetarian' | 'vegan' | 'non_vegetarian' | 'eggetarian'
          pet_tolerance: 'pet_friendly' | 'no_pets' | 'has_pets'
          smoking_tolerance: 'non_smoker' | 'outside_only' | 'open_to_smokers'
          drinking_tolerance: 'teetotaler' | 'social' | 'regular'
          sleeping_schedule?: 'early_bird' | 'night_owl' | 'flexible'
          work_schedule?: 'wfh' | 'office' | 'hybrid' | 'student'
          cleanliness_level?: number
          social_lifestyle?: 'introvert' | 'balanced' | 'extrovert'
          hobbies?: string[]
          privacy_hide_phone?: boolean
          privacy_hide_age?: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          preferred_cities?: string[]
          preferred_localities?: string[]
          room_type_preference?: string[]
          target_budget_min?: number
          target_budget_max?: number
          preferred_gender?: 'any' | 'female_only' | 'male_only'
          dietary_preference?: 'any' | 'vegetarian' | 'vegan' | 'non_vegetarian' | 'eggetarian'
          pet_tolerance?: 'pet_friendly' | 'no_pets' | 'has_pets'
          smoking_tolerance?: 'non_smoker' | 'outside_only' | 'open_to_smokers'
          drinking_tolerance?: 'teetotaler' | 'social' | 'regular'
          sleeping_schedule?: 'early_bird' | 'night_owl' | 'flexible'
          work_schedule?: 'wfh' | 'office' | 'hybrid' | 'student'
          cleanliness_level?: number
          social_lifestyle?: 'introvert' | 'balanced' | 'extrovert'
          hobbies?: string[]
          privacy_hide_phone?: boolean
          privacy_hide_age?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['user_preferences']['Insert']>
      }
      photos: {
        Row: {
          id: string
          created_at: string
          user_id: string
          listing_id: string | null
          storage_path: string
          photo_type: 'profile' | 'lifestyle' | 'room_main' | 'room_bedroom' | 'room_balcony' | 'room_bathroom' | 'room_common'
          display_order: number
          is_verified: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          listing_id?: string | null
          storage_path: string
          photo_type: 'profile' | 'lifestyle' | 'room_main' | 'room_bedroom' | 'room_balcony' | 'room_bathroom' | 'room_common'
          display_order?: number
          is_verified?: boolean
        }
        Update: Partial<Database['public']['Tables']['photos']['Insert']>
      }
      quiz_questions: {
        Row: {
          id: string
          question_order: number
          category: 'cleanliness' | 'sleep_noise' | 'food_kitchen' | 'guests_parties' | 'chores_sharing' | 'expenses_attitude' | 'work_habits' | 'social_lifestyle'
          game_category?: 'lifestyle_match' | 'personality_match' | 'roommate_situations' | 'fun_compatibility'
          question_text: string
          options: Json
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          question_order: number
          category: 'cleanliness' | 'sleep_noise' | 'food_kitchen' | 'guests_parties' | 'chores_sharing' | 'expenses_attitude' | 'work_habits' | 'social_lifestyle'
          game_category?: 'lifestyle_match' | 'personality_match' | 'roommate_situations' | 'fun_compatibility'
          question_text: string
          options: Json
          is_active?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['quiz_questions']['Insert']>
      }
      quiz_answers: {
        Row: {
          id: string
          user_id: string
          question_id: string
          selected_option_key: string
          importance_weight: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question_id: string
          selected_option_key: string
          importance_weight?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['quiz_answers']['Insert']>
      }
      compatibility_results: {
        Row: {
          id: string
          user_a: string
          user_b: string
          harmony_score: number
          dimension_scores: Json
          mutual_tags: string[]
          friction_notes: string[]
          calculated_at: string
        }
        Insert: {
          id?: string
          user_a: string
          user_b: string
          harmony_score: number
          dimension_scores?: Json
          mutual_tags?: string[]
          friction_notes?: string[]
          calculated_at?: string
        }
        Update: Partial<Database['public']['Tables']['compatibility_results']['Insert']>
      }
      likes: {
        Row: {
          id: string
          sender_id: string
          target_user_id: string | null
          target_listing_id: string | null
          like_type: 'roommate_like' | 'roommate_pass' | 'super_vibe' | 'listing_bookmark'
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          target_user_id?: string | null
          target_listing_id?: string | null
          like_type: 'roommate_like' | 'roommate_pass' | 'super_vibe' | 'listing_bookmark'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['likes']['Insert']>
      }
      matches: {
        Row: {
          id: string
          user_a: string
          user_b: string
          harmony_score: number
          matched_at: string
          status: 'active' | 'unmatched' | 'archived'
        }
        Insert: {
          id?: string
          user_a: string
          user_b: string
          harmony_score?: number
          matched_at?: string
          status?: 'active' | 'unmatched' | 'archived'
        }
        Update: Partial<Database['public']['Tables']['matches']['Insert']>
      }
      conversations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          conversation_type: 'direct' | 'flat_group'
          title: string | null
          associated_listing_id: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          conversation_type?: 'direct' | 'flat_group'
          title?: string | null
          associated_listing_id?: string | null
          metadata?: Json
        }
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>
      }
      conversation_participants: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          joined_at: string
          last_read_at: string
          is_muted: boolean
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          joined_at?: string
          last_read_at?: string
          is_muted?: boolean
        }
        Update: Partial<Database['public']['Tables']['conversation_participants']['Insert']>
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          message_type: 'text' | 'image' | 'video_tour' | 'system_match' | 'flat_agreement' | 'expense_split' | 'visit_schedule'
          content: string
          metadata: Json
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          message_type?: 'text' | 'image' | 'video_tour' | 'system_match' | 'flat_agreement' | 'expense_split' | 'visit_schedule'
          content: string
          metadata?: Json
          is_read?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
      room_listings: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          host_id: string
          title: string
          description: string
          rent_amount: number
          deposit_amount: number
          city: string
          locality: string
          full_address: string | null
          property_type: 'apartment' | 'independent_house' | 'villa' | 'gated_society' | 'pg'
          room_type: 'private' | 'shared'
          attached_bathroom: boolean
          available_from: string
          furnishing_status: 'fully_furnished' | 'semi_furnished' | 'unfurnished'
          amenities: string[]
          current_flatmates_count: number
          brokerage_amount: number
          is_verified_listing: boolean
          status: 'available' | 'reserved' | 'occupied' | 'hidden'
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          host_id: string
          title: string
          description: string
          rent_amount: number
          deposit_amount: number
          city: string
          locality: string
          full_address?: string | null
          property_type: 'apartment' | 'independent_house' | 'villa' | 'gated_society' | 'pg'
          room_type: 'private' | 'shared'
          attached_bathroom?: boolean
          available_from: string
          furnishing_status: 'fully_furnished' | 'semi_furnished' | 'unfurnished'
          amenities?: string[]
          current_flatmates_count?: number
          brokerage_amount?: number
          is_verified_listing?: boolean
          status?: 'available' | 'reserved' | 'occupied' | 'hidden'
        }
        Update: Partial<Database['public']['Tables']['room_listings']['Insert']>
      }
      saved_listings: {
        Row: {
          id: string
          user_id: string
          listing_id: string
          saved_at: string
        }
        Insert: {
          id?: string
          user_id: string
          listing_id: string
          saved_at?: string
        }
        Update: Partial<Database['public']['Tables']['saved_listings']['Insert']>
      }
      shared_expenses: {
        Row: {
          id: string
          created_at: string
          group_id: string
          paid_by: string
          title: string
          amount: number
          category: 'rent' | 'cook_maid' | 'groceries' | 'utilities' | 'wifi' | 'house_repairs' | 'party_leisure' | 'other'
          split_type: 'equal' | 'exact_amounts' | 'percentage'
          receipt_url: string | null
          notes: string | null
          status: 'active' | 'settled' | 'cancelled'
        }
        Insert: {
          id?: string
          created_at?: string
          group_id: string
          paid_by: string
          title: string
          amount: number
          category: 'rent' | 'cook_maid' | 'groceries' | 'utilities' | 'wifi' | 'house_repairs' | 'party_leisure' | 'other'
          split_type?: 'equal' | 'exact_amounts' | 'percentage'
          receipt_url?: string | null
          notes?: string | null
          status?: 'active' | 'settled' | 'cancelled'
        }
        Update: Partial<Database['public']['Tables']['shared_expenses']['Insert']>
      }
      expense_participants: {
        Row: {
          id: string
          expense_id: string
          user_id: string
          share_amount: number
          is_settled: boolean
          settled_at: string | null
          payment_reference: string | null
        }
        Insert: {
          id?: string
          expense_id: string
          user_id: string
          share_amount: number
          is_settled?: boolean
          settled_at?: string | null
          payment_reference?: string | null
        }
        Update: Partial<Database['public']['Tables']['expense_participants']['Insert']>
      }
      verification_records: {
        Row: {
          id: string
          user_id: string
          verification_type: 'aadhaar' | 'digilocker' | 'work_email' | 'college_id' | 'social_linkedin'
          verification_status: 'pending' | 'approved' | 'rejected'
          verified_data: Json
          submitted_at: string
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          verification_type: 'aadhaar' | 'digilocker' | 'work_email' | 'college_id' | 'social_linkedin'
          verification_status?: 'pending' | 'approved' | 'rejected'
          verified_data?: Json
          submitted_at?: string
          reviewed_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['verification_records']['Insert']>
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_tier: 'free' | 'yaaro_pro' | 'landlord_verified'
          billing_cycle: 'monthly' | 'quarterly' | 'annual'
          valid_from: string
          valid_until: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_tier?: 'free' | 'yaaro_pro' | 'landlord_verified'
          billing_cycle?: 'monthly' | 'quarterly' | 'annual'
          valid_from?: string
          valid_until: string
          is_active?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'match_received' | 'message_new' | 'expense_split' | 'expense_settled' | 'visit_scheduled' | 'verification_update' | 'system'
          title: string
          body: string
          action_url: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'match_received' | 'message_new' | 'expense_split' | 'expense_settled' | 'visit_scheduled' | 'verification_update' | 'system'
          title: string
          body: string
          action_url?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
      reports_and_blocks: {
        Row: {
          id: string
          reporter_id: string
          target_user_id: string | null
          target_listing_id: string | null
          action_type: 'report' | 'block' | 'report_and_block'
          reason: 'broker_disguised' | 'inaccurate_photos' | 'harassment' | 'scam_deposit' | 'discriminatory_behavior' | 'spam' | 'other'
          details: string | null
          status: 'pending' | 'investigating' | 'action_taken' | 'dismissed'
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          target_user_id?: string | null
          target_listing_id?: string | null
          action_type: 'report' | 'block' | 'report_and_block'
          reason: 'broker_disguised' | 'inaccurate_photos' | 'harassment' | 'scam_deposit' | 'discriminatory_behavior' | 'spam' | 'other'
          details?: string | null
          status?: 'pending' | 'investigating' | 'action_taken' | 'dismissed'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['reports_and_blocks']['Insert']>
      }
      game_challenges: {
        Row: {
          id: string
          challenger_id: string
          challenged_id: string
          game_category: 'lifestyle_match' | 'personality_match' | 'roommate_situations' | 'fun_compatibility'
          status: 'pending' | 'completed' | 'declined'
          harmony_score: number | null
          dimension_scores: Json
          answers_summary: Json
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          challenger_id: string
          challenged_id: string
          game_category: 'lifestyle_match' | 'personality_match' | 'roommate_situations' | 'fun_compatibility'
          status?: 'pending' | 'completed' | 'declined'
          harmony_score?: number | null
          dimension_scores?: Json
          answers_summary?: Json
          created_at?: string
          completed_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['game_challenges']['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
