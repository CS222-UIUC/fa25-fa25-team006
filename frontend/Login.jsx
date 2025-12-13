import { useState, useEffect } from "react";
import { login, register, getCurrentUser, logout } from "./api";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(getCurrentUser());

  // Update user state when it changes
  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    try {
      if (mode === "login") {
        const u = await login(username, password);
        setUser(u);
        setMessage(`Logged in as ${u.displayName || u.username}`);
        // Notify App component of user change
        window.dispatchEvent(new Event("userChanged"));
      } else {
        await register(username, password, displayName);
        setMessage("Registered! Now switch to Login and sign in.");
      }
    } catch (err) {
      setMessage(err.message || "Something went wrong");
    }
  }

  function handleLogout() {
    logout();
    setUser(null);
    setMessage("Logged out");
    // Clear form fields
    setUsername("");
    setPassword("");
    setDisplayName("");
    // Notify App component of user change
    window.dispatchEvent(new Event("userChanged"));
  }

  return (
    <>
      <h2 className="page-title">Account</h2>
      <p className="page-subtitle">
        Use a simple account to attach created caches to your profile. For demo
        accounts, try <code>alice</code> / <code>password123</code> or{" "}
        <code>admin</code> / <code>admin123</code>.
      </p>

      <div className="login-layout">
        <div className="card">
          <h3 className="card-title">
            {mode === "login" ? "Sign in" : "Create an account"}
          </h3>
          <p className="card-subtitle">
            {mode === "login"
              ? "Enter your credentials to sign in and start placing caches."
              : "Pick a username and password to create a new account."}
          </p>

          {user && (
            <div
              style={{
                marginBottom: 12,
                padding: 8,
                borderRadius: 10,
                background: "rgba(34,197,94,0.12)",
                fontSize: "0.86rem",
              }}
            >
              Currently signed in as{" "}
              <b>{user.displayName || user.username}</b>.
              <button
                className="btn btn-outline"
                style={{ marginLeft: 10, padding: "4px 10px" }}
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginTop: 8,
            }}
          >
            <div className="field">
              <span className="field-label">Username</span>
              <input
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your-netid or nickname"
                required
                disabled={!!user}
              />
            </div>

            {mode === "register" && (
              <div className="field">
                <span className="field-label">Display name (optional)</span>
                <input
                  className="input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Name shown on caches / leaderboard"
                  disabled={!!user}
                />
              </div>
            )}

            <div className="field">
              <span className="field-label">Password</span>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={!!user}
              />
            </div>

            {message && (
              <p
                style={{
                  fontSize: "0.8rem",
                  margin: 0,
                  marginTop: 4,
                  color: message.toLowerCase().includes("logged")
                    ? "#4ade80"
                    : "#f97373",
                }}
              >
                {message}
              </p>
            )}

            {!user && (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button type="submit" className="btn">
                  {mode === "login" ? "Sign in" : "Create account"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setMode(mode === "login" ? "register" : "login");
                    setMessage("");
                  }}
                >
                  Switch to {mode === "login" ? "Register" : "Login"}
                </button>
              </div>
            )}
          </form>
        </div>

        <div className="card card-muted">
          <h3 className="card-title">How accounts work</h3>
          <p className="card-subtitle">
            This demo app uses a very simple in-memory session system. When you log in,
            we store a token in your browser and associate your created caches with your
            account in the database.
          </p>
          <ul style={{ fontSize: "0.85rem", paddingLeft: 18, marginTop: 8 }}>
            <li>Created caches are linked to your username.</li>
            <li>
              The leaderboard still uses the separate synthetic <code>USERS</code> table
              from your class project dataset.
            </li>
            <li>
              In a real app, passwords would be hashed instead of stored as plain text.
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}