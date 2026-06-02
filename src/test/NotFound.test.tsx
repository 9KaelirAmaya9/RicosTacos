import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/dom';
import { renderWithProviders } from './utils';
import NotFound from '@/pages/NotFound';

describe('NotFound Page', () => {
  it('renders 404 heading', () => {
    renderWithProviders(<NotFound />);
    
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renders page not found message', () => {
    renderWithProviders(<NotFound />);
    
    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
  });

  it('has a link to home page', () => {
    renderWithProviders(<NotFound />);
    
    const homeLink = screen.getByRole('link', { name: /return to home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });
});


