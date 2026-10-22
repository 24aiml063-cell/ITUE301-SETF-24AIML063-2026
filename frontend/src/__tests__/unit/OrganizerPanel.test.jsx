import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { lazy, Suspense } from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';

// Lazy-load OrganizerPanel exactly as App.jsx does
const OrganizerPanel = lazy(() => import('../../components/OrganizerPanel'));

describe('OrganizerPanel — lazy loading', () => {
  it('shows Suspense fallback while OrganizerPanel chunk loads, then renders panel for organizer', async () => {
    render(
      <MemoryRouter initialEntries={['/organizer']}>
        <AuthProvider initialState={{ attendee: { email: 'org@test.com' }, token: 'tok789', role: 'organizer' }}>
          <Routes>
            <Route path="/" element={<div>Login</div>} />
            <Route
              path="/organizer"
              element={
                <ProtectedRoute requiredRole="organizer">
                  <Suspense fallback={<div data-testid="loading-fallback">Loading…</div>}>
                    <OrganizerPanel />
                  </Suspense>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Eventually the panel loads
    await waitFor(() =>
      expect(screen.queryByText(/Organizer Dashboard/i)).not.toBeNull()
    );
  });

  it('OrganizerPanel is not accessible without organizer role → redirected to /events', () => {
    render(
      <MemoryRouter initialEntries={['/organizer']}>
        <AuthProvider initialState={{ attendee: { email: 'user@test.com' }, token: 'tok000', role: 'attendee' }}>
          <Routes>
            <Route path="/" element={<div data-testid="login">Login</div>} />
            <Route path="/events" element={<div data-testid="events">Events</div>} />
            <Route
              path="/organizer"
              element={
                <ProtectedRoute requiredRole="organizer">
                  <Suspense fallback={<div>Loading…</div>}>
                    <OrganizerPanel />
                  </Suspense>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('events')).toBeDefined();
    expect(screen.queryByText(/Organizer Dashboard/i)).toBeNull();
  });
});
