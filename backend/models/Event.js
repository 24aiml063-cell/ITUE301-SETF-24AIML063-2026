const mongoose = require('mongoose');

/**
 * Event schema
 * - ticketsAvailable: min 0, schema validation rejects negative values
 * Requirements: 6.2, 6.3
 */
const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'category is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'date is required'],
    },
    venue: {
      type: String,
      required: [true, 'venue is required'],
      trim: true,
    },
    ticketsAvailable: {
      type: Number,
      required: [true, 'ticketsAvailable is required'],
      min: [0, 'ticketsAvailable cannot be negative'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
