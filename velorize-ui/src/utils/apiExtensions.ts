/**
 * API Extensions for CRUD Operations
 * This file provides placeholder API functions for the new CRUD dialogs.
 * Replace with actual API implementations when backend is ready.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Helper function for API calls
async function apiCall(endpoint: string, method: string = 'GET', data?: any) {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return response.json();
}

// Products API
export const productsApi = {
  createProduct: async (data: any) => {
    return apiCall('/products/', 'POST', data);
  },
  updateProduct: async (id: number, data: any) => {
    return apiCall(`/products/${id}`, 'PUT', data);
  },
  deleteProduct: async (id: number) => {
    return apiCall(`/products/${id}`, 'DELETE');
  },
};

// Customers API
export const customersApi = {
  createCustomer: async (data: any) => {
    return apiCall('/customers/', 'POST', data);
  },
  updateCustomer: async (id: number, data: any) => {
    return apiCall(`/customers/${id}`, 'PUT', data);
  },
  deleteCustomer: async (id: number) => {
    return apiCall(`/customers/${id}`, 'DELETE');
  },
};

// Suppliers API
export const suppliersApi = {
  createSupplier: async (data: any) => {
    return apiCall('/suppliers/', 'POST', data);
  },
  updateSupplier: async (id: number, data: any) => {
    return apiCall(`/suppliers/${id}`, 'PUT', data);
  },
  deleteSupplier: async (id: number) => {
    return apiCall(`/suppliers/${id}`, 'DELETE');
  },
};

// Inventory API
export const inventoryApi = {
  adjustStock: async (data: any) => {
    return apiCall('/inventory/adjust', 'POST', data);
  },
  getStockHistory: async (productId: number) => {
    return apiCall(`/inventory/history/${productId}`);
  },
};

// BOM API
export const bomApi = {
  createBOM: async (data: any) => {
    return apiCall('/bom/', 'POST', data);
  },
  updateBOM: async (id: number, data: any) => {
    return apiCall(`/bom/${id}`, 'PUT', data);
  },
  deleteBOM: async (id: number) => {
    return apiCall(`/bom/${id}`, 'DELETE');
  },
};

// Marketing API (Events)
export const marketingApi = {
  createEvent: async (data: any) => {
    return apiCall('/marketing/events/', 'POST', data);
  },
  updateEvent: async (id: number, data: any) => {
    return apiCall(`/marketing/events/${id}`, 'PUT', data);
  },
  deleteEvent: async (id: number) => {
    return apiCall(`/marketing/events/${id}`, 'DELETE');
  },
};

// AOP API (Targets)
export const aopApi = {
  createTarget: async (data: any) => {
    return apiCall('/marketing/targets/', 'POST', data);
  },
  updateTarget: async (id: number, data: any) => {
    return apiCall(`/marketing/targets/${id}`, 'PUT', data);
  },
  deleteTarget: async (id: number) => {
    return apiCall(`/marketing/targets/${id}`, 'DELETE');
  },
};

// Users API
export const usersApi = {
  createUser: async (data: any) => {
    return apiCall('/users/', 'POST', data);
  },
  updateUser: async (id: number, data: any) => {
    return apiCall(`/users/${id}`, 'PUT', data);
  },
  deleteUser: async (id: number) => {
    return apiCall(`/users/${id}`, 'DELETE');
  },
};
