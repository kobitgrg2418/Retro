export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: 'visitor' | 'member' | 'admin';
  created_at: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  is_premium: number;
  is_available: number;
  image_url?: string;
  created_at?: string;
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  is_premium: number;
}

export interface Table {
  id: number;
  table_number: number;
  capacity: number;
  location: 'indoor' | 'outdoor';
  is_available?: number;
}

export interface Reservation {
  id: number;
  user_id: number;
  user_name?: string;
  user_email?: string;
  table_id: number;
  table_number?: number;
  location?: string;
  capacity?: number;
  date: string;
  time: string;
  guests: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  advance_paid: number;
  created_at: string;
}

export interface OrderItem {
  id?: number;
  order_id?: number;
  menu_item_id: number;
  item_name?: string;
  category?: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  user_id: number;
  user_name?: string;
  user_email?: string;
  items?: OrderItem[];
  total: number;
  order_type: 'dine-in' | 'delivery';
  address?: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  created_at: string;
}

export interface Payment {
  id: number;
  order_id?: number;
  reservation_id?: number;
  amount: number;
  method: 'cash' | 'online';
  status: string;
  created_at: string;
}

export interface Feedback {
  id: number;
  user_id: number;
  user_name?: string;
  user_email?: string;
  order_id?: number;
  food_rating: number;
  service_rating: number;
  ambience_rating: number;
  comment?: string;
  created_at: string;
}

export interface Offer {
  id: number;
  title: string;
  description?: string;
  discount_percent: number;
  valid_from?: string;
  valid_to?: string;
  is_active: number;
  created_at?: string;
}

export interface DashboardStats {
  stats: {
    total_orders: number;
    total_revenue: number;
    total_reservations: number;
    total_users: number;
  };
  recent_orders: Order[];
  order_status_counts: { status: string; count: number }[];
}

export interface ReportData {
  revenue_by_day: { date: string; revenue: number; order_count: number }[];
  popular_items: { id: number; name: string; category: string; price: number; total_ordered: number; order_count: number }[];
  booking_trends: { date: string; reservation_count: number; total_guests: number }[];
}

export interface AuthResponse {
  token: string;
  user: User;
}
