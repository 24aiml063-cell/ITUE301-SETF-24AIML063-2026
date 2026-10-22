import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Navbar — site-wide navigation with auth-aware links
 * Uses React Router NavLink (no full-page reloads)
 */
function Navbar() {
  const { token, role, attendee, logout } = useAuth();

  return (
    <nav className="navbar" aria-label="Main navigation">
      <div className="navbar__inner">
        <NavLink to={token ? '/events' : '/'} className="navbar__brand">
          EventHub
        </NavLink>

        {token && (
          <ul className="navbar__links" role="list">
            <li>
              <NavLink
                to="/events"
                className={({ isActive }) => isActive ? 'active' : undefined}
              >
                Events
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/my-tickets"
                className={({ isActive }) => isActive ? 'active' : undefined}
              >
                My Tickets
              </NavLink>
            </li>
            {role === 'organizer' && (
              <li>
                <NavLink
                  to="/organizer"
                  className={({ isActive }) => isActive ? 'active' : undefined}
                >
                  Organizer
                </NavLink>
              </li>
            )}
          </ul>
        )}

        <div className="navbar__actions">
          {token ? (
            <>
              <span className="navbar__user">
                {attendee?.name || attendee?.email || 'User'}
              </span>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={logout}
              >
                Logout
              </button>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
