import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import MyTicketsPage from '../../pages/MyTicketsPage';

const mockToken = 'mock-token-456';
const mockTickets = [
  {
    id: 'tkt-1',
    attendeeId: 'att-1',
    eventId: { title: 'Tech Summit', date: '2026-11-15', venue: 'Bengaluru' },
    quantity: 2,
    bookingDate: '2026-10-01T00:00:00.000Z',
    status: 'booked',
  },
];

function renderMyTickets(token = mockToken) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={{ token, attendee: null, role: 'attendee', login: vi.fn(), logout: vi.fn() }}>
        <MyTicketsPage />
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('MyTicketsPage - loading', () => {
  it('shows loading indicator while fetching', () => {
    global.fetch = vi.fn(() => new Promise(() => {}));
    renderMyTickets();
    expect(screen.getByRole('status', { name: /loading tickets/i })).toBeInTheDocument();
  });
});

describe('MyTicketsPage - error', () => {
  it('shows error message without crashing', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Server down')));
    renderMyTickets();
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(/server down/i);
  });
});

describe('MyTicketsPage - success', () => {
  it('calls GET /api/v1/tickets/my with bearer token on mount', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(mockTickets) })
    );
    renderMyTickets();
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain('/api/v1/tickets/my');
    expect(opts.headers.Authorization).toBe(`Bearer ${mockToken}`);
  });

  it('renders ticket cards from API response', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(mockTickets) })
    );
    renderMyTickets();
    await waitFor(() => expect(screen.getByText('Tech Summit')).toBeInTheDocument());
    expect(screen.getByText(/quantity: 2/i)).toBeInTheDocument();
  });

  it('shows empty state when no tickets returned', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    );
    renderMyTickets();
    await waitFor(() => expect(screen.getByText(/no tickets yet/i)).toBeInTheDocument());
  });
});
