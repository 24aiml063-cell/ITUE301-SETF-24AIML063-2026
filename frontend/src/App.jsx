import LoginPage from './pages/LoginPage';
import EventsPage from './pages/EventsPage';
import MyTicketsPage from './pages/MyTicketsPage';
import './index.css';

/**
 * App - Root component
 * Routing and AuthContext will be fully configured in Task 2.
 * For Task 1, we render EventsPage as the main view to verify components work.
 */
function App() {
  return (
    <div className="app">
      {/* Task 2 will add React Router + AuthContext + ProtectedRoute */}
      <EventsPage />
    </div>
  );
}

export default App;
