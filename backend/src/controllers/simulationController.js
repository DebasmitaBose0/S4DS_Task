const Patient = require('../models/Patient');
const AuditLog = require('../models/AuditLog');
const SecurityAlert = require('../models/SecurityAlert');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');

// Attack 1: Direct DB bypass edit (does NOT update recordHash)
exports.simulateUnauthorizedModify = async (req, res) => {
  try {
    const { patientId, fieldToTamper, newValue } = req.body;

    const patient = await Patient.findOne({ patientId });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const oldValue = patient[fieldToTamper];

    // Modify the patient field DIRECTLY in DB (simulating direct SQL/NoSQL update bypass)
    // We bypass generateRecordHash() to simulate database tampering!
    const updateObj = {};
    updateObj[fieldToTamper] = newValue;
    updateObj.lastUpdated = new Date().toISOString();

    const tamperedPatient = await Patient.findByIdAndUpdate(patient._id, updateObj, { new: true });

    // Note: We intentionally DO NOT update the patient.recordHash.
    // The next time the record is read/queried, the integrity check will fail!
    
    // Log the tampering incident in AuditLog
    await AuditLog.create({
      user: 'ATTACKER_SIMULATOR',
      role: 'Attacker',
      actionType: 'TAMPER_UNAUTHORIZED_MODIFY',
      targetId: patientId,
      oldValue: `${fieldToTamper}: ${oldValue}`,
      newValue: `${fieldToTamper}: ${newValue} (HASH NOT UPDATED)`
    });

    res.json({
      message: 'Database tampered successfully. Hash integrity signature is now broken.',
      before: { field: fieldToTamper, value: oldValue, hash: patient.recordHash },
      after: { field: fieldToTamper, value: newValue, hash: patient.recordHash } // Hash remains the same
    });
  } catch (error) {
    res.status(500).json({ message: 'Tampering simulation failed', error: error.message });
  }
};

// Attack 3: Record Deletion Attack
exports.simulateRecordDeletion = async (req, res) => {
  try {
    const { patientId } = req.body;

    const patient = await Patient.findOne({ patientId });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    await Patient.findByIdAndDelete(patient._id);

    // Create immediate Security Alert
    await SecurityAlert.create({
      type: 'TAMPERING',
      severity: 'HIGH',
      description: `RECORD DELETION DETECTED: Patient record ${patient.fullName} (ID: ${patientId}) was deleted from the database.`,
      recordId: patientId
    });

    // Create Audit Log
    await AuditLog.create({
      user: 'ATTACKER_SIMULATOR',
      role: 'Attacker',
      actionType: 'TAMPER_RECORD_DELETED',
      targetId: patientId,
      oldValue: JSON.stringify(patient),
      newValue: 'NULL (Deleted)'
    });

    res.json({
      message: 'Patient record deleted (attack simulation completed). Alert raised.',
      deletedRecord: patient
    });
  } catch (error) {
    res.status(500).json({ message: 'Deletion simulation failed' });
  }
};

// Attack 4: NoSQL Injection Authentication Bypass Demo
// Vulnerable version allows query operator injection
exports.nosqlInjectionVulnerable = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Vulnerable Mongo query structure:
    // If username is { "$gt": "" }, it evaluates to true for any non-empty username.
    const query = { username, password };
    
    // In Mongoose / MongoDB: If the inputs are objects containing operators, Mongoose executes them.
    // To simulate without actual Mongo errors, if username/password are objects, we simulate the bypass
    let authenticatedUser = null;
    
    if (typeof username === 'object' || typeof password === 'object') {
      // Mocking successful injection search. Returns first Admin user in the system
      const users = await User.find({});
      const admin = users.find(u => u.role === 'Admin') || users[0];
      authenticatedUser = admin;
    } else {
      // Safe matching (normal login)
      const user = await User.findOne({ username });
      if (user && user.password === password) { // simple text match for mock demonstration
        authenticatedUser = user;
      }
    }

    if (authenticatedUser) {
      // Create Alert
      await SecurityAlert.create({
        type: 'INJECTION_ATTACK',
        severity: 'CRITICAL',
        description: `NoSQL INJECTION DETECTED: Successful authentication bypass attempt on login query. Payload: ${JSON.stringify(req.body)}`,
        recordId: 'auth_bypass'
      });

      return res.json({
        success: true,
        message: 'AUTHENTICATION BYPASSED! Admin rights obtained.',
        user: { username: authenticatedUser.username, role: authenticatedUser.role }
      });
    }

    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Secured version: Forces parameters to strings and blocks query operators
exports.nosqlInjectionSecured = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Prevention Layer: Force inputs to string
    const safeUsername = String(username || '');
    const safePassword = String(password || '');

    // Sanitization: Block MongoDB operators (keys starting with $)
    if (
      (typeof username === 'object' && JSON.stringify(username).includes('$')) ||
      (typeof password === 'object' && JSON.stringify(password).includes('$'))
    ) {
      await SecurityAlert.create({
        type: 'INJECTION_ATTACK',
        severity: 'HIGH',
        description: `BLOCKED NoSQL INJECTION: Blocked malicious query operators in login payload.`,
        recordId: 'auth_block'
      });
      return res.status(400).json({ success: false, message: 'Malicious inputs blocked by TMDS Sanitization Layer.' });
    }

    const user = await User.findOne({ username: safeUsername });
    // In actual app we compare hashed password, but let's mock validation
    if (user && username === user.username) {
      // (This is just an educational secure comparator)
      return res.json({ success: true, user: { username: user.username, role: user.role } });
    }

    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
