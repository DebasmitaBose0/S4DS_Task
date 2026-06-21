const { getModel } = require('../config/db');

const AuditLogSchema = {
  user: { type: String, required: true },
  role: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String, default: '127.0.0.1' },
  actionType: { type: String, required: true }, // e.g. CREATE, UPDATE, DELETE, LOGIN_FAIL, ILLEGAL_ACCESS
  targetId: { type: String, default: '' },
  oldValue: { type: String, default: '' },
  newValue: { type: String, default: '' }
};

module.exports = getModel('AuditLog', AuditLogSchema);
