import express from "express";
import db from "#db/client";

const app = express();
app.use(express.json());

app.get("/tracks", async (req, res, next) => {
  try {
    const result = await db.query("SELECT * FROM tracks ORDER BY id;");
    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.get("/tracks/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).send("Invalid track id");
    const result = await db.query("SELECT * FROM tracks WHERE id = $1;", [id]);
    if (result.rows.length === 0) return res.sendStatus(404);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

app.get("/playlists", async (req, res, next) => {
  try {
    const result = await db.query("SELECT * FROM playlists ORDER BY id;");
    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.post("/playlists", async (req, res, next) => {
  try {
    const { name, description } = req.body || {};
    if (!name || !description) return res.sendStatus(400);

    const result = await db.query(
      `INSERT INTO playlists (name, description)
       VALUES ($1, $2)
       RETURNING *;`,
      [name, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

app.get("/playlists/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.sendStatus(400);
    const result = await db.query("SELECT * FROM playlists WHERE id = $1;", [
      id,
    ]);
    if (result.rows.length === 0) return res.sendStatus(404);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

app.get("/playlists/:id/tracks", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.sendStatus(400);

    const playlistExists = await db.query(
      "SELECT 1 FROM playlists WHERE id = $1;",
      [id]
    );
    if (playlistExists.rows.length === 0) return res.sendStatus(404);

    const result = await db.query(
      `SELECT t.*
       FROM playlists_tracks pt
       JOIN tracks t ON pt.track_id = t.id
       WHERE pt.playlist_id = $1;`,
      [id]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.post("/playlists/:id/tracks", async (req, res, next) => {
  try {
    const playlistId = Number(req.params.id);
    if (isNaN(playlistId)) return res.sendStatus(400);

    const { trackId } = req.body || {};
    if (!trackId || isNaN(Number(trackId))) return res.sendStatus(400);

    const playlist = await db.query("SELECT * FROM playlists WHERE id = $1;", [
      playlistId,
    ]);
    if (playlist.rows.length === 0) return res.sendStatus(404);

    const track = await db.query("SELECT * FROM tracks WHERE id = $1;", [
      trackId,
    ]);
    if (track.rows.length === 0) return res.sendStatus(400);

    try {
      const result = await db.query(
        `INSERT INTO playlists_tracks (playlist_id, track_id)
         VALUES ($1, $2)
         RETURNING *;`,
        [playlistId, trackId]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      if (error.code === "23505") return res.sendStatus(400);
      throw error;
    }
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
