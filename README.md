# EventHub Ticket Booking System

## Overview
Full-stack event ticket booking application built for ITUE301 Set F examination.

**Tech Stack:** React (Vite) · React Router v6 · Node.js · Express.js · MongoDB · Mongoose · JWT Auth

---

## Folder Structure

```
repo/
├── frontend/           # React (Vite) SPA
│   ├── src/
│   │   ├── components/ # Reusable components (EventCard, OrganizerPanel, ProtectedRoute, Navbar)
│   │   ├── context/    # AuthContext provider + useAuth hook
│   │   ├── pages/      # LoginPage, EventsPage, MyTicketsPage
│   │   └── __tests__/  # Unit + property-based tests
│   └── package.json
└── backend/            # Express REST API
    ├── middleware/     # requestLogger, authGuard, errorHandler
    ├── models/         # Attendee, Event, Ticket Mongoose schemas
    ├── routes/         # auth, events, tickets route handlers
    ├── server.js       # Express entry point
    ├── .env            # (gitignored) real secrets
    └── .env.example    # placeholder values only
```

---

## Running the Project

### Frontend
```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
npm run build     # production build
npm test          # run all tests
```

### Backend
```bash
cd backend
npm install
npm run dev       # http://localhost:5000 (nodemon)
npm start         # production
npm test          # run all tests
```

---

## MongoDB Setup

1. Install and start MongoDB locally, or use a MongoDB Atlas cluster.
2. Set `MONGO_URI` in `backend/.env`:
   ```
   MONGO_URI=mongodb://localhost:27017/eventhub
   ```

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in real values:

| Variable     | Description                         |
|-------------|-------------------------------------|
| `PORT`       | Express server port (default: 5000) |
| `MONGO_URI`  | MongoDB connection string           |
| `JWT_SECRET` | Secret key for signing JWT tokens   |

---

## API Endpoints

| Method | Path                          | Auth     | Description                        |
|--------|-------------------------------|----------|------------------------------------|
| POST   | /api/v1/auth/login            | Public   | Authenticate user, return JWT      |
| GET    | /api/v1/events                | Public   | List all events                    |
| GET    | /api/v1/events/:id            | Public   | Get single event by ID             |
| POST   | /api/v1/tickets               | Bearer   | Book tickets for an event          |
| GET    | /api/v1/tickets/my            | Bearer   | Get authenticated user's tickets   |
| PATCH  | /api/v1/tickets/:id/status    | Bearer   | Update ticket status               |

---

## Test Instructions

### Frontend (Vitest + React Testing Library + fast-check)
```bash
cd frontend
npm test          # run in watch mode
npm test -- --run # single pass (CI)
```

### Backend (Jest + Supertest)
```bash
cd backend
npm test
```

---

## Commit History

Each task maps to exactly one commit:

1. `feat(frontend): implement EventHub component architecture`
2. `feat(frontend): add routing and authentication state`
3. `feat(backend): implement event ticket REST API`
4. `feat(frontend): integrate events API with loading and search`
5. `feat(database): add Mongoose models and validation`
