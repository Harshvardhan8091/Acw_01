// models/Confession.js
// Mongoose schema for the Confession model

const mongoose = require('mongoose');

const ConfessionSchema = new mongoose.Schema({
  // The confession text (required, cannot be empty)
  text: {
    type: String,
    required: [true, 'Confession text is required'],
    trim: true
  },

  // Secret code used to edit/delete the confession (min 4 characters)
  secretCode: {
    type: String,
    required: [true, 'Secret code is required'],
    minlength: [4, 'Secret code must be at least 4 characters long'],
    trim: true
  },

  // Reaction counts
  reactions: {
    like:  { type: Number, default: 0 },
    love:  { type: Number, default: 0 },
    laugh: { type: Number, default: 0 }
  },

  // Timestamp when the confession was created
  createdAt: {
    type: Date,
    default: Date.now
  },

  // Google OAuth user ID (from profile.id)
  userId: {
    type: String,
    required: [true, 'User ID is required']
  }
});

module.exports = mongoose.model('Confession', ConfessionSchema);
