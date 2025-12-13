# CampusCache 

A location-based campus scavenger hunt application where users can discover hidden caches, compete on leaderboards, and explore campus landmarks with personalized recommendations.

## Features

-  **Interactive Map**: Explore caches on an interactive map powered by Leaflet and OpenStreetMap
-  **Search & Filter**: Search caches by title, filter by category and difficulty
-  **Cache Management**: Create, edit, activate/deactivate, and delete caches
-  **Leaderboard**: Compete with other users based on number of caches found
-  **Personalized Recommendations**: AI-powered cache recommendations based on your preferences and interaction history
-  **User Authentication**: Register and login system with session management
- **Status Tracking**: Track cache status history (active/inactive) with timestamps
-  **Cache Categories**: Traditional, Puzzle, Multi, and Event caches
-  **Difficulty Levels**: 5-level difficulty system (1-5)

## Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Leaflet** - Interactive maps
- **React Leaflet** - React bindings for Leaflet

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database (Cloud SQL compatible)
- **JWT-like Sessions** - Authentication

## Project Structure

```
campuscache411/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── App.jsx        # Main app component with routing
│   │   ├── MapView.jsx    # Map view with cache management
│   │   ├── Login.jsx      # Authentication component
│   │   ├── api.js         # API client functions
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
├── backend/               # Express backend server
│   ├── server.js          # Main server file with API routes
│   ├── recommendation.js  # Recommendation algorithm
│   └── package.json
└── README.md
```


## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Explore Map**: Navigate to the Map tab to see all available caches
3. **Search & Filter**: Use the search bar and filters to find specific caches
4. **Find Caches**: Click on cache markers to view details and mark them as found
5. **Create Caches**: Switch to the "Add Cache" tab, click on the map to select a location, and fill in the cache details
6. **Manage Your Caches**: Go to "My Caches" tab to edit, activate/deactivate, or delete your caches
7. **View Recommendations**: Logged-in users will see personalized cache recommendations in the sidebar
8. **Check Leaderboard**: View the top cache finders in the leaderboard

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login and get session token

### Caches
- `GET /api/caches` - Get all caches
- `POST /api/caches` - Create a new cache (requires auth)
- `GET /api/caches/my` - Get current user's caches (requires auth)
- `PUT /api/caches/:id` - Update a cache (requires auth)
- `DELETE /api/caches/:id` - Delete a cache (requires auth)
- `POST /api/caches/:id/found` - Mark cache as found (requires auth)
- `POST /api/caches/:id/deactivate` - Deactivate a cache (requires auth)
- `POST /api/caches/:id/activate` - Activate a cache (requires auth)
- `GET /api/caches/:id/status-log` - Get cache status history (requires auth)
- `POST /api/caches/:id/view` - Track cache view (requires auth)

### Recommendations
- `GET /api/users/me/recommended-caches?limit=N` - Get personalized cache recommendations (requires auth)

### Leaderboard
- `GET /api/leaderboard` - Get top users by cache finds

### Health
- `GET /api/health` - Health check endpoint

## Recommendation System

The application includes an intelligent recommendation system that:
- Analyzes user interaction history (finds, views, etc.)
- Considers category preferences
- Factors in difficulty preferences
- Uses location clustering to suggest nearby caches
- Provides a recommendation score for each suggested cache

## Development

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend
The backend server uses Express and connects to MySQL. Sessions are stored in-memory (reset on server restart).


