import app from "./app.js";
import db from "#db/client.js";

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await db.connect();
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

start();
