const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
require("dotenv").config();
<<<<<<< HEAD
=======
const { getRecommendations } = require("./recommendation");
>>>>>>> myrepo/main

const app = express();
app.use(cors());
app.use(express.json());

// --- DB POOL (Cloud SQL) ---
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// --- In-memory sessions (reset when server restarts) ---
const sessions = new Map();

function auth(req, res, next) {
  const token = req.headers["x-auth-token"];
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: "not logged in" });
  }
  req.userId = sessions.get(token); // app_user_id
  next();
}

// --- Health check ---
app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");
    res.json({ status: "ok", db: rows[0].ok });
  } catch (err) {
    console.error("health error:", err);
    res.status(500).json({ status: "error", error: err.message });
  }
});

// --- Auth routes ---

// POST /api/register { username, password, displayName }
app.post("/api/register", async (req, res) => {
  const { username, password, displayName } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "username and password required" });
  }

  try {
    const [existing] = await pool.query(
      "SELECT app_user_id FROM APP_USERS WHERE username = ?",
      [username]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: "username already exists" });
    }

    const [result] = await pool.query(
      `INSERT INTO APP_USERS (username, password_plain, display_name)
       VALUES (?, ?, ?)`,
      [username, password, displayName || null]
    );

    res.status(201).json({ ok: true, app_user_id: result.insertId });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ error: "server error" });
  }
});

// POST /api/login { username, password }
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "username and password required" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT app_user_id, username, password_plain, display_name FROM APP_USERS WHERE username = ?",
      [username]
    );
    if (rows.length === 0 || rows[0].password_plain !== password) {
      return res.status(401).json({ error: "invalid credentials" });
    }

    const user = rows[0];
    const token = `${user.app_user_id}.${Math.random().toString(36).slice(2)}`;

    sessions.set(token, user.app_user_id);

    res.json({
      token,
      user: {
        id: user.app_user_id,
        username: user.username,
        displayName: user.display_name,
      },
    });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ error: "server error" });
  }
});

// --- Caches routes ---

