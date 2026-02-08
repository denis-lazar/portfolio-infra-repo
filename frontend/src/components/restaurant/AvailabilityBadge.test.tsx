import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AvailabilityBadge from './AvailabilityBadge';
import React from 'react';

describe('AvailabilityBadge', () => {
  it('renders "Available" when isAvailable is true', () => {
    render(<AvailabilityBadge isAvailable={true} />);
    expect(screen.getByText(/Available/i)).toBeInTheDocument();
  });

  it('renders the reason when isAvailable is false', () => {
    render(<AvailabilityBadge isAvailable={false} reason="Out of Mushrooms" />);
    expect(screen.getByText(/Out of Mushrooms/i)).toBeInTheDocument();
  });

  it('renders optional items if provided', () => {
    render(<AvailabilityBadge isAvailable={true} missingOptional={['Onions']} />);
    expect(screen.getByText(/Ready without:/i)).toBeInTheDocument();
    expect(screen.getByText(/Onions/i)).toBeInTheDocument();
  });
});
