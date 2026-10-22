import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';

/**
 * renderRouter — seed auth state via AuthProvider initialState so that the
 * token is available synchronously on the very first render, avoiding timing
 * issues with useEffect / useLayoutEffect-based seeders.
 */
function renderRouter(initialPath, auth = {}) {
  const initialState = auth.token
    ? { attendee: auth.attendee || { email: 'test@test.com' }, token: auth.token, role: auth.role }
    : undefined;

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider initialState={initialState}>
        <Routes>
          <Route path="/" element={<div data-testid="login-page">Login Page</div>} />
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <div data-testid="events-page">Events Page</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-tickets"
            element={
              <ProtectedRoute>
                <div data-testid="tickets-page">My Tickets</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer"
            element={
              <ProtectedRoute requiredRole="organizer">
                <div data-testid="organizer-page">Organizer Panel</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

// ===== Unit Tests =====

describe('ProtectedRoute — unauthenticated redirects', () => {
  it('unauthenticated user cannot access /events → redirected to /', () => {
    renderRouter('/events', {});
    expect(screen.getByTestId('login-page')).toBeDefined();
    expect(screen.queryByTestId('events-page')).toBeNull();
  });

  it('unauthenticated user cannot access /my-tickets → redirected to /', () => {
    renderRouter('/my-tickets', {});
    expect(screen.getByTestId('login-page')).toBeDefined();
    expect(screen.queryByTestId('tickets-page')).toBeNull();
  });

  it('unauthenticated user cannot access /organizer → redirected to /', () => {
    renderRouter('/organizer', {});
    expect(screen.getByTestId('login-page')).toBeDefined();
    expect(screen.queryByTestId('organizer-page')).toBeNull();
  });
});

describe('ProtectedRoute — authenticated attendee', () => {
  const attendeeAuth = { token: 'tok123', role: 'attendee' };

  it('authenticated attendee can access /events', () => {
    renderRouter('/events', attendeeAuth);
    expect(screen.getByTestId('events-page')).toBeDefined();
    expect(screen.queryByTestId('login-page')).toBeNull();
  });

  it('authenticated attendee can access /my-tickets', () => {
    renderRouter('/my-tickets', attendeeAuth);
    expect(screen.getByTestId('tickets-page')).toBeDefined();
    expect(screen.queryByTestId('login-page')).toBeNull();
  });

  it('authenticated attendee cannot access /organizer → redirected to /events', () => {
    renderRouter('/organizer', attendeeAuth);
    expect(screen.getByTestId('events-page')).toBeDefined();
    expect(screen.queryByTestId('organizer-page')).toBeNull();
  });
});

describe('ProtectedRoute — authenticated organizer', () => {
  const organizerAuth = { token: 'tok456', role: 'organizer' };

  it('authenticated organizer can access /organizer', () => {
    renderRouter('/organizer', organizerAuth);
    expect(screen.getByTestId('organizer-page')).toBeDefined();
    expect(screen.queryByTestId('login-page')).toBeNull();
  });

  it('authenticated organizer can also access /events', () => {
    renderRouter('/events', organizerAuth);
    expect(screen.getByTestId('events-page')).toBeDefined();
    expect(screen.queryByTestId('login-page')).toBeNull();
  });
});

describe('AuthContext — login and logout', () => {
  function LoginLogoutUI() {
    const { token, role, login, logout } = useAuth();
    return (
      <div>
        <button onClick={() => login({ email: 'a@b.com' }, 'testtoken', 'attendee')}>Login</button>
        <button onClick={() => logout()}>Logout</button>
        <span data-testid="token">{token ?? 'none'}</span>
        <span data-testid="role">{role ?? 'none'}</span>
      </div>
    );
  }

  it('login stores token and role', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginLogoutUI />
        </AuthProvider>
      </MemoryRouter>
    );
    act(() => { screen.getByText('Login').click(); });
    await waitFor(() => expect(screen.getByTestId('token').textContent).toBe('testtoken'));
    expect(screen.getByTestId('role').textContent).toBe('attendee');
  });

  it('logout clears token and role', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginLogoutUI />
        </AuthProvider>
      </MemoryRouter>
    );
    act(() => { screen.getByText('Login').click(); });
    await waitFor(() => expect(screen.getByTestId('token').textContent).toBe('testtoken'));
    act(() => { screen.getByText('Logout').click(); });
    await waitFor(() => expect(screen.getByTestId('token').textContent).toBe('none'));
    expect(screen.getByTestId('role').textContent).toBe('none');
  });
});
