import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getCaches, createCache, leaderboard } from '../api'

type Cache = {
  id: number
  title: string
  description: string
  latitude: number
  longitude: number
  difficulty: number
  category: string
  creator_id: number
  created_at: string
}

export default function MapView() {
  const [caches, setCaches] = useState<Cache[]>([])
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [difficulty, setDifficulty] = useState(1)
  const [category, setCategory] = useState('general')
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(null)
  const [board, setBoard] = useState<{username:string, finds:number}[]>([])

  useEffect(() => {
    getCaches().then(setCaches).catch(console.error)
    leaderboard().then(setBoard).catch(console.error)
  }, [])

  function ClickHandler() {
    useMapEvents({
      click(e) {
        setSelectedPos([e.latlng.lat, e.latlng.lng])
      }
    })
    return null
  }

  async function addCache(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPos) return alert('Click on the map to choose a location.')
    try {
      const created = await createCache({
        title, description: desc,
        latitude: selectedPos[0], longitude: selectedPos[1],
        difficulty, category
      })
      setCaches([created, ...caches])
      setTitle(''); setDesc(''); setDifficulty(1); setCategory('general'); setSelectedPos(null)
      alert('Cache created!')
    } catch (err: any) {
      alert(err.message || 'Failed to create cache (are you logged in?)')
    }
  }

  return (
    <div className="container">
      <h2>Map</h2>
      <p>Click on the map to select coordinates, then fill the form to create a cache. You must be logged in.</p>
      <div className="card">
        <form onSubmit={addCache}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
            <div>
              <label>Title</label><br/>
              <input value={title} onChange={e=>setTitle(e.target.value)} required/>
            </div>
            <div>
              <label>Difficulty (1-5)</label><br/>
              <input type="number" min={1} max={5} value={difficulty} onChange={e=>setDifficulty(parseInt(e.target.value))}/>
            </div>
            <div style={{gridColumn:'1 / span 2'}}>
              <label>Description</label><br/>
              <input value={desc} onChange={e=>setDesc(e.target.value)} />
            </div>
            <div>
              <label>Category</label><br/>
              <select value={category} onChange={e=>setCategory(e.target.value)}>
                <option value="general">general</option>
                <option value="puzzle">puzzle</option>
                <option value="history">history</option>
              </select>
            </div>
            <div>
              <label>Selected coords</label><br/>
              <input value={selectedPos ? selectedPos.join(', ') : ''} readOnly placeholder="click the map"/>
            </div>
          </div>
          <div style={{marginTop:8}}>
            <button type="submit">Create cache</button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3>Leaderboard</h3>
        <ol>
          {board.map((b,i)=>(<li key={i}>{b.username}: {b.finds}</li>))}
        </ol>
      </div>

      <MapContainer className="map" center={[40.1106, -88.2073]} zoom={14} scrollWheelZoom={true}>
        <ClickHandler />
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {caches.map(c => (
          <Marker key={c.id} position={[c.latitude, c.longitude]}>
            <Popup>
              <b>{c.title}</b><br/>
              Difficulty: {c.difficulty} | Category: {c.category}<br/>
              {c.description}
            </Popup>
          </Marker>
        ))}
        {selectedPos && (
          <Marker position={selectedPos}>
            <Popup>New cache location</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}
