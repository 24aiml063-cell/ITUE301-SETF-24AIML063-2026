const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the MONGO_URI environment variable.
 * Connection string is never hardcoded — it must be set in .env.
 * Logs success or failure; exits the process on unrecoverable failure.
 * Requirements: 6.1–6.7
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('[DB] MONGO_URI environment variable is not set');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('[DB] Connected to MongoDB');
  } catch (err) {
    console.error('[DB] MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
