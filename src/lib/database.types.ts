export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          icon: string;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
      };
      // NEW TABLE
      restaurants: {
        Row: {
          id: string;
          name: string;
          is_open: boolean;
          image_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['restaurants']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['restaurants']['Insert']>;
      };
      menu_items: {
        Row: {
          id: string;
          name: string;
          price: number;
          category: string;
          image_url: string;
          restaurant_name: string;
          description: string;
          is_available: boolean;
          is_recommended: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['menu_items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['menu_items']['Insert']>;
      };
      order_batches: {
        Row: {
          id: string;
          slot_label: string;
          current_step: number;
          status_message: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['order_batches']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['order_batches']['Insert']>;
      };
      orders: {
        Row: {
          id: string;
          batch_id: string;
          user_id: string | null;
          user_name: string;
          hostel: string;
          room: string;
          phone: string;
          items: CartItem[];
          total_amount: number;
          payment_mode: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };
      hero_banners: {
        Row: {
          id: string;
          title: string;
          description: string;
          image_url: string;
          bg_color: string;
          text_color: string;
          action_text: string;
          action_link: string;
          order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['hero_banners']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['hero_banners']['Insert']>;
      };
    };
  };
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export type Category = Database['public']['Tables']['categories']['Row'];
export type Restaurant = Database['public']['Tables']['restaurants']['Row']; // NEW TYPE
export type MenuItem = Database['public']['Tables']['menu_items']['Row'];
export type OrderBatch = Database['public']['Tables']['order_batches']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type HeroBanner = Database['public']['Tables']['hero_banners']['Row'];
