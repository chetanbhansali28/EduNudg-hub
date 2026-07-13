export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics_daily_brand: {
        Row: {
          active_centers: number | null
          brand_id: string
          created_at: string
          created_by: string | null
          enrollments_count: number | null
          id: string
          metric_date: string
          revenue_cents: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active_centers?: number | null
          brand_id: string
          created_at?: string
          created_by?: string | null
          enrollments_count?: number | null
          id?: string
          metric_date: string
          revenue_cents?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active_centers?: number | null
          brand_id?: string
          created_at?: string
          created_by?: string | null
          enrollments_count?: number | null
          id?: string
          metric_date?: string
          revenue_cents?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_daily_brand_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_daily_center: {
        Row: {
          brand_id: string
          center_id: string
          created_at: string
          created_by: string | null
          enrollments_count: number | null
          fees_collected_cents: number | null
          id: string
          leads_count: number | null
          metric_date: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_id: string
          center_id: string
          created_at?: string
          created_by?: string | null
          enrollments_count?: number | null
          fees_collected_cents?: number | null
          id?: string
          leads_count?: number | null
          metric_date: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_id?: string
          center_id?: string
          created_at?: string
          created_by?: string | null
          enrollments_count?: number | null
          fees_collected_cents?: number | null
          id?: string
          leads_count?: number | null
          metric_date?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_daily_center_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_daily_center_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "franchise_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_audit_logs: {
        Row: {
          created_at: string
          created_by: string | null
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          provider: Database["public"]["Enums"]["auth_provider"] | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          provider?: Database["public"]["Enums"]["auth_provider"] | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          provider?: Database["public"]["Enums"]["auth_provider"] | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auth_identities: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          last_used_at: string | null
          linked_at: string
          phone_e164: string | null
          provider: Database["public"]["Enums"]["auth_provider"]
          provider_user_id: string | null
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          last_used_at?: string | null
          linked_at?: string
          phone_e164?: string | null
          provider: Database["public"]["Enums"]["auth_provider"]
          provider_user_id?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          last_used_at?: string | null
          linked_at?: string
          phone_e164?: string | null
          provider?: Database["public"]["Enums"]["auth_provider"]
          provider_user_id?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      auth_rate_limits: {
        Row: {
          attempt_count: number
          created_at: string
          created_by: string | null
          id: string
          phone_e164: string
          updated_at: string
          updated_by: string | null
          window_start: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          created_by?: string | null
          id?: string
          phone_e164: string
          updated_at?: string
          updated_by?: string | null
          window_start?: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          created_by?: string | null
          id?: string
          phone_e164?: string
          updated_at?: string
          updated_by?: string | null
          window_start?: string
        }
        Relationships: []
      }
      batch_enrollments: {
        Row: {
          batch_id: string
          brand_id: string
          center_id: string
          created_at: string
          created_by: string | null
          enrollment_id: string | null
          id: string
          student_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          batch_id: string
          brand_id: string
          center_id: string
          created_at?: string
          created_by?: string | null
          enrollment_id?: string | null
          id?: string
          student_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          batch_id?: string
          brand_id?: string
          center_id?: string
          created_at?: string
          created_by?: string | null
          enrollment_id?: string | null
          id?: string
          student_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "batch_enrollments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_enrollments_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_enrollments_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "franchise_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_enrollments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_join_events: {
        Row: {
          batch_enrollment_id: string
          batch_id: string
          brand_id: string
          center_id: string
          created_at: string
          id: string
          joined_at: string
          seen_at: string | null
          student_id: string
        }
        Insert: {
          batch_enrollment_id: string
          batch_id: string
          brand_id: string
          center_id: string
          created_at?: string
          id?: string
          joined_at?: string
          seen_at?: string | null
          student_id: string
        }
        Update: {
          batch_enrollment_id?: string
          batch_id?: string
          brand_id?: string
          center_id?: string
          created_at?: string
          id?: string
          joined_at?: string
          seen_at?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_join_events_batch_enrollment_id_fkey"
            columns: ["batch_enrollment_id"]
            isOneToOne: false
            referencedRelation: "batch_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_join_events_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_join_events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_join_events_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "franchise_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_join_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      batches: {
        Row: {
          brand_id: string
          center_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          is_open_for_enrollment: boolean
          level_end_id: string | null
          level_id: string | null
          level_start_id: string | null
          name: string
          program_id: string | null
          schedule: Json | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_id: string
          center_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_open_for_enrollment?: boolean
          level_end_id?: string | null
          level_id?: string | null
          level_start_id?: string | null
          name: string
          program_id?: string | null
          schedule?: Json | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_id?: string
          center_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_open_for_enrollment?: boolean
          level_end_id?: string | null
          level_id?: string | null
          level_start_id?: string | null
          name?: string
          program_id?: string | null
          schedule?: Json | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "batches_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "franchise_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_level_end_id_fkey"
            columns: ["level_end_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_level_start_id_fkey"
            columns: ["level_start_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_campaigns: {
        Row: {
          brand_id: string
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          goal_type: string
          id: string
          is_active: boolean
          name: string
          starts_at: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          goal_type?: string
          id?: string
          is_active?: boolean
          name: string
          starts_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          goal_type?: string
          id?: string
          is_active?: boolean
          name?: string
          starts_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_campaigns_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_competitions: {
        Row: {
          brand_id: string
          created_at: string
          created_by: string | null
          description: string | null
          eligibility_rules: Json
          event_date: string | null
          fee_amount: number | null
          fee_currency: string
          fee_type: string
          id: string
          is_active: boolean
          location: string | null
          max_participants: number | null
          name: string
          registration_closes_at: string | null
          registration_mode: string
          registration_opens_at: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          eligibility_rules?: Json
          event_date?: string | null
          fee_amount?: number | null
          fee_currency?: string
          fee_type?: string
          id?: string
          is_active?: boolean
          location?: string | null
          max_participants?: number | null
          name: string
          registration_closes_at?: string | null
          registration_mode?: string
          registration_opens_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          eligibility_rules?: Json
          event_date?: string | null
          fee_amount?: number | null
          fee_currency?: string
          fee_type?: string
          id?: string
          is_active?: boolean
          location?: string | null
          max_participants?: number | null
          name?: string
          registration_closes_at?: string | null
          registration_mode?: string
          registration_opens_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_competitions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_settings: {
        Row: {
          brand_id: string
          created_at: string
          created_by: string | null
          id: string
          settings: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_settings_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: true
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_status_events: {
        Row: {
          brand_id: string
          created_at: string
          created_by: string | null
          from_status: Database["public"]["Enums"]["brand_status"] | null
          id: string
          reason: string | null
          to_status: Database["public"]["Enums"]["brand_status"]
        }
        Insert: {
          brand_id: string
          created_at?: string
          created_by?: string | null
          from_status?: Database["public"]["Enums"]["brand_status"] | null
          id?: string
          reason?: string | null
          to_status: Database["public"]["Enums"]["brand_status"]
        }
        Update: {
          brand_id?: string
          created_at?: string
          created_by?: string | null
          from_status?: Database["public"]["Enums"]["brand_status"] | null
          id?: string
          reason?: string | null
          to_status?: Database["public"]["Enums"]["brand_status"]
        }
        Relationships: [
          {
            foreignKeyName: "brand_status_events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_subscriptions: {
        Row: {
          brand_id: string
          created_at: string
          created_by: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          created_by?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          created_by?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_subscriptions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_success_stories: {
        Row: {
          author_name: string
          author_role: string | null
          brand_id: string
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          is_published: boolean
          quote: string
          rating: number | null
          sort_order: number
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          author_name: string
          author_role?: string | null
          brand_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          quote: string
          rating?: number | null
          sort_order?: number
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          author_name?: string
          author_role?: string | null
          brand_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          quote?: string
          rating?: number | null
          sort_order?: number
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_success_stories_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_themes: {
        Row: {
          brand_id: string
          created_at: string
          created_by: string | null
          id: string
          tokens: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          tokens?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          tokens?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_themes_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: true
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          logo_url: string | null
          marketing_theme: string
          name: string
          slug: string
          status: Database["public"]["Enums"]["brand_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          logo_url?: string | null
          marketing_theme?: string
          name: string
          slug: string
          status?: Database["public"]["Enums"]["brand_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          logo_url?: string | null
          marketing_theme?: string
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["brand_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      center_program_enablement: {
        Row: {
          authorized_at: string
          authorized_by: string | null
          brand_id: string
          center_id: string
          created_at: string
          created_by: string | null
          id: string
          program_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          authorized_at?: string
          authorized_by?: string | null
          brand_id: string
          center_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          program_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          authorized_at?: string
          authorized_by?: string | null
          brand_id?: string
          center_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          program_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "center_program_enablement_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "center_program_enablement_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "franchise_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "center_program_enablement_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      center_status_events: {
        Row: {
          brand_id: string
          center_id: string
          created_at: string
          created_by: string | null
          from_status: Database["public"]["Enums"]["center_status"] | null
          id: string
          reason: string | null
          to_status: Database["public"]["Enums"]["center_status"]
        }
        Insert: {
          brand_id: string
          center_id: string
          created_at?: string
          created_by?: string | null
          from_status?: Database["public"]["Enums"]["center_status"] | null
          id?: string
          reason?: string | null
          to_status: Database["public"]["Enums"]["center_status"]
        }
        Update: {
          brand_id?: string
          center_id?: string
          created_at?: string
          created_by?: string | null
          from_status?: Database["public"]["Enums"]["center_status"] | null
          id?: string
          reason?: string | null
          to_status?: Database["public"]["Enums"]["center_status"]
        }
        Relationships: [
          {
            foreignKeyName: "center_status_events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "center_status_events_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "franchise_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_mappings: {
        Row: {
          brand_id: string | null
          center_id: string | null
          created_at: string
          created_by: string | null
          hostname: string
          id: string
          is_primary: boolean
          portal_type: Database["public"]["Enums"]["portal_type"]
          ssl_status: string | null
          updated_at: string
          updated_by: string | null
          verified_at: string | null
        }
        Insert: {
          brand_id?: string | null
          center_id?: string | null
          created_at?: string
          created_by?: string | null
          hostname: string
          id?: string
          is_primary?: boolean
          portal_type: Database["public"]["Enums"]["portal_type"]
          ssl_status?: string | null
          updated_at?: string
          updated_by?: string | null
          verified_at?: string | null
        }
        Update: {
          brand_id?: string | null
          center_id?: string | null
          created_at?: string
          created_by?: string | null
          hostname?: string
          id?: string
          is_primary?: boolean
          portal_type?: Database["public"]["Enums"]["portal_type"]
          ssl_status?: string | null
          updated_at?: string
          updated_by?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domain_mappings_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domain_mappings_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "franchise_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollment_history: {
        Row: {
          brand_id: string
          created_at: string
          created_by: string | null
          enrollment_id: string
          event_type: string
          from_center_id: string | null
          id: string
          metadata: Json | null
          to_center_id: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          created_by?: string | null
          enrollment_id: string
          event_type: string
          from_center_id?: string | null
          id?: string
          metadata?: Json | null
          to_center_id?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          created_by?: string | null
          enrollment_id?: string
          event_type?: string
          from_center_id?: string | null
          id?: string
          metadata?: Json | null
          to_center_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_history_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_history_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_plans: {
        Row: {
          amount_cents: number
          billing_cycle: string | null
          brand_id: string
          center_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          id: string
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount_cents: number
          billing_cycle?: string | null
          brand_id: string
          center_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount_cents?: number
          billing_cycle?: string | null
          brand_id?: string
          center_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_plans_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_plans_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "franchise_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_events: {
        Row: {
          amount_cents: number
          brand_id: string | null
          center_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          event_type: string
          id: string
          metadata: Json | null
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          amount_cents: number
          brand_id?: string | null
          center_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          event_type: string
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          amount_cents?: number
          brand_id?: string | null
          center_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_events_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "franchise_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_centers: {
        Row: {
          address_line1: string | null
          brand_id: string
          city: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          display_name: string | null
          id: string
          name: string
          photo_url: string | null
          pincode: string | null
          region: string | null
          short_description: string | null
          slug: string
          social_links: Json
          status: Database["public"]["Enums"]["center_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address_line1?: string | null
          brand_id: string
          city?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          display_name?: string | null
          id?: string
          name: string
          photo_url?: string | null
          pincode?: string | null
          region?: string | null
          short_description?: string | null
          slug: string
          social_links?: Json
          status?: Database["public"]["Enums"]["center_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address_line1?: string | null
          brand_id?: string
          city?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          display_name?: string | null
          id?: string
          name?: string
          photo_url?: string | null
          pincode?: string | null
          region?: string | null
          short_description?: string | null
          slug?: string
          social_links?: Json
          status?: Database["public"]["Enums"]["center_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "franchise_centers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_inquiries: {
        Row: {
          address_line: string | null
          brand_id: string
          city: string | null
          converted_center_id: string | null
          created_at: string
          created_by: string | null
          email: string
          full_name: string
          id: string
          message: string | null
          phone_e164: string | null
          pincode: string | null
          prior_experience: string | null
          proposed_franchise_name: string | null
          rejected_reason: string | null
          state: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address_line?: string | null
          brand_id: string
          city?: string | null
          converted_center_id?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          full_name: string
          id?: string
          message?: string | null
          phone_e164?: string | null
          pincode?: string | null
          prior_experience?: string | null
          proposed_franchise_name?: string | null
          rejected_reason?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address_line?: string | null
          brand_id?: string
          city?: string | null
          converted_center_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          phone_e164?: string | null
          pincode?: string | null
          prior_experience?: string | null
          proposed_franchise_name?: string | null
          rejected_reason?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "franchise_inquiries_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "franchise_inquiries_converted_center_id_fkey"
            columns: ["converted_center_id"]
            isOneToOne: false
            referencedRelation: "franchise_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          brand_id: string
          created_at: string
          created_by: string | null
          id: string
          item_type: string | null
          name: string
          sku: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          item_type?: string | null
          name: string
          sku?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          item_type?: string | null
          name?: string
          sku?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_stock: {
        Row: {
          brand_id: string
          center_id: string
          created_at: string
          created_by: string | null
          id: string
          item_id: string
          quantity: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_id: string
          center_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          item_id: string
          quantity?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_id?: string
          center_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          item_id?: string
          quantity?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_stock_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_stock_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "franchise_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_stock_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_cents: number
          brand_id: string
          center_id: string
          created_at: string
          created_by: string | null
          currency: string
          due_at: string | null
          id: string
          invoice_number: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          student_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount_cents: number
          brand_id: string
          center_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          due_at?: string | null
          id?: string
          invoice_number?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          student_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount_cents?: number
          brand_id?: string
          center_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          due_at?: string | null
          id?: string
          invoice_number?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          student_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "franchise_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_assignment_history: {
        Row: {
          assigned_by: string | null
          brand_id: string
          created_at: string
          from_center_id: string | null
          id: string
          lead_id: string
          to_center_id: string
        }
        Insert: {
          assigned_by?: string | null
          brand_id: string
          created_at?: string
          from_center_id?: string | null
          id?: string
          lead_id: string
          to_center_id: string
        }
        Update: {
          assigned_by?: string | null
          brand_id?: string
          created_at?: string
          from_center_id?: string | null
          id?: string
          lead_id?: string
          to_center_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_assignment_history_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_assignment_history_from_center_id_fkey"
            columns: ["from_center_id"]
            isOneToOne: false
            referencedRelation: "franchise_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_assignment_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_assignment_history_to_center_id_fkey"
            columns: ["to_center_id"]
            isOneToOne: false
            referencedRelation: "franchise_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_events: {
        Row: {
          brand_id: string
          created_at: string
          created_by: string | null
          event_type: string
          id: string
          lead_id: string
          payload: Json | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          created_by?: string | null
          event_type: string
          id?: string
          lead_id: string
          payload?: Json | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          created_by?: string | null
          event_type?: string
          id?: string
          lead_id?: string
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          brand_id: string
          center_id: string | null
          child_age_years: number | null
          child_dob: string | null
          child_name: string | null
          city: string | null
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string
          id: string
          last_center_action_at: string | null
          lead_source: string | null
          lost_reason: string | null
          notes: string | null
          parent_name: string | null
          phone_e164: string | null
          pincode: string | null
          school_name: string | null
          source: string | null
          stale_at: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          updated_by: string | null
          whatsapp_e164: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          brand_id: string
          center_id?: string | null
          child_age_years?: number | null
          child_dob?: string | null
          child_name?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          last_center_action_at?: string | null
          lead_source?: string | null
          lost_reason?: string | null
          notes?: string | null
          parent_name?: string | null
          phone_e164?: string | null
          pincode?: string | null
          school_name?: string | null
          source?: string | null
          stale_at?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          updated_by?: string | null
          whatsapp_e164?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          brand_id?: string
          center_id?: string | null
          child_age_years?: number | null
          child_dob?: string | null
          child_name?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          last_center_action_at?: string | null
          lead_source?: string | null
          lost_reason?: string | null
          notes?: string | null
          parent_name?: string | null
          phone_e164?: string | null
          pincode?: string | null
          school_name?: string | null
          source?: string | null
          stale_at?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          updated_by?: string | null
          whatsapp_e164?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "franchise_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          brand_id: string
          content_type: string | null
          created_at: string
          created_by: string | null
          duration_minutes: number | null
          id: string
          module_id: string
          sort_order: number
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_id: string
          content_type?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number | null
          id?: string
          module_id: string
          sort_order?: number
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_id?: string
          content_type?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number | null
          id?: string
          module_id?: string
          sort_order?: number
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      levels: {
        Row: {
          abacus_level_code: string | null
          brand_id: string
          created_at: string
          created_by: string | null
          id: string
          marketing_video_url: string | null
          name: string
          program_id: string
          sort_order: number
          topics_covered: Json
          unlock_rules: Json | null
          updated_at: string
          updated_by: string | null
          what_you_learn: string | null
          why_take: string | null
        }
        Insert: {
          abacus_level_code?: string | null
          brand_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          marketing_video_url?: string | null
          name: string
          program_id: string
          sort_order?: number
          topics_covered?: Json
          unlock_rules?: Json | null
          updated_at?: string
          updated_by?: string | null
          what_you_learn?: string | null
          why_take?: string | null
        }
        Update: {
          abacus_level_code?: string | null
          brand_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          marketing_video_url?: string | null
          name?: string
          program_id?: string
          sort_order?: number
          topics_covered?: Json
          unlock_rules?: Json | null
          updated_at?: string
          updated_by?: string | null
          what_you_learn?: string | null
          why_take?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "levels_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "levels_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          accepted_at: string | null
          brand_id: string | null
          center_id: string | null
          created_at: string
          created_by: string | null
          id: string
          invited_at: string | null
          role_key: string
          scope_type: Database["public"]["Enums"]["scope_type"]
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          brand_id?: string | null
          center_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          invited_at?: string | null
          role_key: string
          scope_type: Database["public"]["Enums"]["scope_type"]
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          brand_id?: string | null
          center_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          invited_at?: string | null
          role_key?: string
          scope_type?: Database["public"]["Enums"]["scope_type"]
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "franchise_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      merchandise_catalog: {
        Row: {
          brand_id: string
          created_at: string
          created_by: string | null
          currency: string
          id: string
          is_active: boolean
          name: string
          photo_urls: string[]
          price_cents: number
          sku: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          is_active?: boolean
          name: string
          photo_urls?: string[]
          price_cents?: number
          sku: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          is_active?: boolean
          name?: string
          photo_urls?: string[]
          price_cents?: number
          sku?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kit_catalog_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      merchandise_invoices: {
        Row: {
          amount_cents: number
          brand_id: string
          center_id: string
          created_at: string
          created_by: string | null
          currency: string
          due_at: string
          id: string
          invoice_number: string
          order_id: string
          pdf_storage_path: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount_cents: number
          brand_id: string
          center_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          due_at: string
          id?: string
          invoice_number: string
          order_id: string
          pdf_storage_path?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount_cents?: number
          brand_id?: string
          center_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          due_at?: string
          id?: string
          invoice_number?: string
          order_id?: string
          pdf_storage_path?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchandise_invoices_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchandise_invoices_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "franchise_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchandise_invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "merchandise_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      merchandise_order_lines: {
        Row: {
          catalog_item_id: string
          created_at: string
          id: string
          order_id: string
          quantity: number
          student_id: string | null
          unit_price_cents: number
        }
        Insert: {
          catalog_item_id: string
          created_at?: string
          id?: string
          order_id: string
          quantity?: number
          student_id?: string | null
          unit_price_cents: number
        }
        Update: {
          catalog_item_id?: string
          created_at?: string
          id?: string
          order_id?: string
          quantity?: number
          student_id?: string | null
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "kit_order_lines_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "merchandise_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kit_order_lines_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "merchandise_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchandise_order_lines_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      merchandise_orders: {
        Row: {
          brand_id: string
          center_id: string
          completed_at: string | null
          completed_by_role: string | null
          created_at: string
          created_by: string | null
          discount_cents: number
          id: string
          payment_method: string | null
          payment_status: string
          promo_code_id: string | null
          razorpay_order_id: string | null
          received_at: string | null
          shipping_address: Json | null
          shipping_mode: string | null
          shipping_tracking: Json
          status: string
          subtotal_cents: number
          total_cents: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_id: string
          center_id: string
          completed_at?: string | null
          completed_by_role?: string | null
          created_at?: string
          created_by?: string | null
          discount_cents?: number
          id?: string
          payment_method?: string | null
          payment_status?: string
          promo_code_id?: string | null
          razorpay_order_id?: string | null
          received_at?: string | null
          shipping_address?: Json | null
          shipping_mode?: string | null
          shipping_tracking?: Json
          status?: string
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_id?: string
          center_id?: string
          completed_at?: string | null
          completed_by_role?: string | null
          created_at?: string
          created_by?: string | null
          discount_cents?: number
          id?: string
          payment_method?: string | null
          payment_status?: string
          promo_code_id?: string | null
          razorpay_order_id?: string | null
          received_at?: string | null
          shipping_address?: Json | null
          shipping_mode?: string | null
          shipping_tracking?: Json
          status?: string
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kit_orders_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kit_orders_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "franchise_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchandise_orders_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "merchandise_promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      merchandise_payments: {
        Row: {
          amount_cents: number
          brand_id: string
          center_id: string
          created_at: string
          created_by: string | null
          currency: string
          id: string
          invoice_id: string | null
          method: string
          order_id: string
          paid_at: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          reference_notes: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount_cents: number
          brand_id: string
          center_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          invoice_id?: string | null
          method: string
          order_id: string
          paid_at?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          reference_notes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount_cents?: number
          brand_id?: string
          center_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          invoice_id?: string | null
          method?: string
          order_id?: string
          paid_at?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          reference_notes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchandise_payments_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchandise_payments_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "franchise_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchandise_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "merchandise_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchandise_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "merchandise_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      merchandise_promo_codes: {
        Row: {
          brand_id: string
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          max_uses: number | null
          min_quantity: number
          updated_at: string
          updated_by: string | null
          use_count: number
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          brand_id: string
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_quantity?: number
          updated_at?: string
          updated_by?: string | null
          use_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          brand_id?: string
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_quantity?: number
          updated_at?: string
          updated_by?: string | null
          use_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchandise_promo_codes_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      merchandise_reminder_log: {
        Row: {
          brand_id: string
          center_id: string
          channel: string
          created_at: string
          id: string
          invoice_id: string | null
          metadata: Json
          order_id: string
          recipient_email: string | null
          reminder_type: string
          sent_at: string
        }
        Insert: {
          brand_id: string
          center_id: string
          channel: string
          created_at?: string
          id?: string
          invoice_id?: string | null
          metadata?: Json
          order_id: string
          recipient_email?: string | null
          reminder_type: string
          sent_at?: string
        }
        Update: {
          brand_id?: string
          center_id?: string
          channel?: string
          created_at?: string
          id?: string
          invoice_id?: string | null
          metadata?: Json
          order_id?: string
          recipient_email?: string | null
          reminder_type?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchandise_reminder_log_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchandise_reminder_log_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "franchise_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchandise_reminder_log_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "merchandise_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchandise_reminder_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "merchandise_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          brand_id: string
          created_at: string
          created_by: string | null
          id: string
          level_id: string
          sort_order: number
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          level_id: string
          sort_order?: number
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          level_id?: string
          sort_order?: number
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modules_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modules_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_student_links: {
        Row: {
          brand_id: string
          created_at: string
          created_by: string | null
          id: string
          parent_id: string
          relationship: string | null
          student_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          parent_id: string
          relationship?: string | null
          student_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          parent_id?: string
          relationship?: string | null
          student_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_student_links_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_student_links_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_student_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      parents: {
        Row: {
          brand_id: string
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string
          id: string
          phone_e164: string | null
          updated_at: string
          updated_by: string | null
          user_id: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          phone_e164?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone_e164?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parents_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      passkey_credentials: {
        Row: {
          created_at: string
          created_by: string | null
          credential_id: string
          device_name: string | null
          id: string
          public_key: string
          sign_count: number
          transports: string[] | null
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          credential_id: string
          device_name?: string | null
          id?: string
          public_key: string
          sign_count?: number
          transports?: string[] | null
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          credential_id?: string
          device_name?: string | null
          id?: string
          public_key?: string
          sign_count?: number
          transports?: string[] | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          brand_id: string
          center_id: string
          created_at: string
          created_by: string | null
          currency: string
          id: string
          invoice_id: string | null
          method: string | null
          paid_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount_cents: number
          brand_id: string
          center_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          invoice_id?: string | null
          method?: string | null
          paid_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount_cents?: number
          brand_id?: string
          center_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          invoice_id?: string | null
          method?: string | null
          paid_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "franchise_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          brand_id: string | null
          center_id: string | null
          created_at: string
          created_by: string | null
          id: string
          payload: Json | null
          resource_id: string | null
          resource_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          brand_id?: string | null
          center_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json | null
          resource_id?: string | null
          resource_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          brand_id?: string | null
          center_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json | null
          resource_id?: string | null
          resource_type?: string
        }
        Relationships: []
      }
      platform_brand_signups: {
        Row: {
          admin_full_name: string
          city: string
          converted_brand_id: string | null
          country: string | null
          created_at: string
          created_by: string | null
          email: string
          id: string
          message: string | null
          phone_e164: string | null
          proposed_slug: string | null
          rejected_reason: string | null
          requested_name: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          admin_full_name: string
          city: string
          converted_brand_id?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          message?: string | null
          phone_e164?: string | null
          proposed_slug?: string | null
          rejected_reason?: string | null
          requested_name: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          admin_full_name?: string
          city?: string
          converted_brand_id?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          message?: string | null
          phone_e164?: string | null
          proposed_slug?: string | null
          rejected_reason?: string | null
          requested_name?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_brand_signups_converted_brand_id_fkey"
            columns: ["converted_brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_invoices: {
        Row: {
          amount_cents: number
          brand_id: string
          created_at: string
          created_by: string | null
          currency: string
          due_at: string | null
          id: string
          paid_at: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount_cents: number
          brand_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          due_at?: string | null
          id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount_cents?: number
          brand_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          due_at?: string | null
          id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_invoices_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone_e164: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone_e164?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone_e164?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          age_label: string | null
          brand_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean
          marketing_benefits: Json
          marketing_image_url: string | null
          marketing_video_url: string | null
          name: string
          scholarship_highlight: string | null
          updated_at: string
          updated_by: string | null
          what_you_learn: string | null
          why_take: string | null
        }
        Insert: {
          age_label?: string | null
          brand_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          marketing_benefits?: Json
          marketing_image_url?: string | null
          marketing_video_url?: string | null
          name: string
          scholarship_highlight?: string | null
          updated_at?: string
          updated_by?: string | null
          what_you_learn?: string | null
          why_take?: string | null
        }
        Update: {
          age_label?: string | null
          brand_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          marketing_benefits?: Json
          marketing_image_url?: string | null
          marketing_video_url?: string | null
          name?: string
          scholarship_highlight?: string | null
          updated_at?: string
          updated_by?: string | null
          what_you_learn?: string | null
          why_take?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "programs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      royalty_rules: {
        Row: {
          brand_id: string
          config: Json
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          rule_type: Database["public"]["Enums"]["royalty_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_id: string
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          rule_type: Database["public"]["Enums"]["royalty_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_id?: string
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          rule_type?: Database["public"]["Enums"]["royalty_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "royalty_rules_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      royalty_settlements: {
        Row: {
          amount_cents: number
          brand_id: string
          center_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          id: string
          period_end: string
          period_start: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount_cents: number
          brand_id: string
          center_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          period_end: string
          period_start: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount_cents?: number
          brand_id?: string
          center_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          period_end?: string
          period_start?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "royalty_settlements_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "royalty_settlements_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "franchise_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      student_assessments: {
        Row: {
          assessed_at: string
          assessment_type: string
          brand_id: string
          center_id: string
          created_at: string
          created_by: string | null
          enrollment_id: string | null
          id: string
          level_id: string | null
          max_score: number | null
          notes: string | null
          passed: boolean | null
          program_id: string | null
          score: number | null
          student_id: string
          updated_at: string
          updated_by: string | null
          visible_to_student: boolean
        }
        Insert: {
          assessed_at?: string
          assessment_type?: string
          brand_id: string
          center_id: string
          created_at?: string
          created_by?: string | null
          enrollment_id?: string | null
          id?: string
          level_id?: string | null
          max_score?: number | null
          notes?: string | null
          passed?: boolean | null
          program_id?: string | null
          score?: number | null
          student_id: string
          updated_at?: string
          updated_by?: string | null
          visible_to_student?: boolean
        }
        Update: {
          assessed_at?: string
          assessment_type?: string
          brand_id?: string
          center_id?: string
          created_at?: string
          created_by?: string | null
          enrollment_id?: string | null
          id?: string
          level_id?: string | null
          max_score?: number | null
          notes?: string | null
          passed?: boolean | null
          program_id?: string | null
          score?: number | null
          student_id?: string
          updated_at?: string
          updated_by?: string | null
          visible_to_student?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "student_assessments_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_assessments_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "franchise_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_assessments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_assessments_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_assessments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_assessments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_competition_entries: {
        Row: {
          brand_id: string
          center_id: string
          competition_id: string
          created_at: string
          created_by: string | null
          enrollment_id: string | null
          id: string
          notes: string | null
          rank_position: number | null
          result_rank: string | null
          score: number | null
          student_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_id: string
          center_id: string
          competition_id: string
          created_at?: string
          created_by?: string | null
          enrollment_id?: string | null
          id?: string
          notes?: string | null
          rank_position?: number | null
          result_rank?: string | null
          score?: number | null
          student_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_id?: string
          center_id?: string
          competition_id?: string
          created_at?: string
          created_by?: string | null
          enrollment_id?: string | null
          id?: string
          notes?: string | null
          rank_position?: number | null
          result_rank?: string | null
          score?: number | null
          student_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_competition_entries_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_competition_entries_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "franchise_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_competition_entries_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "brand_competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_competition_entries_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_competition_entries_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_competition_registrations: {
        Row: {
          brand_id: string
          center_id: string
          competition_id: string
          created_at: string
          created_by: string | null
          enrollment_id: string
          id: string
          registered_at: string
          registered_by: string | null
          status: string
          student_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_id: string
          center_id: string
          competition_id: string
          created_at?: string
          created_by?: string | null
          enrollment_id: string
          id?: string
          registered_at?: string
          registered_by?: string | null
          status?: string
          student_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_id?: string
          center_id?: string
          competition_id?: string
          created_at?: string
          created_by?: string | null
          enrollment_id?: string
          id?: string
          registered_at?: string
          registered_by?: string | null
          status?: string
          student_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_competition_registrations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_competition_registrations_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "franchise_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_competition_registrations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "brand_competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_competition_registrations_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_competition_registrations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_enrollments: {
        Row: {
          brand_id: string
          center_id: string
          created_at: string
          created_by: string | null
          ended_at: string | null
          enrolled_at: string
          id: string
          program_id: string | null
          starting_level_id: string | null
          status: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_id: string
          center_id: string
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          enrolled_at?: string
          id?: string
          program_id?: string | null
          starting_level_id?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_id?: string
          center_id?: string
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          enrolled_at?: string
          id?: string
          program_id?: string | null
          starting_level_id?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollments_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "franchise_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_starting_level_id_fkey"
            columns: ["starting_level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_level_progress: {
        Row: {
          brand_id: string
          center_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          enrollment_id: string | null
          id: string
          level_id: string | null
          level_name: string
          notes: string | null
          status: string
          student_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_id: string
          center_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          enrollment_id?: string | null
          id?: string
          level_id?: string | null
          level_name: string
          notes?: string | null
          status?: string
          student_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_id?: string
          center_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          enrollment_id?: string | null
          id?: string
          level_id?: string | null
          level_name?: string
          notes?: string | null
          status?: string
          student_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_level_progress_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_level_progress_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "franchise_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_level_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_level_progress_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_level_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_merchandise_allocations: {
        Row: {
          brand_id: string
          center_id: string
          created_at: string
          created_by: string | null
          id: string
          order_line_id: string | null
          student_id: string
        }
        Insert: {
          brand_id: string
          center_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          order_line_id?: string | null
          student_id: string
        }
        Update: {
          brand_id?: string
          center_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          order_line_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_kit_allocations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_kit_allocations_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "franchise_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_kit_allocations_order_line_id_fkey"
            columns: ["order_line_id"]
            isOneToOne: false
            referencedRelation: "merchandise_order_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_kit_allocations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          address_line1: string | null
          brand_id: string
          city: string | null
          created_at: string
          created_by: string | null
          extra: Json | null
          id: string
          phone: string | null
          photo_url: string | null
          pincode: string | null
          school_name: string | null
          state: string | null
          student_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address_line1?: string | null
          brand_id: string
          city?: string | null
          created_at?: string
          created_by?: string | null
          extra?: Json | null
          id?: string
          phone?: string | null
          photo_url?: string | null
          pincode?: string | null
          school_name?: string | null
          state?: string | null
          student_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address_line1?: string | null
          brand_id?: string
          city?: string | null
          created_at?: string
          created_by?: string | null
          extra?: Json | null
          id?: string
          phone?: string | null
          photo_url?: string | null
          pincode?: string | null
          school_name?: string | null
          state?: string | null
          student_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          brand_id: string
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          deleted_at: string | null
          full_name: string
          id: string
          login_email: string | null
          source_lead_id: string | null
          student_code: string | null
          updated_at: string
          updated_by: string | null
          user_id: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          full_name: string
          id?: string
          login_email?: string | null
          source_lead_id?: string | null
          student_code?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          full_name?: string
          id?: string
          login_email?: string | null
          source_lead_id?: string | null
          student_code?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_source_lead_id_fkey"
            columns: ["source_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_interval: string
          code: string
          created_at: string
          created_by: string | null
          currency: string
          features: Json | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          price_cents: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          billing_interval?: string
          code: string
          created_at?: string
          created_by?: string | null
          currency?: string
          features?: Json | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          price_cents?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          billing_interval?: string
          code?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          features?: Json | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          price_cents?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          brand_id: string | null
          created_at: string
          created_by: string | null
          id: string
          status: string
          subject: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          status?: string
          subject: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          status?: string
          subject?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      territories: {
        Row: {
          brand_id: string
          created_at: string
          created_by: string | null
          geo: Json | null
          id: string
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          created_by?: string | null
          geo?: Json | null
          id?: string
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          created_by?: string | null
          geo?: Json | null
          id?: string
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "territories_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_requests: {
        Row: {
          brand_id: string
          created_at: string
          created_by: string | null
          from_center_id: string
          id: string
          reason: string | null
          status: Database["public"]["Enums"]["transfer_status"]
          student_id: string
          to_center_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          created_by?: string | null
          from_center_id: string
          id?: string
          reason?: string | null
          status?: Database["public"]["Enums"]["transfer_status"]
          student_id: string
          to_center_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          created_by?: string | null
          from_center_id?: string
          id?: string
          reason?: string | null
          status?: Database["public"]["Enums"]["transfer_status"]
          student_id?: string
          to_center_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transfer_requests_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_requests_from_center_id_fkey"
            columns: ["from_center_id"]
            isOneToOne: false
            referencedRelation: "franchise_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_requests_to_center_id_fkey"
            columns: ["to_center_id"]
            isOneToOne: false
            referencedRelation: "franchise_centers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      advance_student_after_level_pass: {
        Args: {
          p_brand_id: string
          p_center_id: string
          p_enrollment_id: string
          p_level_id: string
          p_student_id: string
        }
        Returns: undefined
      }
      allocate_student_kit: {
        Args: {
          p_center_id: string
          p_order_line_id: string
          p_student_id: string
        }
        Returns: string
      }
      allocate_student_merchandise: {
        Args: {
          p_center_id: string
          p_order_line_id: string
          p_student_id: string
        }
        Returns: string
      }
      approve_franchise_inquiry: {
        Args: {
          p_center_name?: string
          p_center_slug?: string
          p_inquiry_id: string
        }
        Returns: string
      }
      approve_platform_brand_signup: {
        Args: { p_signup_id: string }
        Returns: string
      }
      assert_center_operational: {
        Args: { p_center_id: string }
        Returns: undefined
      }
      assert_center_program_authorized: {
        Args: { p_center_id: string; p_program_id: string }
        Returns: undefined
      }
      assert_level_deletable: {
        Args: { p_level_id: string }
        Returns: undefined
      }
      assign_lead_to_center: {
        Args: { p_center_id: string; p_lead_id: string }
        Returns: undefined
      }
      brand_feature_enabled: {
        Args: { p_brand_id: string; p_key: string }
        Returns: boolean
      }
      brand_integration_enabled: {
        Args: { p_brand_id: string; p_key: string }
        Returns: boolean
      }
      brand_lead_stale_days: { Args: { p_brand_id: string }; Returns: number }
      brand_public_curriculum_json: {
        Args: { p_brand_id: string }
        Returns: Json
      }
      brand_public_stats_json: { Args: { p_brand_id: string }; Returns: Json }
      brand_settings_timezone: { Args: { p_brand_id: string }; Returns: string }
      complete_merchandise_order_rpc: {
        Args: { p_order_id: string }
        Returns: undefined
      }
      compute_lead_stale_at: {
        Args: { p_assigned_at: string; p_brand_id: string }
        Returns: string
      }
      convert_lead_to_student: {
        Args: { p_lead_id: string; p_overrides?: Json }
        Returns: string
      }
      count_stale_brand_leads: { Args: { p_brand_id: string }; Returns: number }
      create_brand_student_lead_staff: {
        Args: {
          p_brand_id: string
          p_child_dob?: string
          p_child_name?: string
          p_city?: string
          p_email?: string
          p_notes?: string
          p_parent_name: string
          p_pincode?: string
          p_school_name?: string
          p_whatsapp_e164: string
        }
        Returns: string
      }
      create_brand_subscription_checkout: {
        Args: { p_brand_id: string }
        Returns: Json
      }
      create_center_kit_order_rpc: {
        Args: {
          p_brand_id: string
          p_catalog_item_id: string
          p_center_id: string
          p_quantity: number
          p_unit_price_cents: number
        }
        Returns: string
      }
      create_center_merchandise_order_rpc: {
        Args: {
          p_brand_id: string
          p_center_id: string
          p_lines: Json
          p_payment_method?: string
          p_promo_code?: string
          p_shipping_address?: Json
          p_shipping_mode: string
        }
        Returns: string
      }
      create_center_student_lead_staff: {
        Args: {
          p_center_id: string
          p_child_dob?: string
          p_child_name?: string
          p_city?: string
          p_email?: string
          p_notes?: string
          p_parent_name: string
          p_pincode?: string
          p_school_name?: string
          p_whatsapp_e164: string
        }
        Returns: string
      }
      create_franchise_inquiry_staff: {
        Args: {
          p_address_line?: string
          p_brand_id: string
          p_city?: string
          p_email: string
          p_full_name: string
          p_message?: string
          p_phone_e164?: string
          p_pincode?: string
          p_prior_experience?: string
          p_proposed_franchise_name?: string
          p_state?: string
        }
        Returns: string
      }
      create_platform_brand_signup_staff: {
        Args: {
          p_admin_full_name: string
          p_city: string
          p_country?: string
          p_email: string
          p_message?: string
          p_phone_e164?: string
          p_requested_name: string
        }
        Returns: string
      }
      delete_brand_campaign: {
        Args: { p_brand_id: string; p_id: string }
        Returns: undefined
      }
      delete_curriculum_level: {
        Args: { p_level_id: string }
        Returns: undefined
      }
      delete_kit_catalog_item: {
        Args: { p_brand_id: string; p_id: string }
        Returns: undefined
      }
      delete_merchandise_catalog_item: {
        Args: { p_brand_id: string; p_id: string }
        Returns: undefined
      }
      get_brand_landing_public: {
        Args: { p_brand_slug: string }
        Returns: Json
      }
      get_brand_owner_login: { Args: { p_brand_id: string }; Returns: string }
      get_brand_success_stories_public: {
        Args: { p_brand_slug: string }
        Returns: Json
      }
      get_center_landing_public: {
        Args: { p_brand_slug: string; p_center_slug: string }
        Returns: Json
      }
      get_center_ops_report: { Args: { p_center_id: string }; Returns: Json }
      get_center_student_program_context: {
        Args: { p_center_id: string; p_student_id: string }
        Returns: Json
      }
      get_center_unseen_batch_joins: {
        Args: { p_center_id: string }
        Returns: number
      }
      get_portal_branding: {
        Args: { p_brand_slug?: string; p_center_slug?: string }
        Returns: Json
      }
      get_student_active_enrollment: {
        Args: { p_brand_id: string; p_student_id: string }
        Returns: {
          brand_id: string
          center_id: string
          created_at: string
          created_by: string | null
          ended_at: string | null
          enrolled_at: string
          id: string
          program_id: string | null
          starting_level_id: string | null
          status: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "student_enrollments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_student_competitions: {
        Args: { p_brand_id: string; p_filter?: string }
        Returns: Json
      }
      get_student_learn_dashboard: {
        Args: { p_brand_id: string }
        Returns: Json
      }
      get_student_learn_home: { Args: { p_brand_id: string }; Returns: Json }
      get_student_open_batches: { Args: { p_brand_id: string }; Returns: Json }
      get_student_profile: { Args: { p_brand_id: string }; Returns: Json }
      get_student_program_ladders: {
        Args: { p_brand_id: string }
        Returns: Json
      }
      get_student_progress_detail: {
        Args: { p_brand_id: string }
        Returns: Json
      }
      has_brand_access: { Args: { p_brand_id: string }; Returns: boolean }
      has_center_access: { Args: { p_center_id: string }; Returns: boolean }
      initialize_student_program_at_level: {
        Args: {
          p_brand_id: string
          p_center_id: string
          p_enrollment_id: string
          p_program_id: string
          p_start_level_id: string
          p_student_id: string
        }
        Returns: undefined
      }
      initialize_student_program_start: {
        Args: {
          p_brand_id: string
          p_center_id: string
          p_enrollment_id: string
          p_program_id: string
          p_student_id: string
        }
        Returns: undefined
      }
      invite_student_portal_access: {
        Args: { p_login_email?: string; p_student_id: string }
        Returns: undefined
      }
      is_center_operational: { Args: { p_center_id: string }; Returns: boolean }
      is_lead_stale: {
        Args: {
          p_assigned_at: string
          p_center_id: string
          p_last_center_action_at: string
          p_stale_at: string
          p_status: Database["public"]["Enums"]["lead_status"]
        }
        Returns: boolean
      }
      is_parent_of_student: {
        Args: { p_brand_id?: string; p_student_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: never; Returns: boolean }
      is_program_authorized_for_center: {
        Args: { p_center_id: string; p_program_id: string }
        Returns: boolean
      }
      is_student_self: {
        Args: { p_brand_id?: string; p_student_id: string }
        Returns: boolean
      }
      issue_merchandise_invoice: {
        Args: { p_order_id: string }
        Returns: string
      }
      join_student_batch: { Args: { p_batch_id: string }; Returns: string }
      link_student_auth_user: {
        Args: { p_brand_id: string; p_student_id: string }
        Returns: undefined
      }
      list_active_brand_campaigns: {
        Args: { p_brand_id: string }
        Returns: Json
      }
      list_center_merchandise_payment_alerts: {
        Args: { p_center_id: string }
        Returns: Json
      }
      list_public_subscription_plans: { Args: never; Returns: Json }
      log_platform_audit: {
        Args: {
          p_action: string
          p_brand_id?: string
          p_center_id?: string
          p_payload?: Json
          p_resource_id?: string
          p_resource_type: string
        }
        Returns: undefined
      }
      mark_batch_joins_seen: {
        Args: { p_center_id: string }
        Returns: undefined
      }
      mark_lead_lost: {
        Args: { p_lead_id: string; p_reason: string }
        Returns: undefined
      }
      mark_merchandise_invoices_overdue: { Args: never; Returns: number }
      mark_merchandise_order_received_rpc: {
        Args: { p_order_id: string }
        Returns: undefined
      }
      merchandise_payment_mode: {
        Args: { p_brand_id: string }
        Returns: string
      }
      merchandise_require_payment_before_fulfillment: {
        Args: { p_brand_id: string }
        Returns: boolean
      }
      next_merchandise_invoice_number: {
        Args: { p_brand_id: string }
        Returns: string
      }
      normalize_phone_e164: { Args: { p_raw: string }; Returns: string }
      pin_enrollment_program: {
        Args: {
          p_enrollment_id: string
          p_program_id: string
          p_start_level_id?: string
        }
        Returns: undefined
      }
      platform_integration_enabled: {
        Args: { p_key: string }
        Returns: boolean
      }
      process_merchandise_payment_reminders: { Args: never; Returns: Json }
      purge_curriculum_program: {
        Args: { p_program_id: string }
        Returns: undefined
      }
      reassign_lead: {
        Args: { p_center_id: string; p_lead_id: string }
        Returns: undefined
      }
      record_merchandise_payment: {
        Args: {
          p_amount_cents: number
          p_method: string
          p_order_id: string
          p_razorpay_order_id?: string
          p_razorpay_payment_id?: string
          p_reference_notes?: string
        }
        Returns: string
      }
      record_platform_payment: {
        Args: {
          p_amount_cents: number
          p_external_reference: string
          p_invoice_id: string
        }
        Returns: undefined
      }
      record_student_assessment:
        | {
            Args: {
              p_assessed_at?: string
              p_assessment_type: string
              p_center_id: string
              p_max_score?: number
              p_notes?: string
              p_score?: number
              p_student_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_assessed_at?: string
              p_assessment_type: string
              p_center_id: string
              p_level_id?: string
              p_max_score?: number
              p_notes?: string
              p_passed?: boolean
              p_score?: number
              p_student_id: string
              p_visible_to_student?: boolean
            }
            Returns: string
          }
      record_student_competition_entry:
        | {
            Args: {
              p_center_id: string
              p_competition_id: string
              p_result_rank?: string
              p_student_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_center_id: string
              p_competition_id: string
              p_rank_position?: number
              p_result_rank?: string
              p_score?: number
              p_student_id: string
            }
            Returns: string
          }
      record_student_level_progress:
        | {
            Args: {
              p_center_id: string
              p_level_name: string
              p_status?: string
              p_student_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_center_id: string
              p_level_id?: string
              p_level_name: string
              p_status?: string
              p_student_id: string
            }
            Returns: string
          }
      register_student_for_competition: {
        Args: { p_competition_id: string }
        Returns: string
      }
      reject_franchise_inquiry: {
        Args: { p_inquiry_id: string; p_reason: string }
        Returns: undefined
      }
      reject_platform_brand_signup: {
        Args: { p_reason?: string; p_signup_id: string }
        Returns: undefined
      }
      reopen_lead: { Args: { p_lead_id: string }; Returns: undefined }
      resolve_student_current_level: {
        Args: { p_program_id: string; p_student_id: string }
        Returns: string
      }
      resolve_student_for_learn: {
        Args: { p_brand_id: string }
        Returns: string
      }
      set_brand_marketing_theme: {
        Args: { p_brand_id: string; p_theme: string }
        Returns: string
      }
      set_franchise_center_status: {
        Args: {
          p_center_id: string
          p_reason?: string
          p_status: Database["public"]["Enums"]["center_status"]
        }
        Returns: undefined
      }
      slugify_text: { Args: { p_input: string }; Returns: string }
      soft_delete_center_batch: {
        Args: { p_batch_id: string }
        Returns: undefined
      }
      submit_brand_student_application: {
        Args: {
          p_brand_slug: string
          p_child_dob?: string
          p_child_name?: string
          p_city: string
          p_email: string
          p_notes?: string
          p_parent_name: string
          p_pincode: string
          p_school_name?: string
          p_whatsapp_e164: string
        }
        Returns: string
      }
      submit_center_enrollment_lead: {
        Args: {
          p_brand_slug: string
          p_center_slug: string
          p_child_age_years?: number
          p_child_name?: string
          p_email: string
          p_notes?: string
          p_parent_name: string
          p_phone_e164?: string
        }
        Returns: string
      }
      submit_center_student_registration: {
        Args: {
          p_brand_slug: string
          p_center_slug: string
          p_child_dob?: string
          p_child_name?: string
          p_city?: string
          p_email: string
          p_notes?: string
          p_parent_name: string
          p_pincode?: string
          p_school_name?: string
          p_whatsapp_e164: string
        }
        Returns: string
      }
      submit_franchise_inquiry: {
        Args: {
          p_brand_slug: string
          p_city?: string
          p_email: string
          p_full_name: string
          p_message?: string
          p_phone_e164?: string
        }
        Returns: string
      }
      submit_franchise_inquiry_v2: {
        Args: {
          p_address_line?: string
          p_brand_slug: string
          p_city?: string
          p_email: string
          p_full_name: string
          p_message?: string
          p_phone_e164?: string
          p_pincode?: string
          p_prior_experience?: string
          p_proposed_franchise_name?: string
          p_state?: string
        }
        Returns: string
      }
      submit_platform_brand_signup: {
        Args: {
          p_admin_full_name: string
          p_city: string
          p_country?: string
          p_email: string
          p_message?: string
          p_phone_e164?: string
          p_requested_name: string
        }
        Returns: string
      }
      suggest_centers_for_lead: { Args: { p_lead_id: string }; Returns: Json }
      sync_brand_owner_membership: {
        Args: {
          p_actor_id?: string
          p_brand_id: string
          p_email: string
          p_full_name?: string
          p_user_id: string
        }
        Returns: undefined
      }
      sync_center_program_enablement: {
        Args: { p_center_id: string; p_program_ids: string[] }
        Returns: undefined
      }
      sync_student_batch_assignments: {
        Args: {
          p_batch_ids: string[]
          p_center_id: string
          p_student_id: string
        }
        Returns: undefined
      }
      update_center_public_profile_rpc: {
        Args: { p_center_id: string; p_payload: Json }
        Returns: undefined
      }
      update_kit_order_status_rpc: {
        Args: { p_order_id: string; p_status: string }
        Returns: undefined
      }
      update_lead_status: {
        Args: {
          p_lead_id: string
          p_status: Database["public"]["Enums"]["lead_status"]
        }
        Returns: undefined
      }
      update_merchandise_order_status_rpc: {
        Args: {
          p_order_id: string
          p_shipping_tracking?: Json
          p_status: string
        }
        Returns: undefined
      }
      update_student_self_profile: {
        Args: {
          p_address_line1?: string
          p_brand_id: string
          p_city?: string
          p_date_of_birth: string
          p_full_name: string
          p_phone: string
          p_photo_url: string
          p_pincode: string
          p_school_name?: string
          p_state?: string
        }
        Returns: Json
      }
      upsert_brand_campaign: {
        Args: {
          p_brand_id: string
          p_description?: string
          p_ends_at?: string
          p_goal_type?: string
          p_id?: string
          p_is_active?: boolean
          p_name: string
          p_starts_at?: string
        }
        Returns: string
      }
      upsert_brand_competition: {
        Args: {
          p_brand_id: string
          p_eligibility_rules?: Json
          p_event_date?: string
          p_fee_amount?: number
          p_fee_currency?: string
          p_fee_type?: string
          p_id?: string
          p_is_active?: boolean
          p_location?: string
          p_max_participants?: number
          p_name: string
          p_registration_closes_at?: string
          p_registration_mode?: string
          p_registration_opens_at?: string
        }
        Returns: string
      }
      upsert_center_batch: {
        Args: {
          p_batch_id: string
          p_center_id: string
          p_is_open_for_enrollment?: boolean
          p_level_end_id: string
          p_level_start_id: string
          p_name: string
          p_program_id: string
          p_schedule?: Json
        }
        Returns: string
      }
      upsert_kit_catalog_item: {
        Args: {
          p_brand_id: string
          p_currency?: string
          p_id?: string
          p_is_active?: boolean
          p_name: string
          p_price_cents: number
          p_sku: string
        }
        Returns: string
      }
      upsert_lead_by_whatsapp: {
        Args: { p_brand_id: string; p_payload: Json; p_whatsapp: string }
        Returns: string
      }
      upsert_merchandise_catalog_item: {
        Args: {
          p_brand_id: string
          p_currency?: string
          p_id?: string
          p_is_active?: boolean
          p_name: string
          p_price_cents: number
          p_sku: string
        }
        Returns: string
      }
      upsert_merchandise_promo_code: {
        Args: {
          p_brand_id: string
          p_code: string
          p_description?: string
          p_discount_type: string
          p_discount_value: number
          p_id?: string
          p_is_active?: boolean
          p_max_uses?: number
          p_min_quantity?: number
          p_valid_from?: string
          p_valid_until?: string
        }
        Returns: string
      }
      user_brand_ids: { Args: never; Returns: string[] }
      user_center_ids: { Args: never; Returns: string[] }
      validate_merchandise_promo_code: {
        Args: { p_brand_id: string; p_code: string; p_total_quantity?: number }
        Returns: Json
      }
      withdraw_competition_registration: {
        Args: { p_registration_id: string }
        Returns: undefined
      }
    }
    Enums: {
      auth_provider:
        | "google"
        | "facebook"
        | "whatsapp"
        | "passkey"
        | "email"
        | "magic_link"
      brand_status: "draft" | "active" | "suspended" | "archived"
      center_status: "pending" | "active" | "suspended" | "closed"
      curriculum_status: "draft" | "published" | "archived"
      enrollment_status: "active" | "completed" | "transferred" | "withdrawn"
      invoice_status:
        | "draft"
        | "sent"
        | "paid"
        | "partial"
        | "overdue"
        | "cancelled"
      lead_status: "new" | "contacted" | "qualified" | "lost" | "converted"
      membership_status: "invited" | "active" | "suspended" | "revoked"
      portal_type: "platform" | "brand" | "center" | "learn" | "parents"
      royalty_type:
        | "fixed"
        | "percentage"
        | "per_student"
        | "per_level"
        | "hybrid"
      scope_type: "platform" | "brand" | "center"
      transfer_status: "pending" | "approved" | "rejected" | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      auth_provider: [
        "google",
        "facebook",
        "whatsapp",
        "passkey",
        "email",
        "magic_link",
      ],
      brand_status: ["draft", "active", "suspended", "archived"],
      center_status: ["pending", "active", "suspended", "closed"],
      curriculum_status: ["draft", "published", "archived"],
      enrollment_status: ["active", "completed", "transferred", "withdrawn"],
      invoice_status: [
        "draft",
        "sent",
        "paid",
        "partial",
        "overdue",
        "cancelled",
      ],
      lead_status: ["new", "contacted", "qualified", "lost", "converted"],
      membership_status: ["invited", "active", "suspended", "revoked"],
      portal_type: ["platform", "brand", "center", "learn", "parents"],
      royalty_type: [
        "fixed",
        "percentage",
        "per_student",
        "per_level",
        "hybrid",
      ],
      scope_type: ["platform", "brand", "center"],
      transfer_status: ["pending", "approved", "rejected", "completed"],
    },
  },
} as const
