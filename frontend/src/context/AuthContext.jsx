import { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * AuthContext — holds { attendee, token, role }
 * Requirements: 1.3, 1.6, 3.2
 */
export const AuthContext = createContext(null);

/**
 * AuthProvider — wraps the component tree to provide auth state
 * Exposes login(attendee, token, role) and logout() actions.
 * Passwords are NEVER stored in state or storage.
 *
 * @param {object} [initialState] - Optional initial auth state (used in tests)
 */
export function AuthProvider({ children, initialState }) {
  const [auth, setAuth] = useState({
    attendee: initialState?.attendee ?? null,
    token: initialState?.token ?? null,
    role: initialState?.role ?? null,
  });

  /**
   * login — stores attendee identity, bearer token, and role
   * @param {object} attendee  - user identity object (name, email, etc.)
   * @param {string} token     - JWT bearer token
   * @param {string} role      - "attendee" | "organizer"
   */
  function login(attendee, token, role) {
    setAuth({ attendee, token, role });
  }

  /**
   * logout — clears all three auth fields from state
   */
  function logout() {
    setAuth({ attendee: null, token: null, role: null });
  }

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
  initialState: PropTypes.shape({
    attendee: PropTypes.object,
    token: PropTypes.string,
    role: PropTypes.string,
  }),
};

/**
 * useAuth — custom hook for accessing AuthContext
 * @returns {{ attendee, token, role, login, logout }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
