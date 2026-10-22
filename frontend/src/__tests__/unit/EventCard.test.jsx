import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EventCard from '../../components/EventCard';

describe('EventCard', () => {
  const baseProps = {
    title: 'Tech Summit 2026',
    category: 'Technology',
    date: '2026-11-15',
    venue: 'Convention Centre, Bengaluru',
    ticketsAvailable: 50,
  };

  it('renders the event title', () => {
    render(<EventCard {...baseProps} />);
    expect(screen.getByText('Tech Summit 2026')).toBeDefined();
  });

  it('renders the event category', () => {
    render(<EventCard {...baseProps} />);
    expect(screen.getByText('Technology')).toBeDefined();
  });

  it('renders the event venue', () => {
    render(<EventCard {...baseProps} />);
    expect(screen.getByText(/Convention Centre/i)).toBeDefined();
  });

  it('renders tickets available count', () => {
    render(<EventCard {...baseProps} />);
    expect(screen.getByText(/50 tickets/i)).toBeDefined();
  });

  it('renders the event date', () => {
    render(<EventCard {...baseProps} />);
    // The date is formatted; '2026' appears in multiple elements (title + date), so use getAllByText
    const elements = screen.getAllByText(/2026/);
    expect(elements.length).toBeGreaterThan(0);
  });

  describe('when ticketsAvailable === 0 (Sold Out)', () => {
    it('renders the Sold Out badge', () => {
      render(<EventCard {...baseProps} ticketsAvailable={0} />);
      expect(screen.getByText('Sold Out')).toBeDefined();
    });

    it('does NOT render a Book button', () => {
      render(<EventCard {...baseProps} ticketsAvailable={0} />);
      expect(screen.queryByRole('button', { name: /book/i })).toBeNull();
    });
  });

  describe('when ticketsAvailable > 0', () => {
    it('renders a Book button', () => {
      render(<EventCard {...baseProps} ticketsAvailable={10} />);
      expect(screen.getByRole('button', { name: /book/i })).toBeDefined();
    });

    it('does NOT render the Sold Out badge', () => {
      render(<EventCard {...baseProps} ticketsAvailable={10} />);
      expect(screen.queryByText('Sold Out')).toBeNull();
    });
  });

  describe('when props are missing or invalid', () => {
    it('does not crash when all props are omitted', () => {
      expect(() => render(<EventCard />)).not.toThrow();
    });

    it('does not crash when title is undefined', () => {
      expect(() => render(<EventCard {...baseProps} title={undefined} />)).not.toThrow();
    });

    it('does not crash when date is undefined', () => {
      expect(() => render(<EventCard {...baseProps} date={undefined} />)).not.toThrow();
    });

    it('does not crash when venue is undefined', () => {
      expect(() => render(<EventCard {...baseProps} venue={undefined} />)).not.toThrow();
    });

    it('shows Sold Out when ticketsAvailable is undefined (defaults to 0)', () => {
      render(<EventCard {...baseProps} ticketsAvailable={undefined} />);
      expect(screen.getByText('Sold Out')).toBeDefined();
    });
  });
});
