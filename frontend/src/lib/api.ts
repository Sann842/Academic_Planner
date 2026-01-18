const API_BASE_URL = "http://127.0.0.1:8000/api";

// -------------------------
// Token management
// -------------------------
export const getTokens = () => {
  const access = localStorage.getItem("access_token");
  const refresh = localStorage.getItem("refresh_token");
  return { access, refresh };
};

export const setTokens = (access: string, refresh: string) => {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
};

export const clearTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("username");
};

// -------------------------
// API request helper with auth
// -------------------------
const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const { access } = getTokens();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (access) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${access}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

  // Handle 401 -> refresh token
  if (response.status === 401) {
    const { refresh } = getTokens();
    if (refresh) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setTokens(data.access, refresh);
          (headers as Record<string, string>)["Authorization"] = `Bearer ${data.access}`;
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
          return retryResponse.json();
        }
      } catch {
        clearTokens();
        throw new Error("Session expired. Please login again.");
      }
    }
    clearTokens();
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.error || "Request failed");
  }

  if (response.status === 204) return null;

  return response.json();
};

// -------------------------
// Auth API
// -------------------------
export const authApi = {
  login: async (username: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "Invalid credentials");
    }

    const data = await response.json();
    setTokens(data.access, data.refresh);
    localStorage.setItem("username", username);
    return data;
  },

  register: async (username: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.error || "Registration failed");
    }

    localStorage.setItem("username", username);
    return response.json();
  },

  logout: () => {
    clearTokens();
  },
};

// -------------------------
// Holidays API (public)
// -------------------------
export const holidaysApi = {
  getAll: () => apiRequest("/holidays/"),
  getById: (id: number) => apiRequest(`/holidays/${id}/`),
};

// -------------------------
// Events API (authenticated)
// -------------------------
export const eventsApi = {
  getAll: () => apiRequest("/events/"),
  getById: (id: number) => apiRequest(`/events/${id}/`),
  create: (data: { title: string; description?: string; date_bs: string }) =>
    apiRequest("/events/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: { title?: string; description?: string; date_bs?: string }) =>
    apiRequest(`/events/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: number) => apiRequest(`/events/${id}/`, { method: "DELETE" }),
};

// -------------------------
// Tasks API (authenticated)
// -------------------------
export const tasksApi = {
  getAll: () => apiRequest("/tasks/"),
  getById: (id: number) => apiRequest(`/tasks/${id}/`),
  create: (data: {
    title: string;
    description?: string;
    start_date: string;
    due_date: string;
    status?: string;
    assigned_to?: number;
    event?: number;
  }) => apiRequest("/tasks/", { method: "POST", body: JSON.stringify(data) }),
  update: (
    id: number,
    data: {
      title?: string;
      description?: string;
      start_date?: string;
      due_date?: string;
      status?: string;
      assigned_to?: number;
      event?: number;
    }
  ) => apiRequest(`/tasks/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: number) => apiRequest(`/tasks/${id}/`, { method: "DELETE" }),
};

// -------------------------
// Types
// -------------------------
export interface Holiday {
  id: number;
  name: string;
  date_bs: string;
  date_ad: string;
  is_public: boolean;
}

export interface Event {
  id: number;
  title: string;
  description?: string;
  date_bs: string;
  date_ad: string;
  created_by: number;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  start_date: string;
  due_date: string;
  status: "Pending" | "In Progress" | "Completed";
  assigned_to?: number;
  assigned_to_name?: string;
  event?: number;
}
