// Полный тип базы данных для типизации Supabase-клиентов.
// Покрывает таблицы leads, lead_events, admins + views + функции + enums.

export type LeadStatus =
  | "new"
  | "qualified"
  | "unqualified"
  | "contacted"
  | "in_progress"
  | "won"
  | "lost";

export type LeadRow = {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  email: string | null;
  source: string;
  locale: "uk" | "ru";
  attribution: Record<string, unknown>;
  status: LeadStatus;
  assigned_to: string | null;
  notes: string | null;
  qualification_reason: string | null;
  loss_reason: string | null;
  value_uah: number | null;
  qualified_at: string | null;
  contacted_at: string | null;
  in_progress_at: string | null;
  won_at: string | null;
  lost_at: string | null;
  updated_at: string;
  synced_to_google_ads_at: string | null;
  synced_to_meta_ads_at: string | null;
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
  status?: LeadStatus;
  assigned_to?: string | null;
  notes?: string | null;
  qualification_reason?: string | null;
  loss_reason?: string | null;
  value_uah?: number | null;
};

export type LeadEventRow = {
  id: string;
  lead_id: string;
  created_at: string;
  from_status: LeadStatus | null;
  to_status: LeadStatus;
  changed_by: string | null;
  reason: string | null;
  metadata: Record<string, unknown>;
};

export type LeadEventInsert = {
  id?: string;
  lead_id: string;
  created_at?: string;
  from_status?: LeadStatus | null;
  to_status: LeadStatus;
  changed_by?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
};

export type AdminRow = {
  id: string;
  email: string;
  created_at: string;
  added_by: string | null;
  notes: string | null;
};

export type AdminInsert = {
  id?: string;
  email: string;
  created_at?: string;
  added_by?: string | null;
  notes?: string | null;
};

export type LeadFunnelRow = {
  day: string;
  source: string;
  total: number;
  qualified: number;
  unqualified: number;
  contacted: number;
  won: number;
  lost: number;
  revenue_uah: number;
  qual_rate_pct: number | null;
  win_rate_pct: number | null;
};

export type LeadsPendingAdsSyncRow = {
  id: string;
  created_at: string;
  qualified_at: string | null;
  source: string;
  locale: "uk" | "ru";
  value_uah: number | null;
  attribution: Record<string, unknown>;
  synced_to_google_ads_at: string | null;
  synced_to_meta_ads_at: string | null;
  gclid: string | null;
  fbclid: string | null;
  email_sha256: string | null;
  phone_sha256: string | null;
};

export type Database = {
  public: {
    Tables: {
      leads: {
        Row: LeadRow;
        Insert: LeadInsert;
        Update: Partial<LeadInsert>;
      };
      lead_events: {
        Row: LeadEventRow;
        Insert: LeadEventInsert;
        Update: Partial<LeadEventInsert>;
      };
      admins: {
        Row: AdminRow;
        Insert: AdminInsert;
        Update: Partial<AdminInsert>;
      };
    };
    Views: {
      lead_funnel: { Row: LeadFunnelRow };
      leads_pending_ads_sync: { Row: LeadsPendingAdsSyncRow };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      lead_status: LeadStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
