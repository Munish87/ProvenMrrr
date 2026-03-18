export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          }
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
          }
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
          }
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
          }
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
          description: string | null
          founded_date: string | null
          id: string
          insights: Json | null
          is_anonymous: boolean
          is_listed_for_sale: boolean
          is_verified: boolean
          logo_url: string | null
          looking_for_cofounder: boolean | null
          name: string
          owner_id: string | null
          profit_margin_30d: number | null
          provider: string
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
          description?: string | null
          founded_date?: string | null
          id?: string
          insights?: Json | null
          is_anonymous?: boolean
          is_listed_for_sale?: boolean
          is_verified?: boolean
          logo_url?: string | null
          looking_for_cofounder?: boolean | null
          name: string
          owner_id?: string | null
          profit_margin_30d?: number | null
          provider?: string
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
          description?: string | null
          founded_date?: string | null
          id?: string
          insights?: Json | null
          is_anonymous?: boolean
          is_listed_for_sale?: boolean
          is_verified?: boolean
          logo_url?: string | null
          looking_for_cofounder?: boolean | null
          name?: string
          owner_id?: string | null
          profit_margin_30d?: number | null
          provider?: string
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
          }
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
          }
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
          }
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
