import type {
  User,
  MenuItem,
  Table,
  Reservation,
  Order,
  Payment,
  Feedback,
  Offer,
  DashboardStats,
  ReportData,
  AuthResponse,
} from './types';

const BASE = '/api';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('gokyo_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message || body.error || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// Auth
export async function login(email: string, password: string) {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(name: string, email: string, password: string, phone?: string) {
  return apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, phone }),
  });
}

export async function getProfile() {
  const data = await apiFetch<{ user: User }>('/auth/me');
  return data.user;
}

export async function updateProfile(data: Partial<User>) {
  const res = await apiFetch<{ user: User }>('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.user;
}

// Menu
export async function getMenu(category?: string) {
  const q = category && category !== 'All' ? `?category=${encodeURIComponent(category)}` : '';
  const data = await apiFetch<{ items: MenuItem[] }>(`/menu${q}`);
  return data.items;
}

export async function getMenuItem(id: number) {
  const data = await apiFetch<{ item: MenuItem }>(`/menu/${id}`);
  return data.item;
}

// Builds a multipart request (used when an image File is attached).
async function menuMultipart(url: string, method: 'POST' | 'PUT', data: Partial<MenuItem>, image: File) {
  const token = localStorage.getItem('gokyo_token');
  const form = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined && v !== null) form.append(k, String(v));
  });
  form.append('image', image);

  const res = await fetch(`${BASE}${url}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message || body.error || `Request failed: ${res.status}`);
  }
  return (await res.json()).item as MenuItem;
}

export async function createMenuItem(data: Partial<MenuItem>, image?: File | null) {
  if (image) return menuMultipart('/menu', 'POST', data, image);
  const res = await apiFetch<{ item: MenuItem }>('/menu', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.item;
}

export async function updateMenuItem(id: number, data: Partial<MenuItem>, image?: File | null) {
  if (image) return menuMultipart(`/menu/${id}`, 'PUT', data, image);
  const res = await apiFetch<{ item: MenuItem }>(`/menu/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.item;
}

export async function deleteMenuItem(id: number) {
  return apiFetch<{ message: string }>(`/menu/${id}`, { method: 'DELETE' });
}

// Tables & Reservations
export async function getAvailableTables(date: string, time: string, guests: number) {
  const data = await apiFetch<{ tables: Table[] }>(
    `/tables/available?date=${date}&time=${time}&guests=${guests}`
  );
  return data.tables;
}

export async function createReservation(data: {
  table_id: number;
  date: string;
  time: string;
  guests: number;
}) {
  const res = await apiFetch<{ reservation: Reservation }>('/reservations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.reservation;
}

export async function getReservations() {
  const data = await apiFetch<{ reservations: Reservation[] }>('/reservations');
  return data.reservations;
}

export async function cancelReservation(id: number) {
  const data = await apiFetch<{ reservation: Reservation; message: string }>(`/reservations/${id}`, {
    method: 'DELETE',
  });
  return data;
}

export async function updateReservation(id: number, data: Partial<Reservation>) {
  const res = await apiFetch<{ reservation: Reservation }>(`/reservations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.reservation;
}

// Orders
export async function createOrder(data: {
  items: { menu_item_id: number; quantity: number }[];
  order_type: string;
  address?: string;
}) {
  const res = await apiFetch<{ order: Order; items: unknown[] }>('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.order;
}

export async function getOrders() {
  const data = await apiFetch<{ orders: Order[] }>('/orders');
  return data.orders;
}

export async function getOrder(id: number) {
  const data = await apiFetch<{ order: Order; items: unknown[] }>(`/orders/${id}`);
  return { ...data.order, items: data.items };
}

export async function updateOrderStatus(id: number, status: string) {
  const res = await apiFetch<{ order: Order }>(`/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
  return res.order;
}

// Payments
export async function createPayment(data: {
  order_id?: number;
  reservation_id?: number;
  amount: number;
  method: 'cash' | 'online';
}) {
  const res = await apiFetch<{ payment: Payment }>('/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.payment;
}

// Feedback
export async function submitFeedback(data: {
  order_id?: number;
  food_rating: number;
  service_rating: number;
  ambience_rating: number;
  comment?: string;
}) {
  const res = await apiFetch<{ feedback: Feedback }>('/feedback', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.feedback;
}

export async function getFeedback() {
  const data = await apiFetch<{ feedback: Feedback[] }>('/feedback');
  return data.feedback;
}

// Dashboard & Reports (Admin)
export async function getDashboard() {
  return apiFetch<DashboardStats>('/admin/dashboard');
}

export async function getReports() {
  return apiFetch<ReportData>('/admin/reports');
}

// Offers
export async function getOffers() {
  const data = await apiFetch<{ offers: Offer[] }>('/offers');
  return data.offers;
}

export async function createOffer(data: Partial<Offer>) {
  const res = await apiFetch<{ offer: Offer }>('/offers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.offer;
}

export async function updateOffer(id: number, data: Partial<Offer>) {
  const res = await apiFetch<{ offer: Offer }>(`/offers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.offer;
}

export async function deleteOffer(id: number) {
  return apiFetch<{ message: string }>(`/offers/${id}`, { method: 'DELETE' });
}
