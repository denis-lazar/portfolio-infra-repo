
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AdminDashboard from './AdminDashboard';
import React from 'react';
import { Restaurant, User } from '../types';

const mockRestaurants: Restaurant[] = [
  {
    id: '1',
    name: 'Test Rest',
    description: 'Desc',
    cuisine: 'Italian',
    logo: '',
    image: '',
    address: 'Addr',
    lat: 0,
    lng: 0,
    rating: 4.5,
    reviewCount: 10,
    tags: [],
    ingredients: [],
    hardware: [],
    menu: [],
    reviews: []
  }
];

const mockUser: User = {
  id: 'u1',
  email: 'admin@test.com',
  name: 'Admin User',
  role: 'ADMIN',
  favorites: [],
  visits: []
};

describe('AdminDashboard', () => {
  it('renders correctly with restaurant list', () => {
    render(
      <AdminDashboard 
        restaurants={mockRestaurants} 
        user={mockUser} 
        onUpdateRestaurant={() => {}} 
        onDeleteRestaurant={() => {}} 
        onSelectRestaurant={() => {}} 
        onAddRestaurant={() => {}} 
      />
    );
    
    expect(screen.getByText(/System Administration/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Rest/i)).toBeInTheDocument();
    expect(screen.getByText(/Add New Restaurant/i)).toBeInTheDocument();
  });
});
