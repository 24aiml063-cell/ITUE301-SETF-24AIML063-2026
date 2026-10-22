import PropTypes from 'prop-types';

/**
 * EventCard - Displays a single event summary
 * Requirements: 2.4, 2.5
 *
 * Props:
 *   title             {string} - Event title
 *   category          {string} - Event category
 *   date              {string} - Event date
 *   venue             {string} - Event venue
 *   ticketsAvailable  {number} - Number of tickets remaining
 */
function EventCard({ title, category, date, venue, ticketsAvailable }) {
  // Treat undefined/null/NaN as 0 (sold out)
  const available = typeof ticketsAvailable === 'number' && !isNaN(ticketsAvailable) ? ticketsAvailable : 0;
  const isSoldOut = available === 0;

  const formattedDate = (() => {
    if (!date) return 'Date TBD';
    try {
      return new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return date;
    }
  })();

  return (
    <article className={`event-card${isSoldOut ? ' event-card--sold-out' : ''}`}>
      <div className="event-card__header">
        {category && (
          <span className="event-card__category">{category}</span>
        )}
        {isSoldOut && (
          <span className="event-card__badge event-card__badge--sold-out">Sold Out</span>
        )}
      </div>

      <h2 className="event-card__title">{title || 'Untitled Event'}</h2>

      <div className="event-card__details">
        <div className="event-card__detail">
          <span className="event-card__detail-icon">📅</span>
          <span>{formattedDate}</span>
        </div>
        <div className="event-card__detail">
          <span className="event-card__detail-icon">📍</span>
          <span>{venue || 'Venue TBD'}</span>
        </div>
        <div className="event-card__detail">
          <span className="event-card__detail-icon">🎟️</span>
          <span>
            {isSoldOut
              ? 'No tickets available'
              : `${available} ticket${available !== 1 ? 's' : ''} available`}
          </span>
        </div>
      </div>

      <div className="event-card__footer">
        {!isSoldOut && (
          <button
            type="button"
            className="btn btn-primary"
            aria-label={`Book tickets for ${title || 'this event'}`}
          >
            Book
          </button>
        )}
      </div>
    </article>
  );
}

EventCard.propTypes = {
  title: PropTypes.string,
  category: PropTypes.string,
  date: PropTypes.string,
  venue: PropTypes.string,
  ticketsAvailable: PropTypes.number,
};

// Default prop values handled inline in component logic above

export default EventCard;
