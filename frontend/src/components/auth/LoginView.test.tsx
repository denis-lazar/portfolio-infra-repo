
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LoginView from './LoginView';
import React from 'react';

describe('LoginView', () => {
  it('does not show Account Type selection by default (login mode)', () => {
    render(<LoginView onLoginSuccess={() => {}} />);
    expect(screen.queryByText(/Account Type/i)).not.toBeInTheDocument();
  });

  it('shows Account Type selection when switching to Register mode', () => {
    render(<LoginView onLoginSuccess={() => {}} />);
    
    const joinNowButton = screen.getByText(/Join Now/i);
    fireEvent.click(joinNowButton);
    
    expect(screen.getByText(/Account Type/i)).toBeInTheDocument();
    expect(screen.getByText(/Customer/i)).toBeInTheDocument();
    expect(screen.getByText(/Manager/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin/i)).toBeInTheDocument();
  });

  it('hides Account Type selection when switching back to Login mode', () => {
    render(<LoginView onLoginSuccess={() => {}} />);
    
    const joinNowButton = screen.getByText(/Join Now/i);
    fireEvent.click(joinNowButton);
    expect(screen.getByText(/Account Type/i)).toBeInTheDocument();
    
    const logInButton = screen.getByText(/Log In/i);
    fireEvent.click(logInButton);
    expect(screen.queryByText(/Account Type/i)).not.toBeInTheDocument();
  });
});
