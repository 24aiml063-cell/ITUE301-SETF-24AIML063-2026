import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import EventsPage from './pages/EventsPage';
import MyTicketsPage from './pages/MyTicketsPage';
import './index.css';

/**
 * OrganizerPanel loaded lazily via React.lazy (code-splitting)
 * Requirements: 2.6, 2.7, 3.6
 */
const OrganizerPanel = lazy(() => import('./components/OrganizerPanel'));

/**
 * App — root component
 * Defines all four client-side routes with React Router v6.
 * Requirements: 3.1, 3.2, 3.3
 *
 * Routes:
 *   /            → LoginPage (public)
 *   /events      → EventsPage (protected, any authenticated user)
 *   /my-tickets  → MyTicketsPage (protected, any authenticated user)
 *   /organizer   → OrganizerPanel (protected, organizer role only, lazy-loaded)
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <Navbar />
          <main>
            <Routes>
              {/* Public route */}
              <Route path="/" element={<LoginPage />} />

              {/* Protected — any authenticated attendee */}
              <Route
                path="/events"
                element={
                  <ProtectedRoute>
                    <EventsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-tickets"
                element={
                  <ProtectedRoute>
                    <MyTicketsPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected — organizer role only, lazy-loaded */}
              <Route
                path="/organizer"
                element={
                  <ProtectedRoute requiredRole="organizer">
                    <Suspense fallback={<div className="loading-indicator"><div className="spinner" /><p>Loading Organizer Panel…</p></div>}>
                      <OrganizerPanel />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
