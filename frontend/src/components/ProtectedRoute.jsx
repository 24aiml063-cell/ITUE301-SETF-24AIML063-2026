import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PropTypes from 'prop-types';

/**
 * ProtectedRoute — guards routes by auth state and optional role
 * Requirements: 1.7, 3.3
 *
 * - No token → redirect to "/" (LoginPage)
 * - Wrong role (organizer-only route, user is attendee) → redirect to "/events"
 * - Correct auth → render children
 */
function ProtectedRoute({ children, requiredRole }) {
  const { token, role } = useAuth();

  // Unauthenticated — redirect to login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Authenticated but wrong role (organizer-only route)
  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/events" replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRole: PropTypes.string,
};

ProtectedRoute.defaultProps = {
  requiredRole: null,
};

export default ProtectedRoute;
