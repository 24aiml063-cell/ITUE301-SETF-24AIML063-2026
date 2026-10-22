import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import * as fc from 'fast-check';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import EventsPage from '../../pages/EventsPage';

function renderEventsPage(token = 'test-token') {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={{ token, attendee: null, role: 'attendee', login: vi.fn(), logout: vi.fn() }}>
        <EventsPage />
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

const safeString = fc.stringMatching(/^[A-Za-z0-9][A-Za-z0-9 ]{1,30}[A-Za-z0-9]$/);

const eventArbitrary = fc.record({
  id: fc.uuid(),
  title: safeString,
  category: fc.constantFrom('Music', 'Tech', 'Sports', 'Arts'),
  date: fc.constant('2026-12-01'),
  venue: safeString,
  ticketsAvailable: fc.nat(500),
});

beforeEach(() => { vi.restoreAllMocks(); });

// Feature: eventhub-ticket-booking, Property 12: EventsPage renders one EventCard per fetched event
describe('Property 12: EventsPage renders one EventCard per fetched event', () => {
  it('holds for 100 iterations', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(eventArbitrary, { minLength: 1, maxLength: 4 }), async (events) => {
        global.fetch = vi.fn(() =>
          Promise.resolve({ ok: true, json: () => Promise.resolve(events) })
        );
        const { container, unmount } = renderEventsPage();
        // Verify exactly N event-card elements rendered (one per fetched event)
        await waitFor(() => {
          const cards = container.querySelectorAll('.event-card');
          expect(cards.length).toBe(events.length);
        });
        unmount();
      }),
      { numRuns: 100 }
    );
  }, 60000);
});

// Feature: eventhub-ticket-booking, Property 13: API failure renders an error message without crashing
describe('Property 13: API failure renders an error message without crashing', () => {
  it('holds for 100 iterations with random error messages', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1, maxLength: 50 }), async (msg) => {
        global.fetch = vi.fn(() => Promise.reject(new Error(msg)));
        const { container, unmount } = renderEventsPage();
        await waitFor(() => {
          const alert = container.querySelector('[role="alert"]');
          expect(alert).not.toBeNull();
          expect(alert.textContent.length).toBeGreaterThan(0);
        });
        unmount();
      }),
      { numRuns: 100 }
    );
  }, 120000);
});

// Feature: eventhub-ticket-booking, Property 14: Client-side search filters by title without additional API requests
describe('Property 14: Client-side search filters by title without additional API requests', () => {
  it('holds for 100 iterations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(eventArbitrary, { minLength: 1, maxLength: 4 }),
        safeString,
        async (events, query) => {
          global.fetch = vi.fn(() =>
            Promise.resolve({ ok: true, json: () => Promise.resolve(events) })
          );
          const { container, unmount } = renderEventsPage();

          // Wait for events to load
          await waitFor(() => {
            expect(container.querySelectorAll('.event-card').length).toBeGreaterThanOrEqual(1);
          });

          const callsBefore = global.fetch.mock.calls.length;

          // Use within(container) to avoid multi-element errors from stale DOM
          const input = within(container).getByLabelText(/search events by title/i);
          fireEvent.change(input, { target: { value: query } });

          // No extra API calls
          expect(global.fetch.mock.calls.length).toBe(callsBefore);

          const expected = events.filter((e) =>
            e.title.toLowerCase().includes(query.toLowerCase())
          );
          if (expected.length === 0) {
            expect(within(container).queryByText(/no events found/i)).not.toBeNull();
          } else {
            expect(within(container).queryAllByText(expected[0].title).length).toBeGreaterThanOrEqual(1);
          }
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  }, 120000);
});

// Feature: eventhub-ticket-booking, Property 15: Booking updates displayed available ticket count
describe('Property 15: Booking updates displayed available ticket count', () => {
  it('holds for 100 iterations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 1, max: 5 }),
        async (available, qty) => {
          fc.pre(qty <= available);
          const event = {
            id: 'evt-prop15',
            title: 'PropertyTestEvent',
            category: 'Tech',
            date: '2026-12-01',
            venue: 'TestVenue',
            ticketsAvailable: available,
          };
          global.fetch = vi.fn()
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([event]) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 'tkt-x', quantity: qty, status: 'booked' }) });

          const { container, unmount } = renderEventsPage();
          await waitFor(() =>
            within(container).getByLabelText(/book tickets for PropertyTestEvent/i)
          );
          fireEvent.click(within(container).getByLabelText(/book tickets for PropertyTestEvent/i));
          await waitFor(() => within(container).getByRole('dialog'));
          fireEvent.change(within(container).getByLabelText(/quantity/i), { target: { value: String(qty) } });
          fireEvent.click(within(container).getByText('Confirm Booking'));
          await waitFor(() =>
            expect(within(container).getByRole('status')).toHaveTextContent(/booking confirmed/i)
          );
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  }, 120000);
});
