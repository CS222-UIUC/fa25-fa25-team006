import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  getCaches,
  createCache,
  leaderboard,
  getCurrentUser,
  markCacheFound,
  getMyCaches,
  updateCache,
  deleteCache,
  deactivateCache,
  activateCache,
  getCacheStatusLog,
  trackCacheView,
  getRecommendedCaches,
} from "./api";

// Fix for default marker icons in Leaflet with React
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

// Found cache icon (green) - using divIcon for better visual distinction
let FoundIcon = L.divIcon({
  className: "found-cache-marker",
  html: `<div style="
    width: 30px;
    height: 30px;
    background-color: #10b981;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 16px;
  ">✓</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

// Highlighted cache icon (blue with pulsing effect)
let HighlightedIcon = L.divIcon({
  className: "highlighted-cache-marker",
  html: `<div style="
    width: 40px;
    height: 40px;
    background-color: #3b82f6;
    border: 4px solid white;
    border-radius: 50%;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.4), 0 4px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 20px;
    animation: pulse 2s infinite;
  ">⭐</div>
  <style>
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.4), 0 4px 8px rgba(0,0,0,0.3); }
      50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.2), 0 4px 8px rgba(0,0,0,0.3); }
    }
  </style>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

L.Marker.prototype.options.icon = DefaultIcon;

function ClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

// Component to get map instance and store it
function MapController({ setMapInstance }) {
  const map = useMap();
  useEffect(() => {
    setMapInstance(map);
  }, [map, setMapInstance]);
  return null;
}

