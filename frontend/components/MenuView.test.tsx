
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MenuView from './MenuView';
import React from 'react';
import { Restaurant, User } from '../types';

const mockRestaurant: Restaurant = {
  id: 'r1',
  name: 'Test Rest',
  description: 'Desc',
  cuisine: 'Italian',
  logo: '',
  image: '',
  address: 'Addr',
  lat: 0,
  lng: 0,
  rating: 4.5,
  reviewCount: 1,
  tags: [],
  ingredients: [],
  hardware: [],
  menu: [
    {
      id: 'm1',
      name: 'Pizza',
      description: 'Cheesy',
      price: 10,
      category: 'Main',
      image: '',
      requiredIngredients: [],
      optionalIngredients: [],
      requiredHardware: [],
      rating: 5,
      reviews: []
    },
    {
      id: 'm2',
      name: 'Salad',
      description: 'Green',
      price: 8,
      category: 'Starter',
      image: '',
      requiredIngredients: [],
      optionalIngredients: [],
      requiredHardware: [],
      rating: 4,
      reviews: []
    }
  ],
  reviews: []
};

const mockUser: User = {
  id: 'u1',
  email: 'u@t.com',
  name: 'User',
  role: 'CUSTOMER',
  favorites: [],
  visits: []
};

describe('MenuView', () => {
  it('filters items by category correctly', () => {
    render(
      <MenuView 
        restaurant={mockRestaurant} 
        user={mockUser} 
        onUpdateRestaurant={() => {}} 
        onToggleFavorite={() => {}} 
        showNotification={() => {}} 
        onBack={() => {}} 
      />
    );
    
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText('Salad')).toBeInTheDocument();
    
    // Click Starter category
    const starterButton = screen.getByText('Starter');
    fireEvent.click(starterButton);
    
    expect(screen.queryByText('Pizza')).not.toBeInTheDocument();
    expect(screen.getByText('Salad')).toBeInTheDocument();
  });
});
