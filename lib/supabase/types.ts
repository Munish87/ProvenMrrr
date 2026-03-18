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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      advertisers: {
        Row: {
          company_name: string
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          status: string
          title: string
          website_url: string
        }
        Insert: {
          company_name: string
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          status?: string
          title: string
          website_url: string
        }
        Update: {
          company_name?: string
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          status?: string
          title?: string
          website_url?: string
        }
        Relationships: []
      }
      buyer_interactions: {
        Row: {
          created_at: string
          id: string
          interaction_type: string
          startup_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_type: string
          startup_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_type?: string
          startup_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyer_interactions_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_preferences: {
        Row: {
          categories: string[] | null
          created_at: string
          id: string
          max_budget: number | null
          min_budget: number | null
          min_growth_rate: number | null
          min_mrr: number | null
          min_profit_margin: number | null
          min_team_size: number | null
          requires_mobile_app: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          categories?: string[] | null
          created_at?: string
          id?: string
          max_budget?: number | null
          min_budget?: number | null
          min_growth_rate?: number | null
          min_mrr?: number | null
          min_profit_margin?: number | null
          min_team_size?: number | null
          requires_mobile_app?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          categories?: string[] | null
          created_at?: string
          id?: string
          max_budget?: number | null
          min_budget?: number | null
          min_growth_rate?: number | null
          min_mrr?: number | null
          min_profit_margin?: number | null
          min_team_size?: number | null
          requires_mobile_app?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      community_comment_upvotes: {
        Row: {
          comment_id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          user_id: string
        }
        Update: {
          comment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comment_upvotes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comment_upvotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      community_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_upvotes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_upvotes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_post_upvotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          content: string
          created_at: string
          discussion_prompt: string | null
          id: string
          image_url: string | null
          startup: string | null
          tags: string[]
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          discussion_prompt?: string | null
          id?: string
          image_url?: string | null
          startup?: string | null
          tags?: string[]
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          discussion_prompt?: string | null
          id?: string
          image_url?: string | null
          startup?: string | null
          tags?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      health_scores: {
        Row: {
          ai_summary: string | null
          created_at: string
          id: string
          risk_level: string
          score: number
          startup_id: string
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string
          id?: string
          risk_level: string
          score: number
          startup_id: string
        }
        Update: {
          ai_summary?: string | null
          created_at?: string
          id?: string
          risk_level?: string
          score?: number
          startup_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_scores_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          offer_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          offer_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          offer_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_messages_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string
          id: string
          message: string
          replied_at: string | null
          seller_message: string | null
          startup_id: string
          status: string
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string
          id?: string
          message: string
          replied_at?: string | null
          seller_message?: string | null
          startup_id: string
          status?: string
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string
          id?: string
          message?: string
          replied_at?: string | null
          seller_message?: string | null
          startup_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_snapshots: {
        Row: {
          all_time_revenue: number
          arr: number
          churn_rate: number
          created_at: string
          customer_count: number
          growth_rate: number
          id: string
          mrr: number
          refund_rate: number
          snapshot_date: string
          startup_id: string
          volatility_score: number
        }
        Insert: {
          all_time_revenue?: number
          arr?: number
          churn_rate?: number
          created_at?: string
          customer_count?: number
          growth_rate?: number
          id?: string
          mrr?: number
          refund_rate?: number
          snapshot_date?: string
          startup_id: string
          volatility_score?: number
        }
        Update: {
          all_time_revenue?: number
          arr?: number
          churn_rate?: number
          created_at?: string
          customer_count?: number
          growth_rate?: number
          id?: string
          mrr?: number
          refund_rate?: number
          snapshot_date?: string
          startup_id?: string
          volatility_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "revenue_snapshots_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      startups: {
        Row: {
          asking_price: number | null
          category: string | null
          claim_token: string | null
          claimed_by_user_id: string | null
          contact_email: string | null
          country: string | null
          created_at: string
          customer_count: number | null
          description: string | null
          founded_date: string | null
          growth_rate: number | null
          hide_real_time_revenue: boolean | null
          id: string
          insights: Json | null
          is_anonymous: boolean
          is_listed_for_sale: boolean
          is_verified: boolean
          logo_url: string | null
          looking_for_cofounder: boolean | null
          monthly_revenue: number | null
          name: string
          owner_id: string | null
          profit_margin_30d: number | null
          provider: string
          revenue_30d: number | null
          sale_status_override: string | null
          slug: string | null
          source: string
          tags: string[] | null
          verified: boolean | null
          website_url: string | null
          x_handle: string | null
        }
        Insert: {
          asking_price?: number | null
          category?: string | null
          claim_token?: string | null
          claimed_by_user_id?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string
          customer_count?: number | null
          description?: string | null
          founded_date?: string | null
          growth_rate?: number | null
          hide_real_time_revenue?: boolean | null
          id?: string
          insights?: Json | null
          is_anonymous?: boolean
          is_listed_for_sale?: boolean
          is_verified?: boolean
          logo_url?: string | null
          looking_for_cofounder?: boolean | null
          monthly_revenue?: number | null
          name: string
          owner_id?: string | null
          profit_margin_30d?: number | null
          provider?: string
          revenue_30d?: number | null
          sale_status_override?: string | null
          slug?: string | null
          source?: string
          tags?: string[] | null
          verified?: boolean | null
          website_url?: string | null
          x_handle?: string | null
        }
        Update: {
          asking_price?: number | null
          category?: string | null
          claim_token?: string | null
          claimed_by_user_id?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string
          customer_count?: number | null
          description?: string | null
          founded_date?: string | null
          growth_rate?: number | null
          hide_real_time_revenue?: boolean | null
          id?: string
          insights?: Json | null
          is_anonymous?: boolean
          is_listed_for_sale?: boolean
          is_verified?: boolean
          logo_url?: string | null
          looking_for_cofounder?: boolean | null
          monthly_revenue?: number | null
          name?: string
          owner_id?: string | null
          profit_margin_30d?: number | null
          provider?: string
          revenue_30d?: number | null
          sale_status_override?: string | null
          slug?: string | null
          source?: string
          tags?: string[] | null
          verified?: boolean | null
          website_url?: string | null
          x_handle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "startups_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_connections: {
        Row: {
          api_key_hash: string | null
          created_at: string
          encrypted_api_key: string
          id: string
          last_synced_at: string | null
          provider: string
          startup_id: string
        }
        Insert: {
          api_key_hash?: string | null
          created_at?: string
          encrypted_api_key: string
          id?: string
          last_synced_at?: string | null
          provider?: string
          startup_id: string
        }
        Update: {
          api_key_hash?: string | null
          created_at?: string
          encrypted_api_key?: string
          id?: string
          last_synced_at?: string | null
          provider?: string
          startup_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_connections_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: true
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string | null
          role: string
          x_handle: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          name?: string | null
          role?: string
          x_handle?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          role?: string
          x_handle?: string | null
        }
        Relationships: []
      }
      watchlists: {
        Row: {
          created_at: string
          id: string
          startup_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          startup_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          startup_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlists_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watchlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      run_hourly_sync: { Args: never; Returns: undefined }
      run_trustmrr_import: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
