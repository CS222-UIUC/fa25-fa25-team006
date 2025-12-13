import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import MapView from "./MapView";
import Login from "./Login";
import { getCurrentUser } from "./api";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        "app-nav-link" + (isActive ? " active" : "")
      }
    >
      {children}
    </NavLink>
  );
}

export default function App() {
  const [user, setUser] = useState(getCurrentUser());

  // Listen for storage changes and custom events to update user state
  useEffect(() => {
    const handleStorageChange = () => {
      setUser(getCurrentUser());
    };

    const handleUserChange = () => {
      setUser(getCurrentUser());
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("userChanged", handleUserChange);
    
    // Check periodically for same-tab changes
    const interval = setInterval(() => {
      const currentUser = getCurrentUser();
      const prevUser = user;
      if ((prevUser && !currentUser) || (!prevUser && currentUser) || 
          (prevUser && currentUser && prevUser.id !== currentUser.id)) {
        setUser(currentUser);
      }
    }, 300);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userChanged", handleUserChange);
      clearInterval(interval);
    };
  }, [user]);

  return (
    <div className="app-shell">
      <BrowserRouter>
        <header className="app-nav">
          <div className="app-nav-logo">
            <span className="app-nav-logo-pill" />
            CampusCache
          </div>
          <nav className="app-nav-links">
            <NavItem to="/">Home</NavItem>
            <NavItem to="/map">Map</NavItem>
            <NavItem to="/login">Account</NavItem>
          </nav>
          {user && (
            <div className="app-nav-user">
              Signed in as <b>{user.displayName || user.username}</b>
            </div>
          )}
        </header>

        <main className="app-main">
          <div className="app-main-inner">
            <Routes>
              <Route
                path="/"
                element={
                  <div className="card">
                    <h1 className="page-title">Welcome to CampusCache</h1>
                    <p className="page-subtitle">
                      A location-based campus scavenger experience. Discover hidden
                      caches, compete on the leaderboard, and explore campus landmarks
                      with your friends.
                    </p>
                    <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                      <NavItem to="/map">
                        <span className="btn">
                          Open map
                          <span>🗺️</span>
                        </span>
                      </NavItem>
                      <NavItem to="/login">
                        <span className="btn btn-outline">
                          Sign in / Register
                        </span>
                      </NavItem>
                    </div>
                  </div>
                }
              />
              <Route path="/map" element={<MapView />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </div>
        </main>
      </BrowserRouter>
    </div>
  );
}