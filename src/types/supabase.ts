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
          email: string
          full_name: string | null
          kyc_status: "pending" | "approved" | "rejected"
          kyc_notes: string | null
          role: "user" | "admin"
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          kyc_status?: "pending" | "approved" | "rejected"
          kyc_notes?: string | null
          role?: "user" | "admin"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          kyc_status?: "pending" | "approved" | "rejected"
          kyc_notes?: string | null
          role?: "user" | "admin"
          created_at?: string
          updated_at?: string
        }
      }
      transfers: {
        Row: {
          id: string
          user_id: string
          recipient_name: string
          recipient_phone: string
          amount: number
          currency: string
          status: "pending" | "processing" | "completed" | "failed"
          payment_intent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recipient_name: string
          recipient_phone: string
          amount: number
          currency?: string
          status?: "pending" | "processing" | "completed" | "failed"
          payment_intent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recipient_name?: string
          recipient_phone?: string
          amount?: number
          currency?: string
          status?: "pending" | "processing" | "completed" | "failed"
          payment_intent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transfer_incidents: {
        Row: {
          id: string
          transfer_id: string
          error_message: string
          error_code: string | null
          resolved: boolean
          resolved_at: string | null
          resolution_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          transfer_id: string
          error_message: string
          error_code?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolution_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          transfer_id?: string
          error_message?: string
          error_code?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolution_notes?: string | null
          created_at?: string
          updated_at?: string
        }
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
