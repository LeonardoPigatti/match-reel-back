const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, index: true, unique: true, sparse: true },
  email: { type: String, required: true, index: true, unique: true },
  password: { type: String, required: true },
  dob: Date,
  gender: String,
  bio: String,
  avatarUrl: String, // caminho relativo ou URL
  genres: [String],
  character: String,
  plotTwist: String,
  watchFrequency: Number,
  popcorn: String,
  soundtrack: String,
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
