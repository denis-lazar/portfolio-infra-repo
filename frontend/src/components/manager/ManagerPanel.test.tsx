
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ManagerPanel from './ManagerPanel';
import React from 'react';
import { Restaurant, User } from '../../types';

const mockRestaurant: Restaurant = {
  id: 'r1',
  name: 'Burger Joint',
  description: 'Juicy burgers',
  cuisine: 'American',
  logo: '',
  image: '',
  address: '123 Main St',
  lat: 0,
  lng: 0,
  rating: 4.5,
  reviewCount: 10,
  tags: [],
  ingredients: [],
  hardware: [],
  menu: [],
  reviews: []
};

const mockUser: User = {
  id: 'm1',
  email: 'manager@test.com',
  name: 'Manager User',
  role: 'MANAGER',
  restaurantId: 'r1',
  favorites: [],
  visits: []
};

describe('ManagerPanel', () => {
  it('renders correctly and allows tab switching', () => {
    render(
      <ManagerPanel 
        restaurant={mockRestaurant} 
        user={mockUser} 
        onUpdateIngredient={() => {}} 
        onUpdateHardware={() => {}} 
        onUpdateRestaurant={() => {}} 
        onToggleFavorite={() => {}} 
      />
    );
    
    expect(screen.getByText(/Availability Controls/i)).toBeInTheDocument();
    expect(screen.getByText(/Menu Management/i)).toBeInTheDocument();
    expect(screen.getByText(/Customer Preview/i)).toBeInTheDocument();
    
    // Switch to Menu Management
    fireEvent.click(screen.getByText(/Menu Management/i));
    expect(screen.getByText(/Menu Items/i)).toBeInTheDocument();
    expect(screen.getByText(/Add New Meal/i)).toBeInTheDocument();
  });
});
