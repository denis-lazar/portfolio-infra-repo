
import { Restaurant } from './types';

export const INITIAL_RESTAURANTS: Restaurant[] = [
  {
    id: 'rest-1',
    name: 'The Pizza Forge',
    description: 'Artisan wood-fired pizzas and fresh salads with a focus on seasonal toppings.',
    cuisine: 'Italian',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop',
    address: '123 Oven Lane, Foodville',
    lat: 40.7128,
    lng: -74.0060,
    rating: 4.8,
    reviewCount: 124,
    tags: ['Italian', 'Vegetarian', 'Meat'],
    ingredients: [
      { id: 'ing-1', name: 'Fresh Mozzarella', inStock: true },
      { id: 'ing-2', name: 'Mushrooms', inStock: true },
      { id: 'ing-3', name: 'Basil', inStock: true },
      { id: 'ing-4', name: 'Pepperoni', inStock: true },
      { id: 'ing-5', name: 'Artichokes', inStock: true },
      { id: 'ing-6', name: 'Onions', inStock: true },
    ],
    hardware: [
      { id: 'hw-1', name: 'Main Pizza Oven', operational: true },
      { id: 'hw-2', name: 'Salad Prep Station', operational: true },
    ],
    menu: [
      {
        id: 'm-1',
        name: 'Margherita Pizza',
        description: 'San Marzano tomatoes, fresh mozzarella, and aromatic basil.',
        price: 14.99,
        category: 'Pizza',
        image: 'https://images.unsplash.com/photo-1574071318508-1cdbad80ad38?q=80&w=2070&auto=format&fit=crop',
        requiredIngredients: ['ing-1'],
        optionalIngredients: ['ing-3'],
        requiredHardware: ['hw-1'],
        rating: 4.9,
        reviews: []
      },
      {
        id: 'm-2',
        name: 'Mushroom Magic',
        description: 'Wild mushrooms with truffle oil and fresh herbs.',
        price: 16.99,
        category: 'Pizza',
        image: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?q=80&w=1974&auto=format&fit=crop',
        requiredIngredients: ['ing-1', 'ing-2'],
        optionalIngredients: ['ing-6'],
        requiredHardware: ['hw-1'],
        rating: 4.7,
        reviews: []
      }
    ],
    reviews: [
      { id: 'rev-1', userId: 'u-1', userName: 'John Doe', rating: 5, comment: 'Best pizza in town!', date: '2024-05-20' }
    ]
  },
  {
    id: 'rest-2',
    name: 'Burger Haven',
    description: 'Gourmet burgers and handcrafted shakes.',
    cuisine: 'American',
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=2072&auto=format&fit=crop',
    address: '456 Patty Place, Grill Town',
    lat: 40.7300,
    lng: -73.9950,
    rating: 4.5,
    reviewCount: 210,
    tags: ['Meat', 'American', 'Fast Food'],
    ingredients: [
      { id: 'ing-b1', name: 'Wagyu Beef', inStock: true },
      { id: 'ing-b2', name: 'Brioche Buns', inStock: true },
      { id: 'ing-b3', name: 'Onions', inStock: true },
      { id: 'ing-b4', name: 'Pickles', inStock: true },
    ],
    hardware: [
      { id: 'hw-b1', name: 'Flat Top Grill', operational: true },
    ],
    menu: [
      {
        id: 'mb-1',
        name: 'Classic Wagyu',
        description: 'Juicy beef on brioche with secret sauce.',
        price: 18.99,
        category: 'Burger',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=2070&auto=format&fit=crop',
        requiredIngredients: ['ing-b1', 'ing-b2'],
        optionalIngredients: ['ing-b3', 'ing-b4'],
        requiredHardware: ['hw-b1'],
        rating: 4.6,
        reviews: []
      }
    ],
    reviews: []
  },
  {
    id: 'rest-3',
    name: 'Sushi Zen',
    description: 'Traditional sushi and modern Japanese fusion.',
    cuisine: 'Japanese',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=2070&auto=format&fit=crop',
    address: '789 Koi Street, Zen District',
    lat: 40.7400,
    lng: -73.9800,
    rating: 4.9,
    reviewCount: 342,
    tags: ['Japanese', 'Healthy', 'Sushi', 'Kosher'],
    ingredients: [
      { id: 'ing-s1', name: 'Bluefin Tuna', inStock: true },
      { id: 'ing-s2', name: 'Salmon', inStock: true },
      { id: 'ing-s3', name: 'Wasabi', inStock: true },
    ],
    hardware: [
      { id: 'hw-s1', name: 'Sushi Counter', operational: true },
    ],
    menu: [
      {
        id: 'ms-1',
        name: 'Omakase Set',
        description: 'Chef\'s special selection of daily fresh fish.',
        price: 85.00,
        category: 'Sushi',
        image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=1925&auto=format&fit=crop',
        requiredIngredients: ['ing-s1', 'ing-s2'],
        optionalIngredients: ['ing-s3'],
        requiredHardware: ['hw-s1'],
        rating: 5.0,
        reviews: []
      }
    ],
    reviews: []
  },
  {
    id: 'rest-5',
    name: 'Steak & Soul',
    description: 'Premium cuts and rich sides for the meat lover.',
    cuisine: 'Steakhouse',
    image: 'https://images.unsplash.com/photo-1546241072-48010ad28c2c?q=80&w=1974&auto=format&fit=crop',
    address: '321 Ribeye Road, Meatville',
    lat: 40.7100,
    lng: -74.0150,
    rating: 4.7,
    reviewCount: 156,
    tags: ['Meat', 'American'],
    ingredients: [
      { id: 'ing-st1', name: 'Ribeye', inStock: true },
      { id: 'ing-st2', name: 'Truffle Butter', inStock: true },
    ],
    hardware: [
      { id: 'hw-st1', name: 'High-Heat Grill', operational: true },
    ],
    menu: [
      {
        id: 'mst-1',
        name: 'Signature Ribeye',
        description: '16oz cut topped with truffle butter.',
        price: 45.00,
        category: 'Steak',
        image: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?q=80&w=2070&auto=format&fit=crop',
        requiredIngredients: ['ing-st1'],
        optionalIngredients: ['ing-st2'],
        requiredHardware: ['hw-st1'],
        rating: 4.8,
        reviews: []
      }
    ],
    reviews: []
  },
  {
    id: 'rest-6',
    name: 'Pasta Palace',
    description: 'Authentic handmade pasta in the heart of the city.',
    cuisine: 'Italian',
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=2070&auto=format&fit=crop',
    address: '22 Linguine Lane, Sauce City',
    lat: 40.7250,
    lng: -74.0000,
    rating: 4.4,
    reviewCount: 95,
    tags: ['Italian', 'Vegetarian', 'Kosher'],
    ingredients: [
      { id: 'ing-p1', name: 'Semolina Flour', inStock: true },
      { id: 'ing-p2', name: 'Fresh Eggs', inStock: true },
      { id: 'ing-p3', name: 'Pecorino', inStock: true },
    ],
    hardware: [
      { id: 'hw-p1', name: 'Pasta Extruder', operational: true },
    ],
    menu: [
      {
        id: 'mp-1',
        name: 'Classic Carbonara',
        description: 'Pecorino, egg yolk, and black pepper.',
        price: 18.50,
        category: 'Pasta',
        image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=2071&auto=format&fit=crop',
        requiredIngredients: ['ing-p1', 'ing-p2'],
        optionalIngredients: ['ing-p3'],
        requiredHardware: ['hw-p1'],
        rating: 4.5,
        reviews: []
      }
    ],
    reviews: []
  }
];
