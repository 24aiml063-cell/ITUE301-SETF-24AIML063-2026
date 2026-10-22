import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import EventsPage from '../../pages/EventsPage';

const mockToken = 'mock-token-123';
const mockEvents = [
  { id: 'evt-1', title: 'Tech Summit', category: 'Technology', date: '2026-11-15', venue: 'Bengaluru', ticketsAvailable: 10 },
  { id: 'evt-2', title: 'Jazz Night', category: 'Music', date: '2026-11-22', venue: 'Mumbai', ticketsAvailable: 0 },
];

function renderEventsPage(token = mockToken) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={{ token, attendee: null, role: 'attendee', login: vi.fn(), logout: vi.fn() }}>
        <EventsPage />
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

beforeEach(() => { vi.restoreAllMocks(); });

describe('EventsPage - loading state', () => {
  it('shows loading indicator while fetch is in progress', async () => {
    global.fetch = vi.fn(() => new Promise(() => {}));
    renderEventsPage();
    expect(screen.getByRole('status', { name: /loading events/i })).toBeInTheDocument();
  });
});

describe('EventsPage - error state', () => {
  it('displays error message on API failure without crashing', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));
    renderEventsPage();
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(/network error/i);
  });

  it('shows retry button on error', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('fail')));
    renderEventsPage();
    await waitFor(() => expect(screen.getByText(/retry/i)).toBeInTheDocument());
  });
});

describe('EventsPage - success state', () => {
  it('renders one EventCard per fetched event', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(mockEvents) })
    );
    renderEventsPage();
    await waitFor(() => expect(screen.getByText('Tech Summit')).toBeInTheDocument());
    expect(screen.getByText('Jazz Night')).toBeInTheDocument();
  });

  it('shows sold-out badge for events with 0 tickets', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(mockEvents) })
    );
    renderEventsPage();
    await waitFor(() => expect(screen.getByText(/sold out/i)).toBeInTheDocument());
  });

  it('shows empty state message when API returns empty array', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    );
    renderEventsPage();
    await waitFor(() => expect(screen.getByText(/no events available/i)).toBeInTheDocument());
  });
});

describe('EventsPage - client-side search', () => {
  it('filters events by title (case-insensitive, partial match)', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(mockEvents) })
    );
    renderEventsPage();
    await waitFor(() => screen.getByText('Tech Summit'));

    const fetchCallCount = global.fetch.mock.calls.length;
    fireEvent.change(screen.getByLabelText(/search events by title/i), { target: { value: 'jazz' } });

    expect(screen.queryByText('Tech Summit')).not.toBeInTheDocument();
    expect(screen.getByText('Jazz Night')).toBeInTheDocument();
    expect(global.fetch.mock.calls.length).toBe(fetchCallCount);
  });

  it('shows no-match message when search yields nothing', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(mockEvents) })
    );
    renderEventsPage();
    await waitFor(() => screen.getByText('Tech Summit'));
    fireEvent.change(screen.getByLabelText(/search events by title/i), { target: { value: 'zzznomatch' } });
    expect(screen.getByText(/no events found matching/i)).toBeInTheDocument();
  });
});

describe('EventsPage - booking form', () => {
  it('sends correct payload and Authorization header on booking', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockEvents) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 'tkt-1', quantity: 1, status: 'booked' }) });

    renderEventsPage();
    // Wait for Tech Summit to appear, then click its specific Book button
    await waitFor(() => screen.getByLabelText(/book tickets for tech summit/i));
    fireEvent.click(screen.getByLabelText(/book tickets for tech summit/i));

    await waitFor(() => screen.getByRole('dialog'));
    fireEvent.click(screen.getByText('Confirm Booking'));

    await waitFor(() => {
      expect(global.fetch.mock.calls.length).toBe(2);
      const [url, opts] = global.fetch.mock.calls[1];
      expect(url).toContain('/api/v1/tickets');
      expect(opts.headers.Authorization).toBe(`Bearer ${mockToken}`);
      const body = JSON.parse(opts.body);
      expect(body.eventId).toBe('evt-1');
      expect(body.quantity).toBe(1);
    });
  });

  it('displays success message only after server confirms (HTTP 201)', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockEvents) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 'tkt-1', quantity: 1, status: 'booked' }) });

    renderEventsPage();
    await waitFor(() => screen.getByLabelText(/book tickets for tech summit/i));
    fireEvent.click(screen.getByLabelText(/book tickets for tech summit/i));
    await waitFor(() => screen.getByRole('dialog'));
    fireEvent.click(screen.getByText('Confirm Booking'));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/booking confirmed/i));
  });

  it('displays server error message on booking failure', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockEvents) })
      .mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: 'Insufficient availability' }) });

    renderEventsPage();
    await waitFor(() => screen.getByLabelText(/book tickets for tech summit/i));
    fireEvent.click(screen.getByLabelText(/book tickets for tech summit/i));
    await waitFor(() => screen.getByRole('dialog'));
    fireEvent.click(screen.getByText('Confirm Booking'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/insufficient/i));
  });
});
