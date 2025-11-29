import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_VERSION = '/api/v1';

// Token storage keys
const TOKEN_KEY = 'velorize_access_token';
const USER_KEY = 'velorize_user';

// Types for authentication
export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'admin' | 'sop_leader' | 'viewer';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

// Create axios instance
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: `${API_BASE_URL}${API_VERSION}`,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth token
  client.interceptors.request.use(
    (config) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Clear stored auth data on 401
        if (typeof window !== 'undefined') {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
};

export const apiClient = createApiClient();

// Auth utilities
export const authUtils = {
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  removeToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  setUser: (user: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  getUser: (): User | null => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  },

  removeUser: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_KEY);
    }
  },

  isAuthenticated: (): boolean => {
    return !!authUtils.getToken();
  },

  logout: () => {
    authUtils.removeToken();
    authUtils.removeUser();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
};

// API methods
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login/json', credentials);
    
    // Store token and user data
    authUtils.setToken(response.data.access_token);
    authUtils.setUser(response.data.user);
    
    return response.data;
  },

  logout: () => {
    authUtils.logout();
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    authUtils.setUser(response.data);
    return response.data;
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/refresh');
    authUtils.setToken(response.data.access_token);
    authUtils.setUser(response.data.user);
    return response.data;
  },
};

// Products API
export const productsApi = {
  getProducts: async (params?: {
    skip?: number;
    limit?: number;
    category?: string;
    status?: string;
    search?: string;
  }) => {
    const response = await apiClient.get('/products/', { params });
    return response.data;
  },

  getProduct: async (productId: number) => {
    const response = await apiClient.get(`/products/${productId}`);
    return response.data;
  },

  searchProducts: async (query: string, limit = 50) => {
    const response = await apiClient.get('/products/search/', {
      params: { q: query, limit },
    });
    return response.data;
  },

  getProductStats: async () => {
    const response = await apiClient.get('/products/stats/');
    return response.data;
  },
};

// Health check
export const healthApi = {
  checkStatus: async () => {
    const response = await apiClient.get('/status');
    return response.data;
  },

  checkHealth: async () => {
    const response = await apiClient.get('/', { baseURL: API_BASE_URL });
    return response.data;
  },
};

// Analytics API
export const analyticsApi = {
  // ABC Analysis
  getABCAnalysis: async (period?: number): Promise<any> => {
    const response = await apiClient.get('/analytics/abc-analysis', {
      params: { analysis_period_days: period }
    });
    return response.data;
  },

  // XYZ Analysis
  getXYZAnalysis: async (period?: number): Promise<any> => {
    const response = await apiClient.get('/analytics/xyz-analysis', {
      params: { analysis_period_days: period }
    });
    return response.data;
  },

  // ABC-XYZ Matrix
  getABCXYZMatrix: async (period?: number): Promise<any> => {
    const response = await apiClient.get('/analytics/abc-xyz-matrix', {
      params: { analysis_period_days: period }
    });
    return response.data;
  },

  // Seasonal Analysis
  getSeasonalAnalysis: async (productId?: number, months?: number): Promise<any> => {
    const response = await apiClient.get('/analytics/seasonal-analysis', {
      params: { product_id: productId, analysis_period_months: months }
    });
    return response.data;
  },

  // Velocity Analysis
  getVelocityAnalysis: async (period?: number): Promise<any> => {
    const response = await apiClient.get('/analytics/velocity-analysis', {
      params: { analysis_period_days: period }
    });
    return response.data;
  },

  // Profitability Analysis
  getProfitabilityAnalysis: async (period?: number): Promise<any> => {
    const response = await apiClient.get('/analytics/profitability-analysis', {
      params: { analysis_period_days: period }
    });
    return response.data;
  },
};

// Dashboard API
export const dashboardApi = {
  // Dashboard Overview
  getOverview: async (): Promise<any> => {
    const response = await apiClient.get('/dashboard/overview');
    return response.data;
  },

  // Sales Trends
  getSalesTrends: async (period = 'monthly', monthsBack = 12): Promise<any> => {
    const response = await apiClient.get('/dashboard/sales-trends', {
      params: { period, months_back: monthsBack }
    });
    return response.data;
  },

  // Top Products
  getTopProducts: async (metric = 'revenue', periodDays = 30, limit = 10): Promise<any> => {
    const response = await apiClient.get('/dashboard/top-products', {
      params: { metric, period_days: periodDays, limit }
    });
    return response.data;
  },

  // Inventory Alerts
  getInventoryAlerts: async (): Promise<any> => {
    const response = await apiClient.get('/dashboard/inventory-alerts');
    return response.data;
  },

  // Forecast Accuracy
  getForecastAccuracy: async (months = 3): Promise<any> => {
    const response = await apiClient.get('/dashboard/forecast-accuracy', {
      params: { evaluation_months: months }
    });
    return response.data;
  },

  // KPIs
  getKPIs: async (): Promise<any> => {
    const response = await apiClient.get('/dashboard/kpis');
    return response.data;
  },

  // System Health
  getSystemHealth: async (): Promise<any> => {
    const response = await apiClient.get('/dashboard/system-health');
    return response.data;
  },
};

