import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Login from './pages/Login'
import MapView from './pages/MapView'
import DarkModeToggle from './components/DarkModeToggle'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <div className="topbar">
        <div className="topbar-left">
          <Link to="/">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#FF5F05" style={{verticalAlign: 'middle', marginRight: '8px'}}>
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l8 4v8.64l-8 4-8-4V8.18l8-4z"/>
            </svg>
            CampusCache
          </Link>
          <Link to="/map">Map</Link>
          <Link to="/login">Login</Link>
        </div>
        <DarkModeToggle />
      </div>
      <Routes>
        <Route path="/" element={
          <div className="container">
            <h2>Welcome to CampusCache</h2>
            <p>Hide and discover digital caches around the UIUC campus. Join the Illini community in exploring campus landmarks and hidden treasures!</p>
            <div className="card">
              <h3>Get Started</h3>
              <p>Create an account to start creating and finding caches around campus. Use the map to explore existing caches and add your own!</p>
            </div>
          </div>
        } />
        <Route path="/map" element={<MapView />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
