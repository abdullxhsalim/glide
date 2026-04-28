import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Footer from '../components/Footer';

describe('Footer Component', () => {
  it('renders correctly', () => {
    render(<Footer />);
    // Check if the Glide brand name exists in the footer
    expect(screen.getByText(/Glide/i)).toBeInTheDocument();
  });
});