export default function MapView() {
  const [caches, setCaches] = useState([]);
  const [board, setBoard] = useState([]);
  const [selectedPos, setSelectedPos] = useState(null);
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState(1);
  const [category, setCategory] = useState("Traditional");
  const [isActive, setIsActive] = useState(1);
  const [message, setMessage] = useState("");
  const [markingFound, setMarkingFound] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState([]);
  const [activeTab, setActiveTab] = useState("map"); // "map", "add", or "my"
  const [myCaches, setMyCaches] = useState([]);
  const [editingCache, setEditingCache] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDifficulty, setEditDifficulty] = useState(1);
  const [editCategory, setEditCategory] = useState("Traditional");
  const [editMessage, setEditMessage] = useState("");
  const [statusLogs, setStatusLogs] = useState({});
  const [viewingStatusLog, setViewingStatusLog] = useState(null);
  const [recommendedCaches, setRecommendedCaches] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [highlightedCacheId, setHighlightedCacheId] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const user = getCurrentUser();
  const location = useLocation();

  const categories = ["Traditional", "Puzzle", "Multi", "Event"];
  const difficulties = [1, 2, 3, 4, 5];

  // Filter caches based on search and filters
  const filteredCaches = caches.filter((c) => {
    // Search filter
    if (searchTerm && !c.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    // Category filter
    if (selectedCategories.length > 0 && !selectedCategories.includes(c.category)) {
      return false;
    }
    // Difficulty filter
    if (selectedDifficulties.length > 0 && !selectedDifficulties.includes(c.difficulty)) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    loadCaches();
    leaderboard().then(setBoard).catch(console.error);
    if (user) {
      loadRecommendations();
    }
  }, []);

  // Reload recommendations when user changes
  useEffect(() => {
    if (user) {
      loadRecommendations();
    } else {
      setRecommendedCaches([]);
    }
  }, [user?.id]);

  // Reload caches when navigating to this route
  useEffect(() => {
    if (location.pathname === "/map") {
      loadCaches();
    }
  }, [location.pathname]);

  // Reload caches when user changes or when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadCaches();
      }
    };

    const handleFocus = () => {
      loadCaches();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Reload caches when user changes
  useEffect(() => {
    loadCaches();
    if (user) {
      loadMyCaches();
    } else {
      setMyCaches([]);
    }
  }, [user?.id]);

  // Load my caches when switching to my caches tab
  useEffect(() => {
    if (activeTab === "my" && user) {
      loadMyCaches();
    }
  }, [activeTab, user]);

  async function loadCaches() {
    try {
      const data = await getCaches();
      setCaches(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadMyCaches() {
    try {
      const data = await getMyCaches();
      setMyCaches(data);
      console.log("Loaded my caches:", data);
    } catch (err) {
      console.error("Error loading my caches:", err);
      // If unauthorized, clear the user state
      if (err.message.includes("Not logged in")) {
        // User session expired, they need to log in again
        setMyCaches([]);
      }
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setMessage("");

    if (!user) {
      setMessage("You must be logged in to create a cache.");
      return;
    }
    if (!selectedPos) {
      setMessage("Click on the map to choose a location first.");
      return;
    }

    try {
      const created = await createCache({
        title,
        description: "",
        latitude: selectedPos[0],
        longitude: selectedPos[1],
        difficulty,
        category,
        is_active: isActive,
      });
      setCaches([created, ...caches]);
      // Refresh my caches list
      if (user) {
        await loadMyCaches();
      }
      setTitle("");
      setDifficulty(1);
      setCategory("Traditional");
      setIsActive(1);
      setSelectedPos(null);
      setMessage("Cache created successfully.");
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Failed to create cache.");
    }
  }

  async function handleMarkFound(cacheId) {
    if (!user) {
      alert("You must be logged in to mark caches as found.");
      return;
    }

    setMarkingFound((prev) => new Set(prev).add(cacheId));

    try {
      await markCacheFound(cacheId);
      // Reload caches to get updated found status from server
      await loadCaches();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to mark cache as found.");
    } finally {
      setMarkingFound((prev) => {
        const next = new Set(prev);
        next.delete(cacheId);
        return next;
      });
    }
  }

  function toggleCategory(cat) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function toggleDifficulty(diff) {
    setSelectedDifficulties((prev) =>
      prev.includes(diff) ? prev.filter((d) => d !== diff) : [...prev, diff]
    );
  }

  function startEdit(cache) {
    setEditingCache(cache.id);
    setEditTitle(cache.title);
    setEditDifficulty(cache.difficulty);
    setEditCategory(cache.category);
    setEditMessage("");
  }

  function cancelEdit() {
    setEditingCache(null);
    setEditTitle("");
    setEditDifficulty(1);
    setEditCategory("Traditional");
    setEditMessage("");
  }

  async function handleUpdate(cacheId) {
    setEditMessage("");
    try {
      await updateCache(cacheId, {
        title: editTitle,
        difficulty: editDifficulty,
        category: editCategory,
      });
      await loadMyCaches();
      await loadCaches(); // Refresh main cache list too
      cancelEdit();
      setEditMessage("Cache updated successfully!");
    } catch (err) {
      console.error(err);
      setEditMessage(err.message || "Failed to update cache.");
    }
  }

  async function handleDelete(cacheId) {
    if (!confirm("Are you sure you want to delete this cache? This cannot be undone.")) {
      return;
    }
    try {
      await deleteCache(cacheId);
      await loadMyCaches();
      await loadCaches(); // Refresh main cache list too
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to delete cache.");
    }
  }

  async function handleDeactivate(cacheId) {
    if (!confirm("Are you sure you want to deactivate this cache?")) {
      return;
    }
    try {
      const updated = await deactivateCache(cacheId, "Deactivated from UI");
      await loadMyCaches();
      await loadCaches(); // Refresh main cache list too
      // Clear status log cache for this cache
      delete statusLogs[cacheId];
      setStatusLogs({ ...statusLogs });
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to deactivate cache.");
    }
  }

  async function handleActivate(cacheId) {
    try {
      const updated = await activateCache(cacheId);
      await loadMyCaches();
      await loadCaches(); // Refresh main cache list too
      // Clear status log cache for this cache
      delete statusLogs[cacheId];
      setStatusLogs({ ...statusLogs });
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to activate cache.");
    }
  }

  async function loadStatusLog(cacheId) {
    if (statusLogs[cacheId]) {
      return; // Already loaded
    }
    try {
      const data = await getCacheStatusLog(cacheId);
      setStatusLogs({ ...statusLogs, [cacheId]: data });
    } catch (err) {
      console.error("Error loading status log:", err);
      setStatusLogs({ ...statusLogs, [cacheId]: [] });
    }
  }

  async function loadRecommendations() {
    if (!user) return;
    setLoadingRecommendations(true);
    try {
      const data = await getRecommendedCaches(5);
      setRecommendedCaches(data);
    } catch (err) {
      console.error("Error loading recommendations:", err);
      setRecommendedCaches([]);
    } finally {
      setLoadingRecommendations(false);
    }
  }

  function handleCacheView(cacheId) {
    if (user) {
      trackCacheView(cacheId);
    }
  }

  return (
    <div className="map-page">
      <div style={{ marginBottom: 6 }}>
        <h2 className="page-title">Campus map</h2>
        <p className="page-subtitle">
          Explore caches on the map or add new ones. Found caches are marked in green.
        </p>
        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 12,
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <button
            onClick={() => setActiveTab("map")}
            style={{
              padding: "8px 16px",
              border: "none",
              background: "none",
              cursor: "pointer",
              borderBottom:
                activeTab === "map" ? "2px solid #3b82f6" : "2px solid transparent",
              color: activeTab === "map" ? "#3b82f6" : "#6b7280",
              fontWeight: activeTab === "map" ? 600 : 400,
            }}
          >
            Map
          </button>
          <button
            onClick={() => setActiveTab("add")}
            style={{
              padding: "8px 16px",
              border: "none",
              background: "none",
              cursor: "pointer",
              borderBottom:
                activeTab === "add" ? "2px solid #3b82f6" : "2px solid transparent",
              color: activeTab === "add" ? "#3b82f6" : "#6b7280",
              fontWeight: activeTab === "add" ? 600 : 400,
            }}
          >
            Add Cache
          </button>
          {user && (
            <button
              onClick={() => setActiveTab("my")}
              style={{
                padding: "8px 16px",
                border: "none",
                background: "none",
                cursor: "pointer",
                borderBottom:
                  activeTab === "my" ? "2px solid #3b82f6" : "2px solid transparent",
                color: activeTab === "my" ? "#3b82f6" : "#6b7280",
                fontWeight: activeTab === "my" ? 600 : 400,
              }}
            >
              My Caches
            </button>
          )}
        </div>
      </div>

      {activeTab === "map" && (
        <>
          {/* Search and Filters - Above Map */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 className="card-title" style={{ marginBottom: 12 }}>Search & Filters</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Search Bar */}
              <div className="field">
                <span className="field-label">Search by Title</span>
                <input
                  className="input"
                  type="text"
                  placeholder="Search cache titles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Category Filter */}
              <div className="field">
                <span className="field-label">Categories</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      style={{
                        padding: "6px 12px",
                        border: selectedCategories.includes(cat)
                          ? "2px solid #3b82f6"
                          : "1px solid #d1d5db",
                        background: selectedCategories.includes(cat) ? "#dbeafe" : "white",
                        color: selectedCategories.includes(cat) ? "#3b82f6" : "#374151",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        fontWeight: selectedCategories.includes(cat) ? 600 : 400,
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Filter */}
              <div className="field">
                <span className="field-label">Difficulty</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {difficulties.map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => toggleDifficulty(diff)}
                      style={{
                        padding: "6px 12px",
                        border: selectedDifficulties.includes(diff)
                          ? "2px solid #3b82f6"
                          : "1px solid #d1d5db",
                        background: selectedDifficulties.includes(diff) ? "#dbeafe" : "white",
                        color: selectedDifficulties.includes(diff) ? "#3b82f6" : "#374151",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        fontWeight: selectedDifficulties.includes(diff) ? 600 : 400,
                      }}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters Button */}
              {(searchTerm || selectedCategories.length > 0 || selectedDifficulties.length > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategories([]);
                    setSelectedDifficulties([]);
                  }}
                  style={{
                    padding: "8px 16px",
                    background: "#f3f4f6",
                    color: "#374151",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    alignSelf: "flex-start",
                  }}
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>

          {/* Map and Leaderboard Side by Side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
            <div className="map-container-wrapper">
        <MapContainer center={[40.11, -88.21]} zoom={15} style={{ height: "65vh" }}>
          <MapController setMapInstance={setMapInstance} />
          <ClickHandler onClick={setSelectedPos} />
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filteredCaches.map((c) => {
            const isFound = c.is_found === true;
            const isHighlighted = highlightedCacheId === c.id;
            return (
              <Marker
                key={c.id}
                position={[c.latitude, c.longitude]}
                icon={isHighlighted ? HighlightedIcon : (isFound ? FoundIcon : DefaultIcon)}
              >
                <Popup onOpen={() => handleCacheView(c.id)}>
                  <strong>{c.title}</strong>
                  <br />
                  Difficulty: {c.difficulty} <br />
                  Category: {c.category}
                  {c.is_active !== undefined && (
                    <>
                      <br />
                      Status: <span style={{ color: c.is_active === 1 ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                        {c.is_active === 1 ? "Active" : "Inactive"}
                      </span>
                    </>
                  )}
                  {c.updated_at && (
                    <>
                      <br />
                      Updated: {new Date(c.updated_at).toLocaleDateString()}
                    </>
                  )}
                  {user && !c.is_found && (
                    <>
                      <br />
                      <br />
                      <button
                        onClick={() => handleMarkFound(c.id)}
                        disabled={markingFound.has(c.id)}
                        style={{
                          padding: "6px 12px",
                          background: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: markingFound.has(c.id) ? "not-allowed" : "pointer",
                          fontSize: "0.875rem",
                          marginRight: "4px",
                        }}
                      >
                        {markingFound.has(c.id) ? "Marking..." : "Mark as Found"}
                      </button>
                    </>
                  )}
                  {user && c.creator_id === user.id && c.is_active === 1 && (
                    <button
                      onClick={() => {
                        handleDeactivate(c.id);
                      }}
                      style={{
                        padding: "6px 12px",
                        background: "#f59e0b",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                      }}
                    >
                      Deactivate
                    </button>
                  )}
                  {isFound && (
                    <>
                      <br />
                      <span style={{ color: "#10b981", fontWeight: 600 }}>
                        ✓ Found
                      </span>
                    </>
                  )}
                </Popup>
              </Marker>
            );
          })}
          {selectedPos && (
            <Marker position={selectedPos}>
              <Popup>New cache here</Popup>
            </Marker>
          )}
        </MapContainer>
            </div>

            {/* Leaderboard Sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Recommended Caches */}
              {user && (
                <div className="card" style={{ height: "fit-content", position: "sticky", top: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <h3 className="card-title" style={{ margin: 0 }}>Recommended For You</h3>
                    <button
                      onClick={loadRecommendations}
                      disabled={loadingRecommendations}
                      style={{
                        padding: "4px 8px",
                        fontSize: "0.75rem",
                        background: "#f3f4f6",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px",
                        cursor: loadingRecommendations ? "not-allowed" : "pointer",
                      }}
                    >
                      {loadingRecommendations ? "..." : "↻"}
                    </button>
                  </div>
                  <p className="card-subtitle" style={{ fontSize: "0.8rem", marginBottom: 12 }}>
                    Personalized recommendations based on your cache preferences
                  </p>
                  {recommendedCaches.length === 0 ? (
                    <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>
                      {loadingRecommendations
                        ? "Loading..."
                        : "Start finding caches to get personalized recommendations!"}
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {recommendedCaches.map((cache) => (
                        <div
                          key={cache.id}
                          style={{
                            padding: "10px 12px",
                            background: highlightedCacheId === cache.id ? "#dbeafe" : "#ffffff",
                            borderRadius: "8px",
                            border: highlightedCacheId === cache.id 
                              ? "2px solid #3b82f6" 
                              : "1px solid #e5e7eb",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            boxShadow: highlightedCacheId === cache.id 
                              ? "0 2px 8px rgba(59, 130, 246, 0.2)" 
                              : "0 1px 2px rgba(0,0,0,0.05)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#f3f4f6";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = highlightedCacheId === cache.id ? "#dbeafe" : "#ffffff";
                          }}
                          onClick={() => {
                            // Highlight this cache
                            setHighlightedCacheId(cache.id);
                            
                            // Center and zoom map to this cache
                            if (mapInstance) {
                              mapInstance.setView([cache.latitude, cache.longitude], 17, {
                                animate: true,
                                duration: 0.5,
                              });
                            }
                            
                            // Clear highlight after 5 seconds
                            setTimeout(() => {
                              setHighlightedCacheId(null);
                            }, 5000);
                          }}
                        >
                          <div style={{ 
                            fontWeight: 600, 
                            fontSize: "0.875rem", 
                            marginBottom: 4,
                            color: "#111827",
                          }}>
                            {cache.title}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                            {cache.category} • Difficulty: {cache.difficulty}
                            {cache.recommendation_score && (
                              <span style={{ 
                                float: "right", 
                                color: "#3b82f6",
                                fontWeight: 600,
                              }}>
                                {Math.round(cache.recommendation_score * 100)}% match
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="card card-muted" style={{ height: "fit-content", position: "sticky", top: 16 }}>
                <h3 className="card-title">Leaderboard</h3>
                <p className="card-subtitle">
                  Top explorers ranked by number of caches found.
                </p>
                <ol className="leaderboard-list">
                  {board.map((b, i) => (
                    <li key={i}>
                      <span>
                        #{i + 1} {b.username}
                      </span>
                      <span>{b.finds} finds</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "add" && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h3 className="card-title">New cache</h3>
            <span className="small-badge">
              {user ? "Ready to hide" : "Sign in required"}
            </span>
          </div>
          <p className="card-subtitle">
            {selectedPos
              ? `Selected position: ${selectedPos[0].toFixed(
                  5
                )}, ${selectedPos[1].toFixed(5)}`
              : "Click on the map to select a location for your cache."}
          </p>

          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="field">
              <span className="field-label">Title</span>
              <input
                className="input"
                placeholder="Example: Library rooftop puzzle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="field-row">
              <div className="field">
                <span className="field-label">Difficulty (1–5)</span>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={5}
                  value={difficulty}
                  onChange={(e) => setDifficulty(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="field">
                <span className="field-label">Category</span>
                <select
                  className="select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Traditional">Traditional</option>
                  <option value="Puzzle">Puzzle</option>
                  <option value="Multi">Multi</option>
                  <option value="Event">Event</option>
                </select>
              </div>
            </div>

            <div className="field">
              <span className="field-label">Status</span>
              <select
                className="select"
                value={isActive}
                onChange={(e) => setIsActive(parseInt(e.target.value))}
              >
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>

            {message && (
              <p
                style={{
                  fontSize: "0.8rem",
                  margin: 0,
                  color: message.includes("success")
                    ? "#4ade80"
                    : "#f97373",
                }}
              >
                {message}
              </p>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button type="submit" className="btn">
                Create cache
              </button>
              {!user && (
                <span className="helper-text">
                  Tip: use the Login page to sign in as <code>alice</code> /
                  <code>password123</code>.
                </span>
              )}
            </div>
          </form>

          {/* Map for selecting location in Add Cache tab */}
          <div className="map-container-wrapper" style={{ marginTop: 16 }}>
            <MapContainer center={[40.11, -88.21]} zoom={15} style={{ height: "400px" }}>
              <MapController setMapInstance={setMapInstance} />
              <ClickHandler onClick={setSelectedPos} />
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {caches.map((c) => {
                const isFound = c.is_found === true;
                return (
                  <Marker
                    key={c.id}
                    position={[c.latitude, c.longitude]}
                    icon={isFound ? FoundIcon : DefaultIcon}
                  >
                    <Popup>
                      <strong>{c.title}</strong>
                      <br />
                      Difficulty: {c.difficulty} <br />
                      Category: {c.category}
                    </Popup>
                  </Marker>
                );
              })}
              {selectedPos && (
                <Marker position={selectedPos}>
                  <Popup>New cache here</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        </div>
      )}

      {activeTab === "my" && (
        <div>
          {!user ? (
            <div className="card">
              <p>Please log in to view and manage your caches.</p>
            </div>
          ) : (
            <>
              <div className="card" style={{ marginBottom: 16 }}>
                <h3 className="card-title">My Caches</h3>
                <p className="card-subtitle">
                  Manage the caches you've created. Click on a cache to edit or delete it.
                </p>
              </div>

              {myCaches.length === 0 ? (
                <div className="card">
                  <p>You haven't created any caches yet. Go to the "Add Cache" tab to create one!</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {myCaches.map((cache) => (
                    <div key={cache.id} className="card">
                      {editingCache === cache.id ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          <h4 style={{ margin: 0 }}>Edit Cache</h4>
                          <div className="field">
                            <span className="field-label">Title</span>
                            <input
                              className="input"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              required
                            />
                          </div>
                          <div className="field-row">
                            <div className="field">
                              <span className="field-label">Difficulty (1–5)</span>
                              <input
                                className="input"
                                type="number"
                                min={1}
                                max={5}
                                value={editDifficulty}
                                onChange={(e) => setEditDifficulty(parseInt(e.target.value) || 1)}
                              />
                            </div>
                            <div className="field">
                              <span className="field-label">Category</span>
                              <select
                                className="select"
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                              >
                                <option value="Traditional">Traditional</option>
                                <option value="Puzzle">Puzzle</option>
                                <option value="Multi">Multi</option>
                                <option value="Event">Event</option>
                              </select>
                            </div>
                          </div>
                          {editMessage && (
                            <p
                              style={{
                                fontSize: "0.8rem",
                                margin: 0,
                                color: editMessage.includes("success")
                                  ? "#4ade80"
                                  : "#f97373",
                              }}
                            >
                              {editMessage}
                            </p>
                          )}
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              className="btn"
                              onClick={() => handleUpdate(cache.id)}
                            >
                              Save Changes
                            </button>
                            <button
                              className="btn btn-outline"
                              onClick={cancelEdit}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                <h4 style={{ margin: 0 }}>{cache.title}</h4>
                                {cache.is_active === 0 && (
                                  <span style={{
                                    padding: "2px 8px",
                                    background: "#fee2e2",
                                    color: "#dc2626",
                                    borderRadius: "4px",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                  }}>
                                    INACTIVE
                                  </span>
                                )}
                              </div>
                              <p style={{ margin: 0, fontSize: "0.875rem", color: "#6b7280" }}>
                                Difficulty: {cache.difficulty} | Category: {cache.category}
                                <br />
                                Location: {Number(cache.latitude).toFixed(5)}, {Number(cache.longitude).toFixed(5)}
                                <br />
                                Status: <span style={{ color: cache.is_active === 1 ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                                  {cache.is_active === 1 ? "Active" : "Inactive"}
                                </span>
                                <br />
                                Created: {new Date(cache.created_at).toLocaleDateString()}
                                {cache.updated_at && (
                                  <>
                                    <br />
                                    Updated: {new Date(cache.updated_at).toLocaleDateString()} {new Date(cache.updated_at).toLocaleTimeString()}
                                  </>
                                )}
                              </p>
                            </div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <button
                                className="btn btn-outline"
                                onClick={() => startEdit(cache)}
                                style={{ fontSize: "0.875rem", padding: "6px 12px" }}
                              >
                                Edit
                              </button>
                              {cache.is_active === 1 ? (
                                <button
                                  className="btn btn-outline"
                                  onClick={() => handleDeactivate(cache.id)}
                                  style={{
                                    fontSize: "0.875rem",
                                    padding: "6px 12px",
                                    color: "#f59e0b",
                                    borderColor: "#f59e0b",
                                  }}
                                >
                                  Deactivate
                                </button>
                              ) : (
                                <button
                                  className="btn btn-outline"
                                  onClick={() => handleActivate(cache.id)}
                                  style={{
                                    fontSize: "0.875rem",
                                    padding: "6px 12px",
                                    color: "#10b981",
                                    borderColor: "#10b981",
                                  }}
                                >
                                  Activate
                                </button>
                              )}
                              <button
                                className="btn btn-outline"
                                onClick={() => {
                                  if (viewingStatusLog === cache.id) {
                                    setViewingStatusLog(null);
                                  } else {
                                    setViewingStatusLog(cache.id);
                                    loadStatusLog(cache.id);
                                  }
                                }}
                                style={{ fontSize: "0.875rem", padding: "6px 12px" }}
                              >
                                {viewingStatusLog === cache.id ? "Hide" : "Status History"}
                              </button>
                              <button
                                className="btn btn-outline"
                                onClick={() => handleDelete(cache.id)}
                                style={{
                                  fontSize: "0.875rem",
                                  padding: "6px 12px",
                                  color: "#ef4444",
                                  borderColor: "#ef4444",
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          {/* Status History Section */}
                          {viewingStatusLog === cache.id && (
                            <div style={{ marginTop: 16, padding: 12, background: "#f9fafb", borderRadius: "6px" }}>
                              <h5 style={{ margin: "0 0 12px 0", fontSize: "0.9rem" }}>Status History</h5>
                              {statusLogs[cache.id] && statusLogs[cache.id].length > 0 ? (
                                <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
                                  <thead>
                                    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                                      <th style={{ textAlign: "left", padding: "8px 0", fontWeight: 600 }}>Changed At</th>
                                      <th style={{ textAlign: "left", padding: "8px 0", fontWeight: 600 }}>Status</th>
                                      <th style={{ textAlign: "left", padding: "8px 0", fontWeight: 600 }}>Reason</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {statusLogs[cache.id].map((log, idx) => (
                                      <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                        <td style={{ padding: "8px 0" }}>
                                          {new Date(log.changed_at).toLocaleString()}
                                        </td>
                                        <td style={{ padding: "8px 0" }}>
                                          {log.old_is_active} → {log.new_is_active}
                                        </td>
                                        <td style={{ padding: "8px 0", color: "#6b7280" }}>
                                          {log.reason || "—"}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <p style={{ margin: 0, fontSize: "0.875rem", color: "#6b7280" }}>
                                  No status history available.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}