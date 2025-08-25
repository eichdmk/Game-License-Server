import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  level: { type: Number, default: 1 },
  coins: { type: Number, default: 0 },
  refreshToken: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);