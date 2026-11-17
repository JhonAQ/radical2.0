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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      camp_settings: {
        Row: {
          id: boolean
          preventa_deadline: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: boolean
          preventa_deadline: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: boolean
          preventa_deadline?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      registration_check_ins: {
        Row: {
          actor_id: string | null
          created_at: string
          id: number
          kind: string
          note: string | null
          registration_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: never
          kind?: string
          note?: string | null
          registration_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: never
          kind?: string
          note?: string | null
          registration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_check_ins_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          kind: string
          method: string
          receipt_path: string | null
          registration_id: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          kind: string
          method?: string
          receipt_path?: string | null
          registration_id: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          kind?: string
          method?: string
          receipt_path?: string | null
          registration_id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_payments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_review_events: {
        Row: {
          actor_id: string | null
          created_at: string
          id: number
          new_amount: number | null
          new_receipt_path: string | null
          new_status: string
          note: string | null
          old_amount: number | null
          old_receipt_path: string | null
          old_status: string | null
          payment_id: string | null
          registration_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: never
          new_amount?: number | null
          new_receipt_path?: string | null
          new_status: string
          note?: string | null
          old_amount?: number | null
          old_receipt_path?: string | null
          old_status?: string | null
          payment_id?: string | null
          registration_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: never
          new_amount?: number | null
          new_receipt_path?: string | null
          new_status?: string
          note?: string | null
          old_amount?: number | null
          old_receipt_path?: string | null
          old_status?: string | null
          payment_id?: string | null
          registration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_review_events_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "registration_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_review_events_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          amount: number
          birth_date: string
          created_at: string
          document: string
          email: string
          emergency_name: string
          emergency_phone: string
          emergency_relation: string
          first_name: string
          gender: string
          id: string
          last_name: string
          original_receipt_path: string | null
          payment_method: string
          payment_type: string
          phone: string
          plan: string
          price: number
          receipt_path: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          ticket_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          birth_date: string
          created_at?: string
          document: string
          email: string
          emergency_name: string
          emergency_phone: string
          emergency_relation: string
          first_name: string
          gender: string
          id?: string
          last_name: string
          original_receipt_path?: string | null
          payment_method?: string
          payment_type: string
          phone: string
          plan: string
          price: number
          receipt_path: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          ticket_code?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          birth_date?: string
          created_at?: string
          document?: string
          email?: string
          emergency_name?: string
          emergency_phone?: string
          emergency_relation?: string
          first_name?: string
          gender?: string
          id?: string
          last_name?: string
          original_receipt_path?: string | null
          payment_method?: string
          payment_type?: string
          phone?: string
          plan?: string
          price?: number
          receipt_path?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          ticket_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      todos: {
        Row: {
          created_at: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_check_in_registration: {
        Args: { p_kind?: string; p_note?: string; p_registration_id: string }
        Returns: number
      }
      admin_regenerate_ticket_code: {
        Args: { p_registration_id: string }
        Returns: string
      }
      admin_register_cash_payment: {
        Args: { p_amount: number; p_note?: string; p_registration_id: string }
        Returns: undefined
      }
      admin_update_registration: {
        Args: {
          p_birth_date: string
          p_document: string
          p_email: string
          p_emergency_name: string
          p_emergency_phone: string
          p_emergency_relation: string
          p_first_name: string
          p_gender: string
          p_id: string
          p_last_name: string
          p_phone: string
        }
        Returns: undefined
      }
      review_initial_registration: {
        Args: { p_id: string; p_note?: string; p_status: string }
        Returns: undefined
      }
      review_registration_payment: {
        Args: { p_id: string; p_note?: string; p_status: string }
        Returns: undefined
      }
      submit_registration_payment: {
        Args: {
          p_amount: number
          p_kind: string
          p_receipt_path: string
          p_registration_id: string
        }
        Returns: string
      }
      update_my_registration: {
        Args: {
          p_birth_date: string
          p_emergency_name: string
          p_emergency_phone: string
          p_emergency_relation: string
          p_first_name: string
          p_gender: string
          p_id: string
          p_last_name: string
          p_phone: string
        }
        Returns: undefined
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
