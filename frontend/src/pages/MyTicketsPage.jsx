import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * MyTicketsPage — fetches the authenticated attendee's tickets.
 * GET /api/v1/tickets/my  with Authorization: Bearer <token>
 * Requirements: 5.6
 */
function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();
  const abortRef = useRef(null);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError('');
    fetch(`${API_BASE}/api/v1/tickets/my`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((data) => { setTickets(Array.isArray(data) ? data : []); setLoading(false); })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Failed to load tickets.');
        setLoading(false);
      });
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [token]);

  function formatDate(d) {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }); }
    catch { return d; }
  }

  return (
    <div className="my-tickets-page">
      <div className="page-header">
        <h1>My Tickets</h1>
        <p>View all your booked event tickets</p>
      </div>
      {loading && (
        <div className="loading-indicator" role="status" aria-label="Loading tickets">
          <div className="spinner" /><p>Loading your tickets…</p>
        </div>
      )}
      {!loading && error && <div className="error-state" role="alert"><p>{error}</p></div>}
      {!loading && !error && tickets.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🎟️</div>
          <h2>No tickets yet</h2>
          <p>You haven&apos;t booked any tickets. Head to the Events page to find something exciting!</p>
          <Link to="/events" className="btn btn-primary">Browse Events</Link>
        </div>
      )}
      {!loading && !error && tickets.length > 0 && (
        <div className="tickets-list">
          {tickets.map((ticket) => {
            const id = ticket.id || ticket._id;
            const eventTitle = ticket.eventId?.title || `Event ${ticket.eventId}`;
            const eventDate = ticket.eventId?.date ? formatDate(ticket.eventId.date) : '';
            const eventVenue = ticket.eventId?.venue || '';
            return (
              <div key={id} className="ticket-card">
                <div className="ticket-card__header">
                  <h3>{eventTitle}</h3>
                  <span className={`ticket-status ticket-status--${ticket.status}`}>{ticket.status}</span>
                </div>
                {eventDate && <p className="ticket-card__date">📅 {eventDate}</p>}
                {eventVenue && <p className="ticket-card__venue">📍 {eventVenue}</p>}
                <p className="ticket-card__qty">Quantity: {ticket.quantity}</p>
                <p className="ticket-card__booked">Booked: {formatDate(ticket.bookingDate)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyTicketsPage;
