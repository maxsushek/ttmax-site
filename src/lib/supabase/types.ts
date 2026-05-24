/**
 * Supabase database types.
 * Replace with auto-generated types from Supabase CLI:
 *   npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type LeadRow = {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  email: string | null;
  source: string;
  locale: string;
  attribution: Json;
};

export type LeadInsert = {
  name: string;
  phone: string;
  email?: string | null;
  source: string;
  locale: string;
  attribution?: Json;
};

export type Database = {
  public: {
    Tables: {
      leads: {
        Row: LeadRow;
        Insert: LeadInsert;
        Update: Partial<LeadInsert>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
