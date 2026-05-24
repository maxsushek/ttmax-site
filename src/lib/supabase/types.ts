export type LeadRow = {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  email: string | null;
  source: string;
  locale: "uk" | "ru";
  attribution: Record<string, unknown>;
};

export type LeadInsert = {
  id?: string;
  created_at?: string;
  name: string;
  phone: string;
  email?: string | null;
  source: string;
  locale: "uk" | "ru";
  attribution?: Record<string, unknown>;
};

export type Database = {
  public: {
    Tables: {
      leads: {
        Row: LeadRow;
        Insert: LeadInsert;
        Update: Partial<LeadInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
