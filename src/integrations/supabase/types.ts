export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      cargoo_profiles: {
        Row: {
          bio: string | null;
          created_at: string | null;
          is_public: boolean;
          is_traveler: boolean;
          location: string | null;
          name: string;
          phone: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          bio?: string | null;
          created_at?: string | null;
          is_public?: boolean;
          is_traveler?: boolean;
          location?: string | null;
          name: string;
          phone?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          bio?: string | null;
          created_at?: string | null;
          is_public?: boolean;
          is_traveler?: boolean;
          location?: string | null;
          name?: string;
          phone?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      cargoo_trips: {
        Row: {
          capacity_kg: number;
          created_at: string | null;
          destination: string;
          id: string;
          notes: string | null;
          origin: string;
          requests: number;
          status: "active" | "completed";
          trip_date: string;
          updated_at: string | null;
          used_kg: number;
          user_id: string;
        };
        Insert: {
          capacity_kg: number;
          created_at?: string | null;
          destination: string;
          id?: string;
          notes?: string | null;
          origin: string;
          requests?: number;
          status?: "active" | "completed";
          trip_date: string;
          updated_at?: string | null;
          used_kg?: number;
          user_id: string;
        };
        Update: {
          capacity_kg?: number;
          created_at?: string | null;
          destination?: string;
          id?: string;
          notes?: string | null;
          origin?: string;
          requests?: number;
          status?: "active" | "completed";
          trip_date?: string;
          updated_at?: string | null;
          used_kg?: number;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
