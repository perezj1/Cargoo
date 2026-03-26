export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      cargoo_conversations: {
        Row: {
          created_at: string | null;
          id: string;
          last_message_at: string | null;
          last_message_text: string | null;
          participant_one_id: string;
          participant_one_is_traveler: boolean;
          participant_one_name: string;
          participant_two_id: string;
          participant_two_is_traveler: boolean;
          participant_two_name: string;
          route_destination: string | null;
          route_origin: string | null;
          trip_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          last_message_at?: string | null;
          last_message_text?: string | null;
          participant_one_id: string;
          participant_one_is_traveler?: boolean;
          participant_one_name: string;
          participant_two_id: string;
          participant_two_is_traveler?: boolean;
          participant_two_name: string;
          route_destination?: string | null;
          route_origin?: string | null;
          trip_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          last_message_at?: string | null;
          last_message_text?: string | null;
          participant_one_id?: string;
          participant_one_is_traveler?: boolean;
          participant_one_name?: string;
          participant_two_id?: string;
          participant_two_is_traveler?: boolean;
          participant_two_name?: string;
          route_destination?: string | null;
          route_origin?: string | null;
          trip_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      cargoo_messages: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string | null;
          id: string;
          read_at: string | null;
          sender_id: string;
          updated_at: string | null;
        };
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string | null;
          id?: string;
          read_at?: string | null;
          sender_id: string;
          updated_at?: string | null;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string | null;
          id?: string;
          read_at?: string | null;
          sender_id?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
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
      cargoo_trip_stops: {
        Row: {
          city: string;
          created_at: string | null;
          id: string;
          reached_at: string | null;
          stop_order: number;
          trip_id: string;
          updated_at: string | null;
        };
        Insert: {
          city: string;
          created_at?: string | null;
          id?: string;
          reached_at?: string | null;
          stop_order: number;
          trip_id: string;
          updated_at?: string | null;
        };
        Update: {
          city?: string;
          created_at?: string | null;
          id?: string;
          reached_at?: string | null;
          stop_order?: number;
          trip_id?: string;
          updated_at?: string | null;
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