// Forecasting API
export const forecastingApi = {
  // Get Forecasts
  getForecasts: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/forecasting/', { params });
    return response.data;
  },

  // Generate Forecasts
  generateForecasts: async (data: any): Promise<any> => {
    const response = await apiClient.post('/forecasting/generate', data);
    return response.data;
  },

  // Get Forecast Accuracy
  getAccuracy: async (months = 6, productId?: number): Promise<any> => {
    const response = await apiClient.get('/forecasting/accuracy', {
      params: { evaluation_periods: months, product_id: productId }
    });
    return response.data;
  },

  // Update Forecast
  updateForecast: async (id: number, data: any): Promise<any> => {
    const response = await apiClient.put(`/forecasting/${id}`, data);
    return response.data;
  },

  // Delete Forecast
  deleteForecast: async (id: number): Promise<any> => {
    const response = await apiClient.delete(`/forecasting/${id}`);
    return response.data;
  },

  // Get Methods
  getMethods: async (): Promise<any> => {
    const response = await apiClient.get('/forecasting/methods');
    return response.data;
  },

  // Get Stats
  getStats: async (): Promise<any> => {
    const response = await apiClient.get('/forecasting/stats');
    return response.data;
  },
};

// Optimization API
export const optimizationApi = {
  // EOQ Analysis
  getEOQAnalysis: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/optimization/eoq-analysis', { params });
    return response.data;
  },

  // Reorder Points
  getReorderPoints: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/optimization/reorder-points', { params });
    return response.data;
  },

  // ABC-XYZ Optimization
  getABCXYZOptimization: async (period?: number): Promise<any> => {
    const response = await apiClient.get('/optimization/abc-xyz-optimization', {
      params: { analysis_period_days: period }
    });
    return response.data;
  },

  // Stock Recommendations
  getStockRecommendations: async (urgency?: string): Promise<any> => {
    const response = await apiClient.get('/optimization/stock-recommendations', {
      params: { urgency_filter: urgency }
    });
    return response.data;
  },

  // Optimization Summary
  getSummary: async (): Promise<any> => {
    const response = await apiClient.get('/optimization/optimization-summary');
    return response.data;
  },
};

// Marketing API
export const marketingApi = {
  // Marketing Calendar
  getCalendar: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/marketing/calendar', { params });
    return response.data;
  },

  createEvent: async (data: any): Promise<any> => {
    const response = await apiClient.post('/marketing/calendar', data);
    return response.data;
  },

  updateEvent: async (id: number, data: any): Promise<any> => {
    const response = await apiClient.put(`/marketing/calendar/${id}`, data);
    return response.data;
  },

  deleteEvent: async (id: number): Promise<any> => {
    const response = await apiClient.delete(`/marketing/calendar/${id}`);
    return response.data;
  },

  // Upcoming Events
  getUpcomingEvents: async (days = 30): Promise<any> => {
    const response = await apiClient.get('/marketing/calendar/upcoming', {
      params: { days_ahead: days }
    });
    return response.data;
  },

  // Impact Analysis
  getImpactAnalysis: async (eventId?: number, months = 6): Promise<any> => {
    const response = await apiClient.get('/marketing/calendar/impact-analysis', {
      params: { event_id: eventId, analysis_months: months }
    });
    return response.data;
  },

  // AOP (Annual Operating Plan)
  getAOPPlans: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/marketing/aop', { params });
    return response.data;
  },

  createAOP: async (data: any): Promise<any> => {
    const response = await apiClient.post('/marketing/aop', data);
    return response.data;
  },

  updateAOP: async (id: number, data: any): Promise<any> => {
    const response = await apiClient.put(`/marketing/aop/${id}`, data);
    return response.data;
  },

  getAOPPerformance: async (id: number, period?: string): Promise<any> => {
    const response = await apiClient.get(`/marketing/aop/${id}/performance`, {
      params: { period }
    });
    return response.data;
  },

  getCurrentAOPDashboard: async (): Promise<any> => {
    const response = await apiClient.get('/marketing/aop/current/dashboard');
    return response.data;
  },

  getStats: async (): Promise<any> => {
    const response = await apiClient.get('/marketing/stats');
    return response.data;
  },
};

export default apiClient;