// GET /api/caches – list recent caches
app.get("/api/caches", async (req, res) => {
  try {
<<<<<<< HEAD
    const [rows] = await pool.query(
      `SELECT 
          c.cache_id   AS id,
          c.title,
          c.description,
=======
    const token = req.headers["x-auth-token"];
    const userId = token && sessions.has(token) ? sessions.get(token) : null;

    let query = `SELECT 
          c.cache_id   AS id,
          c.title,
>>>>>>> myrepo/main
          c.latitude,
          c.longitude,
          c.difficulty,
          cat.name      AS category,
          c.owner_id    AS creator_id,
<<<<<<< HEAD
          c.created_at
       FROM CACHES c
       JOIN CATEGORIES cat ON c.category_id = cat.category_id
       WHERE c.is_active = 1
       ORDER BY c.created_at DESC
       LIMIT 200`
    );
    res.json(rows);
=======
          c.is_active,
          c.created_at,
          c.updated_at`;

    // Add found status if user is logged in
    if (userId) {
      query += `,
          CASE WHEN EXISTS (
            SELECT 1 FROM FIND_LOGS f 
            WHERE f.cache_id = c.cache_id 
            AND f.finder_id = ?
          ) THEN 1 ELSE 0 END AS is_found`;
    }

    query += ` FROM CACHES c
       JOIN CATEGORIES cat ON c.category_id = cat.category_id
       WHERE c.is_active = 1
       ORDER BY c.created_at DESC
       LIMIT 200`;

    const [rows] = userId
      ? await pool.query(query, [userId])
      : await pool.query(query);

    // Convert is_found to boolean if present
    const result = rows.map((row) => ({
      ...row,
      is_found: row.is_found !== undefined ? Boolean(row.is_found) : undefined,
    }));

    res.json(result);
>>>>>>> myrepo/main
  } catch (err) {
    console.error("get /api/caches error:", err);
    res.status(500).json({ error: "server error" });
  }
});

// POST /api/caches – only logged-in users can create
app.post("/api/caches", auth, async (req, res) => {
  const {
    title,
    description,
    latitude,
    longitude,
    difficulty,
    category,
<<<<<<< HEAD
=======
    is_active,
>>>>>>> myrepo/main
  } = req.body || {};

  if (!title || latitude == null || longitude == null) {
    return res
      .status(400)
      .json({ error: "title, latitude, and longitude are required" });
  }

<<<<<<< HEAD
=======
  // Validate is_active: must be 0 or 1, default to 1
  let activeStatus = 1;
  if (is_active !== undefined) {
    const activeValue = Number(is_active);
    if (activeValue !== 0 && activeValue !== 1) {
      return res.status(400).json({ error: "is_active must be 0 or 1" });
    }
    activeStatus = activeValue;
  }

>>>>>>> myrepo/main
  try {
    const catName = category || "Traditional";
    const [catRows] = await pool.query(
      "SELECT category_id FROM CATEGORIES WHERE name = ?",
      [catName]
    );
    if (catRows.length === 0) {
      return res.status(400).json({ error: "invalid category" });
    }

    const categoryId = catRows[0].category_id;

    // NOTE: visibility column added, with literal 'public'
    const [result] = await pool.query(
      `INSERT INTO CACHES
          (owner_id,
           category_id,
           title,
           description,
           difficulty,
           latitude,
           longitude,
           visibility,
           is_active,
           created_at)
<<<<<<< HEAD
       VALUES (?, ?, ?, ?, ?, ?, ?, 'public', 1, NOW())`,
=======
       VALUES (?, ?, ?, ?, ?, ?, ?, 'public', ?, NOW())`,
>>>>>>> myrepo/main
      [
        req.userId, // app_user_id from session
        categoryId,
        title,
        description || "",
        Number(difficulty || 1),
        Number(latitude),
        Number(longitude),
<<<<<<< HEAD
=======
        activeStatus,
>>>>>>> myrepo/main
      ]
    );

    const cacheId = result.insertId;

    const [rows] = await pool.query(
      `SELECT 
          c.cache_id   AS id,
          c.title,
<<<<<<< HEAD
          c.description,
=======
>>>>>>> myrepo/main
          c.latitude,
          c.longitude,
          c.difficulty,
          cat.name      AS category,
          c.owner_id    AS creator_id,
<<<<<<< HEAD
          c.created_at
=======
          c.is_active,
          c.created_at,
          c.updated_at
>>>>>>> myrepo/main
       FROM CACHES c
       JOIN CATEGORIES cat ON c.category_id = cat.category_id
       WHERE c.cache_id = ?`,
      [cacheId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("post /api/caches error:", err);
    res.status(500).json({ error: "server error" });
  }
});

<<<<<<< HEAD
=======
// POST /api/caches/:id/found – mark a cache as found
app.post("/api/caches/:id/found", auth, async (req, res) => {
  const cacheId = parseInt(req.params.id);
  if (!cacheId) {
    return res.status(400).json({ error: "invalid cache id" });
  }

  try {
    // Check if cache exists
    const [cacheRows] = await pool.query(
      "SELECT cache_id FROM CACHES WHERE cache_id = ? AND is_active = 1",
      [cacheId]
    );
    if (cacheRows.length === 0) {
      return res.status(404).json({ error: "cache not found" });
    }

    // Check if already found
    const [existing] = await pool.query(
      "SELECT log_id FROM FIND_LOGS WHERE cache_id = ? AND finder_id = ?",
      [cacheId, req.userId]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: "cache already marked as found" });
    }

    // Insert find log
    await pool.query(
      "INSERT INTO FIND_LOGS (cache_id, finder_id, found_at) VALUES (?, ?, NOW())",
      [cacheId, req.userId]
    );

    // Also record as interaction for recommendation system
    try {
      await pool.query(
        `INSERT INTO USER_CACHE_INTERACTIONS 
         (user_id, cache_id, interaction_type, interaction_weight, created_at)
         VALUES (?, ?, 'found', 3.0, NOW())
         ON DUPLICATE KEY UPDATE 
           interaction_type = 'found',
           interaction_weight = 3.0,
           created_at = NOW()`,
        [req.userId, cacheId]
      );
    } catch (err) {
      // Table might not exist yet, that's okay
      console.log("Could not record interaction (table may not exist):", err.message);
    }

    res.json({ ok: true, message: "Cache marked as found" });
  } catch (err) {
    console.error("post /api/caches/:id/found error:", err);
    res.status(500).json({ error: "server error" });
  }
});

// GET /api/caches/found – get all found caches for current user
app.get("/api/caches/found", auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
          c.cache_id   AS id,
          c.title,
          c.latitude,
          c.longitude,
          c.difficulty,
          cat.name      AS category,
          c.owner_id    AS creator_id,
          c.created_at,
          f.found_at
       FROM CACHES c
       JOIN CATEGORIES cat ON c.category_id = cat.category_id
       JOIN FIND_LOGS f ON c.cache_id = f.cache_id
       WHERE c.is_active = 1
         AND f.finder_id = ?
       ORDER BY f.found_at DESC
       LIMIT 200`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error("get /api/caches/found error:", err);
    res.status(500).json({ error: "server error" });
  }
});

// GET /api/caches/my – get all caches created by current user (active and inactive)
app.get("/api/caches/my", auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
          c.cache_id   AS id,
          c.title,
          c.latitude,
          c.longitude,
          c.difficulty,
          cat.name      AS category,
          c.owner_id    AS creator_id,
          c.is_active,
          c.created_at,
          c.updated_at
       FROM CACHES c
       JOIN CATEGORIES cat ON c.category_id = cat.category_id
       WHERE c.owner_id = ?
       ORDER BY c.created_at DESC`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error("get /api/caches/my error:", err);
    res.status(500).json({ error: "server error" });
  }
});

// PUT /api/caches/:id – update a cache (only if user owns it)
app.put("/api/caches/:id", auth, async (req, res) => {
  const cacheId = parseInt(req.params.id);
  if (!cacheId) {
    return res.status(400).json({ error: "invalid cache id" });
  }

  const { title, difficulty, category, latitude, longitude } = req.body || {};

  try {
    // Check if cache exists and user owns it
    const [cacheRows] = await pool.query(
      "SELECT cache_id, owner_id FROM CACHES WHERE cache_id = ? AND is_active = 1",
      [cacheId]
    );
    if (cacheRows.length === 0) {
      return res.status(404).json({ error: "cache not found" });
    }
    if (cacheRows[0].owner_id !== req.userId) {
      return res.status(403).json({ error: "you don't own this cache" });
    }

    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push("title = ?");
      values.push(title);
    }
    if (difficulty !== undefined) {
      updates.push("difficulty = ?");
      values.push(Number(difficulty));
    }
    if (category !== undefined) {
      const catName = category;
      const [catRows] = await pool.query(
        "SELECT category_id FROM CATEGORIES WHERE name = ?",
        [catName]
      );
      if (catRows.length === 0) {
        return res.status(400).json({ error: "invalid category" });
      }
      updates.push("category_id = ?");
      values.push(catRows[0].category_id);
    }
    if (latitude !== undefined) {
      updates.push("latitude = ?");
      values.push(Number(latitude));
    }
    if (longitude !== undefined) {
      updates.push("longitude = ?");
      values.push(Number(longitude));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "no fields to update" });
    }

    values.push(cacheId);
    await pool.query(
      `UPDATE CACHES SET ${updates.join(", ")} WHERE cache_id = ?`,
      values
    );

    // Return updated cache
    const [rows] = await pool.query(
      `SELECT 
          c.cache_id   AS id,
          c.title,
          c.latitude,
          c.longitude,
          c.difficulty,
          cat.name      AS category,
          c.owner_id    AS creator_id,
          c.is_active,
          c.created_at,
          c.updated_at
       FROM CACHES c
       JOIN CATEGORIES cat ON c.category_id = cat.category_id
       WHERE c.cache_id = ?`,
      [cacheId]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("put /api/caches/:id error:", err);
    res.status(500).json({ error: "server error" });
  }
});

// DELETE /api/caches/:id – delete a cache (only if user owns it)
app.delete("/api/caches/:id", auth, async (req, res) => {
  const cacheId = parseInt(req.params.id);
  if (!cacheId) {
    return res.status(400).json({ error: "invalid cache id" });
  }

  try {
    // Check if cache exists and user owns it
    const [cacheRows] = await pool.query(
      "SELECT cache_id, owner_id FROM CACHES WHERE cache_id = ? AND is_active = 1",
      [cacheId]
    );
    if (cacheRows.length === 0) {
      return res.status(404).json({ error: "cache not found" });
    }
    if (cacheRows[0].owner_id !== req.userId) {
      return res.status(403).json({ error: "you don't own this cache" });
    }

    // Soft delete by setting is_active = 0
    await pool.query("UPDATE CACHES SET is_active = 0 WHERE cache_id = ?", [
      cacheId,
    ]);

    res.json({ ok: true, message: "Cache deleted" });
  } catch (err) {
    console.error("delete /api/caches/:id error:", err);
    res.status(500).json({ error: "server error" });
  }
});

// POST /api/caches/:id/activate – activate a cache
app.post("/api/caches/:id/activate", auth, async (req, res) => {
  const cacheId = parseInt(req.params.id);
  if (!cacheId) {
    return res.status(400).json({ error: "invalid cache id" });
  }

  try {
    // Check if user owns the cache
    const [cacheRows] = await pool.query(
      "SELECT cache_id, owner_id, is_active FROM CACHES WHERE cache_id = ?",
      [cacheId]
    );
    if (cacheRows.length === 0) {
      return res.status(404).json({ error: "cache not found" });
    }
    if (cacheRows[0].owner_id !== req.userId) {
      return res.status(403).json({ error: "you don't own this cache" });
    }

    // Update is_active to 1
    await pool.query("UPDATE CACHES SET is_active = 1 WHERE cache_id = ?", [
      cacheId,
    ]);

    // Fetch the updated cache
    const [rows] = await pool.query(
      `SELECT 
          c.cache_id   AS id,
          c.title,
          c.latitude,
          c.longitude,
          c.difficulty,
          cat.name      AS category,
          c.owner_id    AS creator_id,
          c.is_active,
          c.created_at,
          c.updated_at
       FROM CACHES c
       JOIN CATEGORIES cat ON c.category_id = cat.category_id
       WHERE c.cache_id = ?`,
      [cacheId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "cache not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("post /api/caches/:id/activate error:", err);
    res.status(500).json({ error: "server error" });
  }
});

// POST /api/caches/:id/deactivate – deactivate a cache using stored procedure
// This endpoint demonstrates use of a stored procedure + transaction + trigger
app.post("/api/caches/:id/deactivate", auth, async (req, res) => {
  const cacheId = parseInt(req.params.id);
  if (!cacheId) {
    return res.status(400).json({ error: "invalid cache id" });
  }

  const { reason } = req.body || {};
  const deactivateReason = reason || "Deactivated from UI";

  try {
    // Check if user owns the cache
    const [cacheRows] = await pool.query(
      "SELECT cache_id, owner_id, is_active FROM CACHES WHERE cache_id = ?",
      [cacheId]
    );
    if (cacheRows.length === 0) {
      return res.status(404).json({ error: "cache not found" });
    }
    if (cacheRows[0].owner_id !== req.userId) {
      return res.status(403).json({ error: "you don't own this cache" });
    }

    // Call the stored procedure DeactivateCache(cache_id, reason)
    const [result] = await pool.query("CALL DeactivateCache(?, ?)", [
      cacheId,
      deactivateReason,
    ]);

    // Check if procedure returned an error signal
    if (result[0] && result[0][0] && result[0][0].error) {
      if (result[0][0].error === "Cache not found") {
        return res.status(404).json({ error: "cache not found" });
      }
      return res.status(400).json({ error: result[0][0].error });
    }

    // Fetch the updated cache with is_active and updated_at
    const [rows] = await pool.query(
      `SELECT 
          c.cache_id   AS id,
          c.title,
          c.latitude,
          c.longitude,
          c.difficulty,
          cat.name      AS category,
          c.owner_id    AS creator_id,
          c.is_active,
          c.created_at,
          c.updated_at
       FROM CACHES c
       JOIN CATEGORIES cat ON c.category_id = cat.category_id
       WHERE c.cache_id = ?`,
      [cacheId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "cache not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("post /api/caches/:id/deactivate error:", err);
    // Handle constraint errors
    if (err.code === "ER_NO_REFERENCED_ROW_2" || err.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(400).json({ error: "constraint violation" });
    }
    res.status(500).json({ error: "server error" });
  }
});

// GET /api/caches/:id/status-log – get status log entries for a cache
app.get("/api/caches/:id/status-log", auth, async (req, res) => {
  const cacheId = parseInt(req.params.id);
  if (!cacheId) {
    return res.status(400).json({ error: "invalid cache id" });
  }

  try {
    // Check if user owns the cache
    const [cacheRows] = await pool.query(
      "SELECT cache_id, owner_id FROM CACHES WHERE cache_id = ?",
      [cacheId]
    );
    if (cacheRows.length === 0) {
      return res.status(404).json({ error: "cache not found" });
    }
    if (cacheRows[0].owner_id !== req.userId) {
      return res.status(403).json({ error: "you don't own this cache" });
    }

    // Fetch status log entries
    const [rows] = await pool.query(
      `SELECT 
          changed_at,
          old_is_active,
          new_is_active,
          reason
       FROM CACHE_STATUS_LOG
       WHERE cache_id = ?
       ORDER BY changed_at DESC
       LIMIT 50`,
      [cacheId]
    );

    res.json(rows);
  } catch (err) {
    console.error("get /api/caches/:id/status-log error:", err);
    res.status(500).json({ error: "server error" });
  }
});

>>>>>>> myrepo/main
// --- Leaderboard ---
app.get("/api/leaderboard", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
<<<<<<< HEAD
          u.name  AS username,
          COUNT(f.log_id) AS finds
       FROM USERS u
       JOIN FIND_LOGS f ON u.user_id = f.finder_id
       GROUP BY u.user_id
=======
          COALESCE(u.display_name, u.username) AS username,
          COUNT(f.log_id) AS finds
       FROM APP_USERS u
       JOIN FIND_LOGS f ON u.app_user_id = f.finder_id
       GROUP BY u.app_user_id, u.username, u.display_name
>>>>>>> myrepo/main
       ORDER BY finds DESC
       LIMIT 10`
    );
    res.json(rows);
  } catch (err) {
    console.error("get /api/leaderboard error:", err);
    res.status(500).json({ error: "server error" });
  }
});

