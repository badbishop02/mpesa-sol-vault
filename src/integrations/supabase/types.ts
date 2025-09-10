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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          password_hash: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          password_hash: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          password_hash?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      copy_follows: {
        Row: {
          created_at: string
          follower_id: string
          id: string
          is_active: boolean
          max_notional: number | null
          max_slippage: number
          sizing_type: string
          sizing_value: number
          stop_loss_pct: number | null
          take_profit_pct: number | null
          trailing_stop_pct: number | null
          updated_at: string
          whale_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          id?: string
          is_active?: boolean
          max_notional?: number | null
          max_slippage?: number
          sizing_type?: string
          sizing_value?: number
          stop_loss_pct?: number | null
          take_profit_pct?: number | null
          trailing_stop_pct?: number | null
          updated_at?: string
          whale_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          id?: string
          is_active?: boolean
          max_notional?: number | null
          max_slippage?: number
          sizing_type?: string
          sizing_value?: number
          stop_loss_pct?: number | null
          take_profit_pct?: number | null
          trailing_stop_pct?: number | null
          updated_at?: string
          whale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "copy_follows_whale_id_fkey"
            columns: ["whale_id"]
            isOneToOne: false
            referencedRelation: "whales"
            referencedColumns: ["id"]
          },
        ]
      }
      crypto_trades: {
        Row: {
          amount_from: number
          amount_to: number
          created_at: string
          fee_amount: number
          from_currency: string
          id: string
          mpesa_receipt: string | null
          status: string
          to_currency: string
          transaction_hash: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_from: number
          amount_to: number
          created_at?: string
          fee_amount?: number
          from_currency: string
          id?: string
          mpesa_receipt?: string | null
          status?: string
          to_currency: string
          transaction_hash?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_from?: number
          amount_to?: number
          created_at?: string
          fee_amount?: number
          from_currency?: string
          id?: string
          mpesa_receipt?: string | null
          status?: string
          to_currency?: string
          transaction_hash?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      holdings: {
        Row: {
          amount: number
          id: string
          symbol: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          id?: string
          symbol: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          id?: string
          symbol?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      kyc_documents: {
        Row: {
          created_at: string
          document_type: string
          document_url: string
          id: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          document_url: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          document_url?: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kyc_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      mpesa_payments: {
        Row: {
          amount: number
          checkout_request_id: string | null
          created_at: string
          id: string
          merchant_request_id: string | null
          mpesa_receipt_number: string | null
          phone: string
          raw: Json | null
          result_code: string | null
          result_desc: string | null
          status: string
          transaction_date: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          checkout_request_id?: string | null
          created_at?: string
          id?: string
          merchant_request_id?: string | null
          mpesa_receipt_number?: string | null
          phone: string
          raw?: Json | null
          result_code?: string | null
          result_desc?: string | null
          status?: string
          transaction_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          checkout_request_id?: string | null
          created_at?: string
          id?: string
          merchant_request_id?: string | null
          mpesa_receipt_number?: string | null
          phone?: string
          raw?: Json | null
          result_code?: string | null
          result_desc?: string | null
          status?: string
          transaction_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      portfolio_holdings: {
        Row: {
          amount: number
          avg_buy_price: number
          id: string
          token_mint: string
          total_invested: number
          unrealized_pnl: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          avg_buy_price?: number
          id?: string
          token_mint: string
          total_invested?: number
          unrealized_pnl?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          avg_buy_price?: number
          id?: string
          token_mint?: string
          total_invested?: number
          unrealized_pnl?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string | null
          avatar_url: string | null
          birthday: string | null
          country: string | null
          created_at: string
          display_name: string | null
          encrypted_private_key: string | null
          full_name: string | null
          id: string
          kyc_status: string | null
          phone: string | null
          phone_verified: boolean | null
          updated_at: string
          username: string | null
          wallet_address: string | null
          wallet_public_key: string | null
        }
        Insert: {
          account_status?: string | null
          avatar_url?: string | null
          birthday?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          encrypted_private_key?: string | null
          full_name?: string | null
          id: string
          kyc_status?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          updated_at?: string
          username?: string | null
          wallet_address?: string | null
          wallet_public_key?: string | null
        }
        Update: {
          account_status?: string | null
          avatar_url?: string | null
          birthday?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          encrypted_private_key?: string | null
          full_name?: string | null
          id?: string
          kyc_status?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          updated_at?: string
          username?: string | null
          wallet_address?: string | null
          wallet_public_key?: string | null
        }
        Relationships: []
      }
      solana_wallets: {
        Row: {
          created_at: string
          encrypted_private_key: string
          id: string
          is_testnet: boolean
          updated_at: string
          user_id: string
          wallet_address: string
        }
        Insert: {
          created_at?: string
          encrypted_private_key: string
          id?: string
          is_testnet?: boolean
          updated_at?: string
          user_id: string
          wallet_address: string
        }
        Update: {
          created_at?: string
          encrypted_private_key?: string
          id?: string
          is_testnet?: boolean
          updated_at?: string
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
      telegram_sources: {
        Row: {
          auto_execute: boolean
          created_at: string
          id: string
          is_active: boolean
          telegram_link: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_execute?: boolean
          created_at?: string
          id?: string
          is_active?: boolean
          telegram_link: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_execute?: boolean
          created_at?: string
          id?: string
          is_active?: boolean
          telegram_link?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trade_executions: {
        Row: {
          amount: number
          created_at: string
          error_message: string | null
          fee_amount: number
          fee_wallet: string
          id: string
          price_per_token: number | null
          source_id: string | null
          source_type: string
          status: string
          token_mint: string
          trade_type: string
          transaction_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          error_message?: string | null
          fee_amount?: number
          fee_wallet?: string
          id?: string
          price_per_token?: number | null
          source_id?: string | null
          source_type?: string
          status?: string
          token_mint: string
          trade_type: string
          transaction_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          error_message?: string | null
          fee_amount?: number
          fee_wallet?: string
          id?: string
          price_per_token?: number | null
          source_id?: string | null
          source_type?: string
          status?: string
          token_mint?: string
          trade_type?: string
          transaction_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount_kes: number
          created_at: string
          crypto_amount: number | null
          crypto_symbol: string | null
          id: string
          status: string
          type: string
          user_id: string | null
        }
        Insert: {
          amount_kes: number
          created_at?: string
          crypto_amount?: number | null
          crypto_symbol?: string | null
          id?: string
          status?: string
          type: string
          user_id?: string | null
        }
        Update: {
          amount_kes?: number
          created_at?: string
          crypto_amount?: number | null
          crypto_symbol?: string | null
          id?: string
          status?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          sent_by: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          sent_by?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          sent_by?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          auto_execute_enabled: boolean
          created_at: string
          default_slippage: number
          email_notifications: boolean
          id: string
          max_daily_loss: number | null
          risk_tolerance: string
          telegram_notifications: boolean
          two_fa_enabled: boolean
          two_fa_secret: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_execute_enabled?: boolean
          created_at?: string
          default_slippage?: number
          email_notifications?: boolean
          id?: string
          max_daily_loss?: number | null
          risk_tolerance?: string
          telegram_notifications?: boolean
          two_fa_enabled?: boolean
          two_fa_secret?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_execute_enabled?: boolean
          created_at?: string
          default_slippage?: number
          email_notifications?: boolean
          id?: string
          max_daily_loss?: number | null
          risk_tolerance?: string
          telegram_notifications?: boolean
          two_fa_enabled?: boolean
          two_fa_secret?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance_kes: number
          created_at: string
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          balance_kes?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          balance_kes?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      whales: {
        Row: {
          avg_hold_time: number
          created_at: string
          follower_count: number
          id: string
          last_scored_at: string
          realized_pnl: number
          score: number
          trade_count: number
          updated_at: string
          wallet_address: string
          win_rate: number
        }
        Insert: {
          avg_hold_time?: number
          created_at?: string
          follower_count?: number
          id?: string
          last_scored_at?: string
          realized_pnl?: number
          score?: number
          trade_count?: number
          updated_at?: string
          wallet_address: string
          win_rate?: number
        }
        Update: {
          avg_hold_time?: number
          created_at?: string
          follower_count?: number
          id?: string
          last_scored_at?: string
          realized_pnl?: number
          score?: number
          trade_count?: number
          updated_at?: string
          wallet_address?: string
          win_rate?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      encrypt_private_key: {
        Args: { private_key: string; user_salt: string }
        Returns: string
      }
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
