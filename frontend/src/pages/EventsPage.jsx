import EventCard from '../components/EventCard';

// Temporary hardcoded sample data — replaced with API fetch in Task 4
const SAMPLE_EVENTS = [
  {
    id: '1',
    title: 'Tech Summit 2026',
    category: 'Technology',
    date: '2026-11-15',
    venue: 'Convention Centre, Bengaluru',
    ticketsAvailable: 120,
  },
  {
    id: '2',
    title: 'Jazz Under the Stars',
    category: 'Music',
    date: '2026-11-22',
    venue: 'Amphitheatre, Mumbai',
    ticketsAvailable: 0,
  },
  {
    id: '3',
    title: 'Startup Pitch Night',
    category: 'Business',
    date: '2026-12-05',
    venue: 'Innovation Hub, Hyderabad',
    ticketsAvailable: 45,
  },
  {
    id: '4',
    title: 'Art & Culture Fest',
    category: 'Arts',
    date: '2026-12-18',
    venue: 'Gallery Space, Delhi',
    ticketsAvailable: 200,
  },
];

/**
 * EventsPage - Lists all available events
 * Requirements: 2.2
 */
function EventsPage() {
  return (
    <div className="events-page">
      <div className="page-header">
        <h1>Upcoming Events</h1>
        <p>Discover and book tickets for exciting events near you</p>
      </div>

      <div className="events-grid">
        {SAMPLE_EVENTS.map((event) => (
          <EventCard
            key={event.id}
            title={event.title}
            category={event.category}
            date={event.date}
            venue={event.venue}
            ticketsAvailable={event.ticketsAvailable}
          />
        ))}
      </div>
    </div>
  );
}

export default EventsPage;
