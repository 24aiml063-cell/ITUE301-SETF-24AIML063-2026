const mongoose = require('mongoose');

/**
 * Attendee schema
 * - email: unique, required, normalised to lowercase, validated by regex
 * - passwordHash: never returned in API responses (select: false)
 * - role: enum ["attendee", "organizer"]
 * Requirements: 6.1, 6.7
 */
const attendeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'email must be a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'passwordHash is required'],
      select: false, // never returned in query results
    },
    role: {
      type: String,
      required: [true, 'role is required'],
      enum: {
        values: ['attendee', 'organizer'],
        message: 'role must be either "attendee" or "organizer"',
      },
    },
  },
  { timestamps: true }
);

// Strip passwordHash from all toJSON / toObject conversions as a safety net
attendeeSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = mongoose.model('Attendee', attendeeSchema);
