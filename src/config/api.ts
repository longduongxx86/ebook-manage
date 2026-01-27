const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const API_ENDPOINTS = {
  // Books
  books: {
    list: `${API_BASE_URL}/books`,
    detail: (id: string) => `${API_BASE_URL}/books/${id}`,
    create: `${API_BASE_URL}/books`,
    update: (id: string) => `${API_BASE_URL}/books/${id}`,
    delete: (id: string) => `${API_BASE_URL}/books/${id}`,
    search: `${API_BASE_URL}/books/search`,
  },

  // Categories
  categories: {
    list: `${API_BASE_URL}/categories`,
  },

  // Auth
  auth: {
    login: `${API_BASE_URL}/login`,
    profile: `${API_BASE_URL}/profile`,
  },

  // Orders
  orders: {
    list: `${API_BASE_URL}/orders`,
    detail: (id: string) => `${API_BASE_URL}/orders/${id}`,
    updateStatus: (id: string) => `${API_BASE_URL}/orders/${id}/status`,
    createFromCart: `${API_BASE_URL}/orders/from-cart`,
  },

  // Cart (for POS)
  cart: {
    list: `${API_BASE_URL}/cart`,
    add: `${API_BASE_URL}/cart/add`,
    update: (itemId: string) => `${API_BASE_URL}/cart/${itemId}`,
    remove: (itemId: string) => `${API_BASE_URL}/cart/${itemId}`,
    clear: `${API_BASE_URL}/cart/clear`,
  },

  // Users
  users: {
    list: `${API_BASE_URL}/admin/users`,
    detail: (id: string) => `${API_BASE_URL}/admin/users/${id}`,
  },

  // Payments
  payments: {
    list: `${API_BASE_URL}/payments/all`,
    updateStatus: (id: string) => `${API_BASE_URL}/payments/${id}/status`,
    byOrder: (id: string) => `${API_BASE_URL}/orders/${id}/payment`,
  },

  // Dashboard & Statistics
  dashboard: {
    summary: `${API_BASE_URL}/summary`,
    charts: `${API_BASE_URL}/charts`,
    topSelling: `${API_BASE_URL}/top-selling`,
    recentOrders: `${API_BASE_URL}/recent-orders`,
  },
  statistics: {
    revenue: `${API_BASE_URL}/statistics/revenue`,
    users: `${API_BASE_URL}/statistics/users`,
    books: `${API_BASE_URL}/statistics/books`,
  },
  
  // Upload
  upload: {
    image: `${API_BASE_URL}/upload/book-image`,
    avatar: `${API_BASE_URL}/upload/avatar`,
  },

  // Notifications
  notifications: {
    list: `${API_BASE_URL}/notifications`,
    markRead: `${API_BASE_URL}/notifications/read`,
  },

  // Chat
  chat: {
    conversations: `${API_BASE_URL}/admin/chat/conversations`,
    history: `${API_BASE_URL}/chat/history`,
    ws: (token: string) => {
       const url = new URL(API_BASE_URL);
       const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
       return `${protocol}//${url.host}/ws?token=${token}`;
    }
  },
};

export function getHeaders(token?: string, isMultipart: boolean = false): Record<string, string> {
  const headers: Record<string, string> = {};

  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}
