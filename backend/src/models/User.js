const { getModel } = require('../config/db');

const UserSchema = {
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Doctor', 'Receptionist'], default: 'Receptionist' },
  resetCode: { type: String, default: null },
  resetCodeExpires: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
};

module.exports = getModel('User', UserSchema);
