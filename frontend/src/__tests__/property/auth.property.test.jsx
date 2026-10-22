// Feature: eventhub-ticket-booking, Property 2: AuthContext reflects login state
// Feature: eventhub-ticket-booking, Property 4: Logout clears AuthContext state
// Feature: eventhub-ticket-booking, Property 5: Unauthenticated access to protected routes redirects to login

import { describe, it, expect } from 'vitest';
import { render, screen, act, cleanup, within } from '@testing-library/react';
import * as fc from 'fast-check';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';

// ---- Arbitraries ----
const tokenArb = fc.string({ minLength: 8, maxLength: 64 });
const roleArb = fc.constantFrom('attendee', 'organizer');
const attendeeArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 40 }),
  email: fc.emailAddress(),
});

// Helper: component that calls login and exposes auth state via data-testid
function LoginTrigger({ attendee, token, role }) {
  const { login, attendee: a, token: t, role: r } = useAuth();
  return (
    <div>
      <button data-testid="login-btn" onClick={() => login(attendee, token, role)}>login</button>
      <span data-testid="token">{t || ''}</span>
      <span data-testid="role">{r || ''}</span>
      <span data-testid="name">{a?.name || ''}</span>
    </div>
  );
}

// Helper: component that calls logout
function LogoutTrigger() {
  const { logout, token, role, attendee } = useAuth();
  return (
    <div>
      <button data-testid="logout-btn" onClick={() => logout()}>logout</button>
      <span data-testid="token-after">{token || 'null'}</span>
      <span data-testid="role-after">{role || 'null'}</span>
      <span data-testid="attendee-after">{attendee ? 'present' : 'null'}</span>
    </div>
  );
}

// ---- Property 2: AuthContext reflects login state ----
describe('Property 2: AuthContext reflects login state', () => {
  it('stores attendee, token, and role after login()', () => {
    fc.assert(
      fc.property(attendeeArb, tokenArb, roleArb, (attendee, token, role) => {
        const { container, unmount } = render(
          <AuthProvider>
            <LoginTrigger attendee={attendee} token={token} role={role} />
          </AuthProvider>
        );

        act(() => {
          within(container).getByTestId('login-btn').click();
        });

        expect(within(container).getByTestId('token').textContent).toBe(token);
        expect(within(container).getByTestId('role').textContent).toBe(role);
        expect(within(container).getByTestId('name').textContent).toBe(attendee.name);
        unmount();
      }),
      { numRuns: 100 }
    );
  });
});

// ---- Property 4: Logout clears AuthContext state ----
describe('Property 4: Logout clears AuthContext state', () => {
  it('clears attendee, token, and role after logout()', () => {
    fc.assert(
      fc.property(attendeeArb, tokenArb, roleArb, (attendee, token, role) => {
        const { container, unmount } = render(
          <AuthProvider>
            <LoginTrigger attendee={attendee} token={token} role={role} />
            <LogoutTrigger />
          </AuthProvider>
        );

        // login first
        act(() => { within(container).getByTestId('login-btn').click(); });
        // then logout
        act(() => { within(container).getByTestId('logout-btn').click(); });

        expect(within(container).getByTestId('token-after').textContent).toBe('null');
        expect(within(container).getByTestId('role-after').textContent).toBe('null');
        expect(within(container).getByTestId('attendee-after').textContent).toBe('null');
        unmount();
      }),
      { numRuns: 100 }
    );
  });
});

// ---- Property 5: Unauthenticated access redirects to login ----
describe('Property 5: Unauthenticated access to protected routes redirects to login', () => {
  it('ProtectedRoute redirects to "/" when token is null', () => {
    const protectedPaths = ['/events', '/my-tickets', '/organizer'];
    fc.assert(
      fc.property(fc.constantFrom(...protectedPaths), (path) => {
        const { container, unmount } = render(
          <MemoryRouter initialEntries={[path]}>
            <AuthProvider initialState={undefined}>
              <Routes>
                <Route path="/" element={<div data-testid="login-page">Login</div>} />
                <Route
                  path="/events"
                  element={
                    <ProtectedRoute>
                      <div data-testid="events-page">Events</div>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-tickets"
                  element={
                    <ProtectedRoute>
                      <div data-testid="tickets-page">Tickets</div>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/organizer"
                  element={
                    <ProtectedRoute requiredRole="organizer">
                      <div data-testid="organizer-page">Organizer</div>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </AuthProvider>
          </MemoryRouter>
        );

        // Should show login page, not the protected page
        expect(within(container).getByTestId('login-page')).toBeDefined();
        expect(within(container).queryByTestId('events-page')).toBeNull();
        expect(within(container).queryByTestId('tickets-page')).toBeNull();
        expect(within(container).queryByTestId('organizer-page')).toBeNull();
        unmount();
      }),
      { numRuns: 100 }
    );
  });
});
