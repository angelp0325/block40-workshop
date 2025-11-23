import db from "#db/client";

await db.connect();
await seed();
await db.end();
console.log("🌱 Database seeded.");

async function seed() {
  try {
    await db.query("BEGIN");

    await db.query(`
      DELETE FROM playlists_tracks;
      DELETE FROM playlists;
      DELETE FROM tracks;
    `);

    for (let i = 1; i <= 20; i++) {
      await db.query(
        `INSERT INTO tracks (name, duration_ms)
         VALUES ($1, $2);`,
        [`Track ${i}`, 180000 + i * 500]
      );
    }

    for (let i = 1; i <= 10; i++) {
      await db.query(
        `INSERT INTO playlists (name, description)
         VALUES ($1, $2);`,
        [`Playlist ${i}`, `Description for playlist ${i}`]
      );
    }

    for (let i = 1; i <= 15; i++) {
      const playlistId = ((i - 1) % 10) + 1;
      const trackId = ((i - 1) % 20) + 1;
      await db.query(
        `INSERT INTO playlists_tracks (playlist_id, track_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING;`,
        [playlistId, trackId]
      );
    }

    await db.query("COMMIT");
    console.log("✅ Seeding completed successfully!");
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("❌ Error during seeding:", err.message);
  }
}
