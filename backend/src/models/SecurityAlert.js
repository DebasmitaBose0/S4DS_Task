const { getModel } = require('../config/db');

const SecurityAlertSchema = {
  type: { type: String, required: true }, // TAMPERING, PRIVILEGE_VIOLATION, BRUTE_FORCE, AI_ANOMALY
  severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
  description: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  resolved: { type: Boolean, default: false },
  recordId: { type: String, default: '' } // Reference to Patient ID or log ID
};

module.exports = getModel('SecurityAlert', SecurityAlertSchema);
