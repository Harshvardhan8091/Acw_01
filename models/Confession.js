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
    like: { type: Number, default: 0 },
    love: { type: Number, default: 0 },
    laugh: { type: Number, default: 0 }
  },

  // Tracks which user reacted with which reaction (prevents duplicate reactions)
  reactedUsers: [
    {
      userId: { type: String, required: true },
      reaction: { type: String, enum: ['like', 'love', 'laugh'], required: true }
    }
  ],

  // Moderation status — set by admin
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
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
  },

  // Poster identity — stored for admin moderation only, never shown publicly
  userName: {
    type: String,
    trim: true
  },

  // Poster's email — admin-only visibility, kept private from public routes
  userEmail: {
    type: String,
    trim: true,
    lowercase: true
  }
});

module.exports = mongoose.model('Confession', ConfessionSchema);
