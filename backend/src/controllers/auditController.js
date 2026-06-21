const AuditLog = require('../models/AuditLog');
const SecurityAlert = require('../models/SecurityAlert');

// Audit Controller
exports.getAuditLogs = async (req, res) => {
  try {
    const { query } = req.query;
    let filter = {};
    if (query) {
      filter = {
        $or: [
          { user: { $regex: query, $options: 'i' } },
          { actionType: { $regex: query, $options: 'i' } },
          { targetId: { $regex: query, $options: 'i' } }
        ]
      };
    }
    const logs = await AuditLog.find(filter);
    // Sort by timestamp descending
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
};

// Alert Controller
exports.getAlerts = async (req, res) => {
  try {
    const alerts = await SecurityAlert.find({});
    alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch alerts' });
  }
};

exports.resolveAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await SecurityAlert.findByIdAndUpdate(id, { resolved: true }, { new: true });
    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Failed to resolve alert' });
  }
};
