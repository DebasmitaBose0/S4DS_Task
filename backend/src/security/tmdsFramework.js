const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const AuditLog = require('../models/AuditLog');
const SecurityAlert = require('../models/SecurityAlert');
const ActivityLog = require('../models/ActivityLog');

// Generate SHA-256 hash for patient record
const generateRecordHash = (patient) => {
  // Combine all clinical fields in a predictable sequence
  const hashString = [
    patient.patientId,
    patient.fullName,
    String(patient.age),
    patient.gender,
    patient.bloodGroup,
    patient.allergies || '',
    patient.diagnosis || '',
    patient.prescription || '',
    patient.doctorName
  ].join('|');

  return crypto.createHash('sha256').update(hashString).digest('hex');
};

// Verify record integrity. If mismatch, log alarm and flag patient.
const verifyRecordIntegrity = async (patientDoc) => {
  if (!patientDoc) return true;

  const currentHash = generateRecordHash(patientDoc);
  if (patientDoc.recordHash !== currentHash) {
    // If not already marked as tampered, raise alert
    if (!patientDoc.isTampered) {
      patientDoc.isTampered = true;
      patientDoc.tamperedFields = [];

      // Detect which fields changed by storing them or analyzing (or default to general fields)
      // Since we don't have the original uncorrupted values in the patient record,
      // we mark it as tampered.
      await patientDoc.save();

      // Create Security Alert
      await SecurityAlert.create({
        type: 'TAMPERING',
        severity: 'CRITICAL',
        description: `DATA INTEGRITY CORRUPTED: Patient record ${patientDoc.fullName} (ID: ${patientDoc.patientId}) has been modified outside the system. Cryptographic signatures mismatch!`,
        recordId: patientDoc.patientId
      });

      // Audit Log
      await AuditLog.create({
        user: 'SYSTEM_TMDS',
        role: 'System',
        actionType: 'INTEGRITY_VIOLATION',
        targetId: patientDoc.patientId,
        oldValue: patientDoc.recordHash,
        newValue: currentHash
      });
    }
    return false;
  }
  return true;
};

// Middleware: Authenticate and check RBAC role
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token missing or invalid' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tmds_secret');
      req.user = decoded;

      if (!allowedRoles.includes(decoded.role)) {
        // Log unauthorized privilege violation
        AuditLog.create({
          user: decoded.username,
          role: decoded.role,
          actionType: 'PRIVILEGE_VIOLATION',
          ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
          oldValue: decoded.role,
          newValue: `Attempted access to role-protected endpoint. Allowed: ${allowedRoles.join(',')}`
        }).catch(err => console.error('Error creating privilege violation audit log:', err));

        SecurityAlert.create({
          type: 'PRIVILEGE_VIOLATION',
          severity: 'HIGH',
          description: `UNAUTHORIZED ACCESS: User '${decoded.username}' with role '${decoded.role}' attempted operation restricted to roles: [${allowedRoles.join(', ')}].`
        }).catch(err => console.error('Error creating security alert:', err));

        // Save activity log for AI model
        ActivityLog.create({
          user: decoded.username,
          role: decoded.role,
          action: 'UNAUTHORIZED_ATTEMPT',
          isSuccess: false,
          ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1'
        }).catch(err => console.error('Error creating activity log:', err));

        return res.status(403).json({ message: 'Access Denied: Insufficient Permissions' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Session expired or invalid token' });
    }
  };
};

module.exports = {
  generateRecordHash,
  verifyRecordIntegrity,
  checkRole
};
