import { Restaurant, User, UserRole, Review, Visit, MenuItem } from '../types';

const API_BASE_URL = '/api/v1';

class RealBackend {
  private AUTH_KEY = 'menusync_session_v4'; // Incremented to v4 to ensure a fresh start for everyone
  private SESSION_INIT_KEY = 'menusync_startup_id';
  private CURRENT_STARTUP_ID = '2026-01-28-v3-reset';

  constructor() {
    this.checkSessionValidity();
  }

  private checkSessionValidity() {
    const storedId = localStorage.getItem(this.SESSION_INIT_KEY);
    const sessionData = sessionStorage.getItem(this.AUTH_KEY);
    
    // 1. Version/Startup Check
    if (storedId !== this.CURRENT_STARTUP_ID) {
      console.warn("New deployment version. Clearing session...");
      this.logout();
      localStorage.setItem(this.SESSION_INIT_KEY, this.CURRENT_STARTUP_ID);
      return;
    }

    // 2. Expiry Check (Optional but good for portfolio)
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        if (parsed.last_visit && (Date.now() - parsed.last_visit > 86400000)) { // 24 hours
          console.warn("Session expired. Logging out...");
          this.logout();
        }
      } catch (e) {
        this.logout();
      }
    }
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const user = this.getCurrentUser();
    
    // Update last visit on every request
    if (user) {
      const updated = { ...user, last_visit: Date.now() };
      sessionStorage.setItem(this.AUTH_KEY, JSON.stringify(updated));
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options?.headers as Record<string, string>) || {}),
    };

    if (user?.access_token) {
      headers['Authorization'] = `Bearer ${user.access_token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        // Token expired or invalid, clear session
        console.warn("Session expired or unauthorized. Logging out...");
        this.logout();
        window.location.reload(); // Force refresh to show login view
      }

      const errorData = await response.json().catch(() => ({ detail: 'An unknown error occurred' }));
      // FastAPI usually puts error messages in 'detail'
      const errorMessage = Array.isArray(errorData.detail) 
        ? errorData.detail[0].msg 
        : errorData.detail;
      throw new Error(errorMessage || 'Request failed');
    }

    return response.json();
  }

  async login(email: string, password: string): Promise<User> {
    const user = await this.request<User>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    sessionStorage.setItem(this.AUTH_KEY, JSON.stringify(user));
    return user;
  }

  async register(email: string, name: string, password: string, role: UserRole): Promise<User> {
    const user = await this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, name, password, role }),
    });
    sessionStorage.setItem(this.AUTH_KEY, JSON.stringify(user));
    return user;
  }

  logout() {
    sessionStorage.removeItem(this.AUTH_KEY);
  }

  getCurrentUser(): User | null {
    const data = sessionStorage.getItem(this.AUTH_KEY);
    return data ? JSON.parse(data) : null;
  }

  async getRestaurants(): Promise<Restaurant[]> {
    return this.request<Restaurant[]>('/restaurants/');
  }

  async addRestaurantReview(restaurantId: string, review: Omit<Review, 'id' | 'date'>): Promise<Restaurant> {
    const reviewWithDate = {
        ...review,
        id: "temp",
        date: new Date().toISOString().split('T')[0]
    };
    return this.request<Restaurant>(`/restaurants/${restaurantId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(reviewWithDate),
    });
  }

  async addDishReview(restaurantId: string, dishId: string, review: Omit<Review, 'id' | 'date'>): Promise<Restaurant> {
    const reviewWithDate = {
        ...review,
        id: "temp",
        date: new Date().toISOString().split('T')[0]
    };
    return this.request<Restaurant>(`/restaurants/${restaurantId}/menu/${dishId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(reviewWithDate),
    });
  }

  async updateManagerRestaurant(userId: string, restaurantId: string): Promise<User> {
    const current = this.getCurrentUser();
    const updated = await this.request<User>(`/auth/users/${userId}/claim`, {
      method: 'POST',
      body: JSON.stringify({ restaurantId }),
    });
    const final = { ...updated, access_token: current?.access_token };
    sessionStorage.setItem(this.AUTH_KEY, JSON.stringify(final));
    return final;
  }

  // Placeholder for other methods - to be implemented as we add backend endpoints
  async updateIngredient(restaurantId: string, ingredientId: string, inStock: boolean): Promise<void> {
    await this.request(`/restaurants/${restaurantId}/ingredients/${ingredientId}`, {
      method: 'PATCH',
      body: JSON.stringify({ inStock }),
    });
  }

  async updateHardware(restaurantId: string, hardwareId: string, operational: boolean): Promise<void> {
    await this.request(`/restaurants/${restaurantId}/hardware/${hardwareId}`, {
      method: 'PATCH',
      body: JSON.stringify({ operational }),
    });
  }

  async logVisit(userId: string, restaurantId: string, restaurantName: string): Promise<User> {
    const current = this.getCurrentUser();
    const updated = await this.request<User>(`/auth/users/${userId}/visit`, {
      method: 'POST',
      body: JSON.stringify({ restaurantId, restaurantName }),
    });
    const final = { ...updated, access_token: current?.access_token };
    sessionStorage.setItem(this.AUTH_KEY, JSON.stringify(final));
    return final;
  }

  async toggleFavorite(userId: string, restaurantId: string): Promise<User> {
    const current = this.getCurrentUser();
    const updated = await this.request<User>(`/auth/users/${userId}/favorites`, {
      method: 'POST',
      body: JSON.stringify({ restaurantId }),
    });
    const final = { ...updated, access_token: current?.access_token };
    sessionStorage.setItem(this.AUTH_KEY, JSON.stringify(final));
    return final;
  }

  async createRestaurant(restaurant: Restaurant): Promise<Restaurant> {
    return this.request<Restaurant>('/restaurants/', {
      method: 'POST',
      body: JSON.stringify(restaurant),
    });
  }

  async deleteRestaurant(restaurantId: string): Promise<void> {
    await this.request(`/restaurants/${restaurantId}`, {
      method: 'DELETE',
    });
  }

  async addMenuItem(restaurantId: string, item: MenuItem): Promise<Restaurant> {
    return this.request<Restaurant>(`/restaurants/${restaurantId}/menu`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async updateMenuItem(restaurantId: string, itemId: string, item: MenuItem): Promise<Restaurant> {
    return this.request<Restaurant>(`/restaurants/${restaurantId}/menu/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(item),
    });
  }

  async deleteMenuItem(restaurantId: string, itemId: string): Promise<Restaurant> {
    return this.request<Restaurant>(`/restaurants/${restaurantId}/menu/${itemId}`, {
      method: 'DELETE',
    });
  }

  async addIngredient(restaurantId: string, ingredient: { id: string, name: string, inStock: boolean }): Promise<Restaurant> {
    return this.request<Restaurant>(`/restaurants/${restaurantId}/ingredients`, {
      method: 'POST',
      body: JSON.stringify(ingredient),
    });
  }

  async updateIngredientDetails(restaurantId: string, ingredientId: string, ingredient: { id: string, name: string, inStock: boolean }): Promise<Restaurant> {
    return this.request<Restaurant>(`/restaurants/${restaurantId}/ingredients/${ingredientId}/details`, {
      method: 'PATCH',
      body: JSON.stringify(ingredient),
    });
  }

  subscribeToRestaurant(restaurantId: string, onUpdate: (data: any) => void): () => void {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/v1/restaurants/${restaurantId}/ws`;
    
    let socket: WebSocket;
    let reconnectTimeout: any;
    let isDisposed = false;

    const connect = () => {
      if (isDisposed) return;
      
      console.log(`Attempting WS connection to ${wsUrl}...`);
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WS Data Received:", data);
          onUpdate(data);
        } catch (e) {
          console.error("Failed to parse WS message", e);
        }
      };

      socket.onopen = () => {
        console.log(`✅ Connected to real-time updates for ${restaurantId}`);
      };

      socket.onclose = (e) => {
        console.log(`❌ WS Closed for ${restaurantId}. Reconnecting in 3s...`, e.reason);
        if (!isDisposed) {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };

      socket.onerror = (err) => {
        console.error("WebSocket Error:", err);
        socket.close();
      };
    };

    connect();

    return () => {
      console.log(`Disposing WS for ${restaurantId}`);
      isDisposed = true;
      clearTimeout(reconnectTimeout);
      if (socket) socket.close();
    };
  }
}

export const api = new RealBackend();