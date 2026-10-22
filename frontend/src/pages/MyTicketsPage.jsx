/**
 * MyTicketsPage - Lists the authenticated attendee's booked tickets
 * Requirements: 2.3
 */
function MyTicketsPage() {
  // Ticket list will be fetched from API in Task 4
  const tickets = [];

  return (
    <div className="my-tickets-page">
      <div className="page-header">
        <h1>My Tickets</h1>
        <p>View all your booked event tickets</p>
      </div>

      {tickets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎟️</div>
          <h2>No tickets yet</h2>
          <p>You haven&apos;t booked any tickets. Head to the Events page to find something exciting!</p>
          <a href="/events" className="btn btn-primary">Browse Events</a>
        </div>
      ) : (
        <div className="tickets-list">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="ticket-card">
              <p>{ticket.event}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyTicketsPage;
