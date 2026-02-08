
export type UserRole = 'CUSTOMER' | 'MANAGER' | 'ADMIN';

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Visit {
  restaurantId: string;
  restaurantName: string;
  date: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  restaurantId?: string; // For managers
  favorites: string[]; // Array of restaurant IDs
  visits: Visit[];
}

export interface Ingredient {
  id: string;
  name: string;
  inStock: boolean;
}

export interface Hardware {
  id: string;
  name: string;
  operational: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  requiredIngredients: string[]; // Ingredient IDs (Hard requirement)
  optionalIngredients?: string[]; // Ingredient IDs (Soft requirement - triggers warning)
  requiredHardware: string[];    // Hardware IDs
  rating: number;
  reviews: Review[];
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  logo: string;
  image: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  tags: string[]; // For filtering: e.g., ["Kosher", "Meat", "Vegan"]
  ingredients: Ingredient[];
  hardware: Hardware[];
  menu: MenuItem[];
  reviews: Review[];
}