<<<<<<< HEAD
=======
// POST /api/caches/:id/view – track cache view interaction
app.post("/api/caches/:id/view", auth, async (req, res) => {
  const cacheId = parseInt(req.params.id);
  if (!cacheId) {
    return res.status(400).json({ error: "invalid cache id" });
  }

  try {
    // Check if cache exists
    const [cacheRows] = await pool.query(
      "SELECT cache_id FROM CACHES WHERE cache_id = ?",
      [cacheId]
    );
    if (cacheRows.length === 0) {
      return res.status(404).json({ error: "cache not found" });
    }

    // Record interaction (upsert to avoid duplicates)
    // Try to insert, ignore if already exists (user can view multiple times, but we track once per day)
    try {
      await pool.query(
        `INSERT INTO USER_CACHE_INTERACTIONS 
         (user_id, cache_id, interaction_type, interaction_weight, created_at)
         VALUES (?, ?, 'view', 1.0, NOW())
         ON DUPLICATE KEY UPDATE created_at = NOW()`,
        [req.userId, cacheId]
      );
    } catch (err) {
      // Table might not exist or no unique constraint, try simple insert
      await pool.query(
        `INSERT IGNORE INTO USER_CACHE_INTERACTIONS 
         (user_id, cache_id, interaction_type, interaction_weight, created_at)
         VALUES (?, ?, 'view', 1.0, NOW())`,
        [req.userId, cacheId]
      );
    }

    res.json({ ok: true });
  } catch (err) {
    // Don't fail the request if interaction tracking fails
    console.error("Error tracking view interaction:", err);
    res.json({ ok: true }); // Still return success
  }
});

