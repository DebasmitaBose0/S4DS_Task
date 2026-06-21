const { getModel } = require('../config/db');

const ActivityLogSchema = {
  user: { type: String, required: true },
  role: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  action: { type: String, required: true }, // LOGIN, LOGIN_FAIL, READ, CREATE, UPDATE, DELETE, UNauthorized_ATTEMPT
  ipAddress: { type: String, default: '127.0.0.1' },
  isSuccess: { type: Boolean, default: true },
  isAnomalous: { type: Boolean, default: false },
  riskLevel: { type: String, default: 'LOW' },
  confidence: { type: Number, default: 100 }
};

module.exports = getModel('ActivityLog', ActivityLogSchema);
