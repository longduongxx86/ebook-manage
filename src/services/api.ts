import { API_ENDPOINTS, getHeaders, API_CONFIG } from '../config/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchAPI<T>(
  url: string,
  options: RequestInit & { token?: string; isMultipart?: boolean } = {}
): Promise<T> {
  const { token, isMultipart, ...fetchOptions } = options;

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      ...getHeaders(token, isMultipart),
      ...((fetchOptions.headers as Record<string, string>) || {}),
    },
    signal: AbortSignal.timeout(API_CONFIG.timeout),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      response.statusText,
      data?.message || data?.error || 'An error occurred'
    );
  }

  return data;
}

export const authApi = {
  async login(credentials: any) {
    return fetchAPI(API_ENDPOINTS.auth.login, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
  async getProfile(token: string) {
    return fetchAPI(API_ENDPOINTS.auth.profile, { token });
  },
};

export const bookApi = {
  async getBooks(token?: string, params?: Record<string, any>) {
    const queryString = params 
      ? '?' + new URLSearchParams(
          Object.entries(params).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              acc[key] = String(value);
            }
            return acc;
          }, {} as Record<string, string>)
        ).toString() 
      : '';
    return fetchAPI(API_ENDPOINTS.books.list + queryString, { token });
  },
  async getBook(id: string, token?: string) {
    return fetchAPI(API_ENDPOINTS.books.detail(id), { token });
  },
  async createBook(data: any, token: string) {
    return fetchAPI(API_ENDPOINTS.books.create, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  },
  async updateBook(id: string, data: any, token: string) {
    return fetchAPI(API_ENDPOINTS.books.update(id), {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    });
  },
  async deleteBook(id: string, token: string) {
    return fetchAPI(API_ENDPOINTS.books.delete(id), {
      method: 'DELETE',
      token,
    });
  },
};

export const categoryApi = {
  async getCategories(token?: string) {
    return fetchAPI(API_ENDPOINTS.categories.list, { token });
  },
};

export const orderApi = {
  async getOrders(token: string, params?: Record<string, any>) {
    const queryString = params 
      ? '?' + new URLSearchParams(
          Object.entries(params).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              acc[key] = String(value);
            }
            return acc;
          }, {} as Record<string, string>)
        ).toString() 
      : '';
    return fetchAPI(API_ENDPOINTS.orders.list + queryString, { token });
  },
  async getOrder(id: string, token: string) {
    return fetchAPI(API_ENDPOINTS.orders.detail(id), { token });
  },
  async updateOrderStatus(id: string, status: string, token: string) {
    return fetchAPI(API_ENDPOINTS.orders.updateStatus(id), {
      method: 'PUT',
      body: JSON.stringify({ status }),
      token,
    });
  },
  async createOrderFromCart(shippingAddress: string, token: string) {
    return fetchAPI(API_ENDPOINTS.orders.createFromCart, {
      method: 'POST',
      body: JSON.stringify({ shipping_address: shippingAddress }),
      token,
    });
  },
};

export const userApi = {
  async getUsers(token: string) {
    return fetchAPI(API_ENDPOINTS.users.list, { token });
  },
  async updateUser(id: string | number, data: any, token: string) {
    return fetchAPI(API_ENDPOINTS.users.detail(String(id)), {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    });
  },
  async resetPassword(id: string | number, newPassword: string, token: string) {
    return fetchAPI(`${API_ENDPOINTS.users.detail(String(id))}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify({ new_password: newPassword }),
      token,
    });
  },
};

export const paymentApi = {
  async getPayments(token: string) {
    return fetchAPI(API_ENDPOINTS.payments.list, { token });
  },
  async getPaymentByOrder(orderId: string, token: string) {
    return fetchAPI(API_ENDPOINTS.payments.byOrder(orderId), { token });
  },
  async updateStatus(id: string, status: string, token: string) {
    return fetchAPI(API_ENDPOINTS.payments.updateStatus(id), {
      method: 'PUT',
      body: JSON.stringify({ status }),
      token,
    });
  },
};

export const dashboardApi = {
  async getSummary(token: string) {
    return fetchAPI(API_ENDPOINTS.dashboard.summary, { token });
  },
  async getCharts(period: string = '30d', token: string) {
    return fetchAPI(`${API_ENDPOINTS.dashboard.charts}?range=${period}`, { token });
  },
  async getTopSelling(period: string = 'month', token: string) {
    return fetchAPI(`${API_ENDPOINTS.dashboard.topSelling}?period=${period}`, { token });
  },
  async getRecentOrders(limit: number = 5, token: string) {
    return fetchAPI(`${API_ENDPOINTS.dashboard.recentOrders}?limit=${limit}`, { token });
  },
  async getRevenueStats(period: string, token: string) {
    return fetchAPI(`${API_ENDPOINTS.statistics.revenue}?period=${period}`, { token });
  },
  async getUserStats(token: string) {
    return fetchAPI(API_ENDPOINTS.statistics.users, { token });
  },
  async getBookStats(token: string) {
    return fetchAPI(API_ENDPOINTS.statistics.books, { token });
  },
};

export const cartApi = {
  async getCart(token: string) {
    return fetchAPI(API_ENDPOINTS.cart.list, { token });
  },
  async addToCart(bookId: string, quantity: number = 1, token: string) {
    return fetchAPI(API_ENDPOINTS.cart.add, {
      method: 'POST',
      body: JSON.stringify({ bookId: Number(bookId), quantity }),
      token,
    });
  },
  async updateCart(itemId: string, quantity: number, token: string) {
    return fetchAPI(API_ENDPOINTS.cart.update(itemId), {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
      token,
    });
  },
  async removeFromCart(itemId: string, token: string) {
    return fetchAPI(API_ENDPOINTS.cart.remove(itemId), {
      method: 'DELETE',
      token,
    });
  },
  async clearCart(token: string) {
    return fetchAPI(API_ENDPOINTS.cart.clear, {
      method: 'DELETE',
      token,
    });
  },
};

export const uploadApi = {
  async uploadBookImage(file: File, token: string) {
    const formData = new FormData();
    formData.append('image', file);
    return fetchAPI<{ image_url: string }>(API_ENDPOINTS.upload.image, {
      method: 'POST',
      body: formData,
      token,
      isMultipart: true,
    });
  },
};

export const notificationApi = {
  async getNotifications(token: string, page: number = 1, limit: number = 20) {
    return fetchAPI(`${API_ENDPOINTS.notifications.list}?page=${page}&limit=${limit}`, { token });
  },
  async markAsRead(notificationIds: number[] | 'all', token: string) {
    return fetchAPI(API_ENDPOINTS.notifications.markRead, {
      method: 'PUT',
      body: JSON.stringify({ ids: notificationIds }),
      token,
    });
  },
};
