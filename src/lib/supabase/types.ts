// Полный тип базы данных для типизации Supabase-клиентов.
// Покрывает таблицы leads, lead_events, admins, orders, order_items, order_events
// + views + функции + enums.
// Формат точно следует тому что ожидает @supabase/supabase-js GenericSchema.

// ─── LEADS ────────────────────────────────────────────────────────

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
  locale: "ua" | "ru";
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
  locale: "ua" | "ru";
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
  locale: "ua" | "ru";
  value_uah: number | null;
  attribution: Record<string, unknown>;
  synced_to_google_ads_at: string | null;
  synced_to_meta_ads_at: string | null;
  gclid: string | null;
  fbclid: string | null;
  email_sha256: string | null;
  phone_sha256: string | null;
};

// ─── ORDERS ───────────────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "processing"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type DeliveryMethod = "np" | "ukrposhta" | "pickup";
export type PaymentMethod = "apple" | "cod" | "card";

export type OrderRow = {
  id: string;
  order_number: string;
  created_at: string;
  updated_at: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  locale: "ua" | "ru";
  delivery_method: DeliveryMethod;
  delivery_city: string | null;
  delivery_branch: string | null;
  payment_method: PaymentMethod;
  subtotal_uah: number;
  shipping_uah: number;
  total_uah: number;
  items_count: number;
  comment: string | null;
  agreed: boolean;
  status: OrderStatus;
  assigned_to: string | null;
  notes: string | null;
  cancel_reason: string | null;
  processing_at: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  attribution: Record<string, unknown>;
  synced_to_google_ads_at: string | null;
  synced_to_meta_ads_at: string | null;
};

export type OrderInsert = {
  id?: string;
  order_number?: string; // авто-генерируется DEFAULT
  created_at?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  locale: "ua" | "ru";
  delivery_method: DeliveryMethod;
  delivery_city?: string | null;
  delivery_branch?: string | null;
  payment_method: PaymentMethod;
  subtotal_uah: number;
  shipping_uah?: number;
  total_uah: number;
  items_count?: number;
  comment?: string | null;
  agreed?: boolean;
  status?: OrderStatus;
  assigned_to?: string | null;
  notes?: string | null;
  cancel_reason?: string | null;
  attribution?: Record<string, unknown>;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  created_at: string;
  product_id: string;
  brand: string;
  model: string;
  category: string | null;
  emoji: string | null;
  price_uah: number;
  qty: number;
  line_total_uah: number;
};

export type OrderItemInsert = {
  id?: string;
  order_id: string;
  created_at?: string;
  product_id: string;
  brand: string;
  model: string;
  category?: string | null;
  emoji?: string | null;
  price_uah: number;
  qty: number;
  line_total_uah: number;
};

export type OrderEventRow = {
  id: string;
  order_id: string;
  created_at: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  changed_by: string | null;
  reason: string | null;
  metadata: Record<string, unknown>;
};

export type OrderEventInsert = {
  id?: string;
  order_id: string;
  created_at?: string;
  from_status?: OrderStatus | null;
  to_status: OrderStatus;
  changed_by?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
};

export type OrdersFunnelRow = {
  day: string;
  utm_source: string;
  delivery_method: DeliveryMethod;
  payment_method: PaymentMethod;
  total: number;
  taken: number;
  delivered: number;
  cancelled: number;
  revenue_uah: number;
  gmv_uah: number;
  delivery_rate_pct: number | null;
};

export type OrdersPendingAdsSyncRow = {
  id: string;
  order_number: string;
  created_at: string;
  delivered_at: string | null;
  locale: "ua" | "ru";
  total_uah: number;
  attribution: Record<string, unknown>;
  synced_to_google_ads_at: string | null;
  synced_to_meta_ads_at: string | null;
  gclid: string | null;
  fbclid: string | null;
  email_sha256: string | null;
  phone_sha256: string | null;
};

// ─── DATABASE TYPE ────────────────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      leads: {
        Row: LeadRow;
        Insert: LeadInsert;
        Update: Partial<LeadInsert>;
        Relationships: [];
      };
      lead_events: {
        Row: LeadEventRow;
        Insert: LeadEventInsert;
        Update: Partial<LeadEventInsert>;
        Relationships: [
          {
            foreignKeyName: "lead_events_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      admins: {
        Row: AdminRow;
        Insert: AdminInsert;
        Update: Partial<AdminInsert>;
        Relationships: [];
      };
      orders: {
        Row: OrderRow;
        Insert: OrderInsert;
        Update: Partial<OrderInsert>;
        Relationships: [];
      };
      order_items: {
        Row: OrderItemRow;
        Insert: OrderItemInsert;
        Update: Partial<OrderItemInsert>;
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      order_events: {
        Row: OrderEventRow;
        Insert: OrderEventInsert;
        Update: Partial<OrderEventInsert>;
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      lead_funnel: {
        Row: LeadFunnelRow;
        Relationships: [];
      };
      leads_pending_ads_sync: {
        Row: LeadsPendingAdsSyncRow;
        Relationships: [];
      };
      orders_funnel: {
        Row: OrdersFunnelRow;
        Relationships: [];
      };
      orders_pending_ads_sync: {
        Row: OrdersPendingAdsSyncRow;
        Relationships: [];
      };
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      generate_order_number: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      lead_status: LeadStatus;
      order_status: OrderStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