// GET /api/users/me/recommended-caches – get personalized cache recommendations
app.get("/api/users/me/recommended-caches", auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const recommendations = await getRecommendations(pool, req.userId, limit);
    res.json(recommendations);
  } catch (err) {
    console.error("get /api/users/me/recommended-caches error:", err);
    res.status(500).json({ error: "server error" });
  }
});

// POST /api/setup/recommendation-table – create USER_CACHE_INTERACTIONS table if needed

app.post("/api/setup/recommendation-table", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS USER_CACHE_INTERACTIONS (
        interaction_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        cache_id INT NOT NULL,
        interaction_type VARCHAR(50) NOT NULL DEFAULT 'view',
        interaction_weight DECIMAL(5,2) DEFAULT 1.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_cache_type (user_id, cache_id, interaction_type),
        INDEX idx_user_cache (user_id, cache_id),
        INDEX idx_user_type (user_id, interaction_type),
        INDEX idx_cache (cache_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    res.json({ ok: true, message: "USER_CACHE_INTERACTIONS table created/verified" });
  } catch (err) {
    console.error("Error creating recommendation table:", err);
    res.status(500).json({ error: "Failed to create table", details: err.message });
  }
});


(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS USER_CACHE_INTERACTIONS (
        interaction_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        cache_id INT NOT NULL,
        interaction_type VARCHAR(50) NOT NULL DEFAULT 'view',
        interaction_weight DECIMAL(5,2) DEFAULT 1.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_cache_type (user_id, cache_id, interaction_type),
        INDEX idx_user_cache (user_id, cache_id),
        INDEX idx_user_type (user_id, interaction_type),
        INDEX idx_cache (cache_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("Recommendation system: USER_CACHE_INTERACTIONS table ready");
  } catch (err) {
    console.error("Warning: Could not initialize recommendation table:", err.message);
  }
})();

>>>>>>> myrepo/main
const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});