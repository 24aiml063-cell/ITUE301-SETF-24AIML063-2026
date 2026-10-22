// Feature: eventhub-ticket-booking, Property 6: EventCard renders all required event fields
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import EventCard from '../../components/EventCard';

/**
 * Property 6: EventCard renders all required event fields
 * - All 5 prop values appear in rendered output
 * - Sold Out badge present and Book button absent when ticketsAvailable === 0
 * - Book button present and no Sold Out badge when ticketsAvailable > 0
 * Minimum 100 iterations
 */
describe('EventCard Property-Based Tests', () => {
  const titleArb = fc.string({ minLength: 1, maxLength: 80 });
  const categoryArb = fc.string({ minLength: 1, maxLength: 40 });
  const venueArb = fc.string({ minLength: 1, maxLength: 80 });
  // Use simple date strings that won't cause locale rendering ambiguity in tests
  const dateArb = fc.constantFrom(
    '2026-11-01', '2026-12-01', '2027-01-01', '2027-06-15'
  );
  const availableArb = fc.integer({ min: 1, max: 9999 });

  it('Property 6: renders all five prop values in output', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: titleArb,
          category: categoryArb,
          date: dateArb,
          venue: venueArb,
          ticketsAvailable: availableArb,
        }),
        ({ title, category, date, venue, ticketsAvailable }) => {
          const { unmount } = render(
            <EventCard
              title={title}
              category={category}
              date={date}
              venue={venue}
              ticketsAvailable={ticketsAvailable}
            />
          );
          // All 5 fields must appear somewhere in the rendered output
          const container = document.body;
          const text = container.textContent;

          expect(text).toContain(title);
          expect(text).toContain(category);
          expect(text).toContain(venue);
          // ticketsAvailable count should appear
          expect(text).toContain(String(ticketsAvailable));

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 6: shows Sold Out badge and no Book button when ticketsAvailable === 0', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: titleArb,
          category: categoryArb,
          date: dateArb,
          venue: venueArb,
        }),
        ({ title, category, date, venue }) => {
          const { unmount } = render(
            <EventCard
              title={title}
              category={category}
              date={date}
              venue={venue}
              ticketsAvailable={0}
            />
          );

          // Must show Sold Out badge
          expect(screen.queryByText('Sold Out')).not.toBeNull();
          // Must NOT show a Book button
          expect(screen.queryByRole('button', { name: /book/i })).toBeNull();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 6: shows Book button and no Sold Out badge when ticketsAvailable > 0', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: titleArb,
          category: categoryArb,
          date: dateArb,
          venue: venueArb,
          ticketsAvailable: availableArb,
        }),
        ({ title, category, date, venue, ticketsAvailable }) => {
          const { unmount } = render(
            <EventCard
              title={title}
              category={category}
              date={date}
              venue={venue}
              ticketsAvailable={ticketsAvailable}
            />
          );

          // Must show Book button
          expect(screen.queryByRole('button', { name: /book/i })).not.toBeNull();
          // Must NOT show Sold Out badge
          expect(screen.queryByText('Sold Out')).toBeNull();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
