import { useState, useEffect, useRef } from 'react';
import EventCard from '../components/EventCard';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * EventsPage — fetches events from the backend, supports client-side search,
 * and wires the booking form to POST /api/v1/tickets.
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 3.4, 3.5
 */
function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { token } = useAuth();
  const abortRef = useRef(null);

  function fetchEvents() {
    setLoading(true);
    setError('');
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    fetch(`${API_BASE}/api/v1/events`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((data) => { setEvents(Array.isArray(data) ? data : []); setLoading(false); })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Failed to load events. Please try again.');
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchEvents();
    return () => { if (abortRef.current) abortRef.current.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredEvents = events.filter((e) =>
    (e.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedEvent = events.find((e) => (e.id || e._id) === selectedEventId);

  function handleBook(eventId) {
    setSelectedEventId(eventId);
    setQuantity(1);
    setBookingMessage('');
    setBookingError('');
    setShowForm(true);
  }

  function validateBooking() {
    if (!selectedEventId) return 'Please select an event.';
    const qty = parseInt(quantity, 10);
    if (!Number.isInteger(qty) || qty < 1) return 'Quantity must be a positive integer.';
    if (selectedEvent && qty > selectedEvent.ticketsAvailable)
      return `Only ${selectedEvent.ticketsAvailable} ticket(s) available.`;
    return null;
  }

  async function handleBookingSubmit(e) {
    e.preventDefault();
    setBookingError('');
    setBookingMessage('');
    const validationError = validateBooking();
    if (validationError) { setBookingError(validationError); return; }
    setBookingLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ eventId: selectedEventId, quantity: parseInt(quantity, 10) }),
      });
      const data = await res.json();
      if (!res.ok) { setBookingError(data.error || 'Booking failed. Please try again.'); return; }
      setEvents((prev) => prev.map((ev) => {
        const evId = ev.id || ev._id;
        return evId === selectedEventId
          ? { ...ev, ticketsAvailable: ev.ticketsAvailable - parseInt(quantity, 10) }
          : ev;
      }));
      setBookingMessage(`Booking confirmed for "${selectedEvent?.title}" x${quantity}!`);
      setShowForm(false);
    } catch { setBookingError('Network error. Please check your connection.'); }
    finally { setBookingLoading(false); }
  }

  return (
    <div className="events-page">
      <div className="page-header">
        <h1>Upcoming Events</h1>
        <p>Discover and book tickets for exciting events near you</p>
      </div>
      {bookingMessage && <div className="info-message" role="status">{bookingMessage}</div>}
      <div className="search-bar">
        <input id="event-search" type="search" value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search events by title…" aria-label="Search events by title" />
      </div>
      {loading && (
        <div className="loading-indicator" role="status" aria-label="Loading events">
          <div className="spinner" /><p>Loading events…</p>
        </div>
      )}
      {!loading && error && (
        <div className="error-state" role="alert">
          <p>{error}</p>
          <button className="btn btn-secondary" onClick={fetchEvents}>Retry</button>
        </div>
      )}
      {showForm && selectedEvent && (
        <div className="booking-overlay" role="dialog" aria-modal="true" aria-label="Book tickets">
          <div className="booking-modal">
            <div className="booking-modal__header">
              <h2>Book Tickets</h2>
              <button type="button" className="btn-close" onClick={() => setShowForm(false)} aria-label="Close booking form">✕</button>
            </div>
            <p className="booking-modal__event-name">{selectedEvent.title}</p>
            <form onSubmit={handleBookingSubmit}>
              <div className="form-group">
                <label htmlFor="booking-event">Event</label>
                <input id="booking-event" type="text" value={selectedEvent.title} readOnly disabled />
              </div>
              <div className="form-group">
                <label htmlFor="booking-quantity">Quantity (max {selectedEvent.ticketsAvailable})</label>
                <input id="booking-quantity" type="number" min="1" max={selectedEvent.ticketsAvailable}
                  value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)} />
              </div>
              {bookingError && <div className="error-message" role="alert">{bookingError}</div>}
              <div className="booking-modal__actions">
                <button type="submit" className="btn btn-primary" disabled={bookingLoading}>
                  {bookingLoading ? 'Booking…' : 'Confirm Booking'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {!loading && !error && (
        <>
          {filteredEvents.length === 0 && searchQuery ? (
            <div className="empty-search"><p>No events found matching &ldquo;{searchQuery}&rdquo;</p></div>
          ) : filteredEvents.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">🎪</div><h2>No events available</h2></div>
          ) : (
            <div className="events-grid">
              {filteredEvents.map((event) => {
                const id = event.id || event._id;
                return (
                  <EventCard key={id} title={event.title} category={event.category}
                    date={event.date} venue={event.venue} ticketsAvailable={event.ticketsAvailable}
                    onBook={() => handleBook(id)} />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default EventsPage;
