import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Login from './pages/Login'
import MapView from './pages/MapView'

function App() {
  return (
    <BrowserRouter>
      <div className="topbar">
        <Link to="/">CampusCache</Link>
        <Link to="/map">Map</Link>
        <Link to="/login">Login</Link>
      </div>
      <Routes>
        <Route path="/" element={<div className="container"><h2>Welcome to CampusCache</h2><p>Hide and discover digital caches around campus.</p></div>} />
        <Route path="/map" element={<MapView />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
