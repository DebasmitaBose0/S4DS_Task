const Patient = require('../models/Patient');
const AuditLog = require('../models/AuditLog');
const ActivityLog = require('../models/ActivityLog');
const { generateRecordHash, verifyRecordIntegrity } = require('../security/tmdsFramework');

exports.getPatients = async (req, res) => {
  try {
    const patients = await Patient.find({});
    
    // Check integrity on every read operation
    for (let patient of patients) {
      // In Javascript, mongoose objects are document models, so we can run our verification
      await verifyRecordIntegrity(patient);
    }

    // Refresh patients list to reflect any newly flagged tampering
    const refreshedPatients = await Patient.find({});
    res.json(refreshedPatients);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch patients', error: error.message });
  }
};

exports.getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    await verifyRecordIntegrity(patient);
    const refreshed = await Patient.findById(req.params.id);
    res.json(refreshed);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch patient details' });
  }
};

exports.createPatient = async (req, res) => {
  try {
    const { patientId, fullName, age, gender, bloodGroup, allergies, diagnosis, prescription, doctorName } = req.body;
    
    const existing = await Patient.findOne({ patientId });
    if (existing) {
      return res.status(400).json({ message: 'Patient ID already exists' });
    }

    const lastUpdated = new Date().toISOString();
    
    // Build patient data structure
    const tempPatient = {
      patientId,
      fullName,
      age: Number(age),
      gender,
      bloodGroup,
      allergies: allergies || '',
      diagnosis: diagnosis || '',
      prescription: prescription || '',
      doctorName,
      lastUpdated
    };

    // Calculate SHA-256 cryptographic integrity hash
    tempPatient.recordHash = generateRecordHash(tempPatient);

    const newPatient = await Patient.create(tempPatient);

    // Audit Log
    await AuditLog.create({
      user: req.user.username,
      role: req.user.role,
      actionType: 'PATIENT_CREATE',
      targetId: patientId,
      newValue: JSON.stringify(tempPatient)
    });

    await ActivityLog.create({
      user: req.user.username,
      role: req.user.role,
      action: 'CREATE',
      isSuccess: true,
      ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1'
    });

    res.status(201).json(newPatient);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create patient', error: error.message });
  }
};

exports.updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, age, gender, bloodGroup, allergies, diagnosis, prescription, doctorName } = req.body;

    const patient = await Patient.findById(id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    // Store old values for detailed audit log
    const oldValues = {
      fullName: patient.fullName,
      age: patient.age,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      allergies: patient.allergies,
      diagnosis: patient.diagnosis,
      prescription: patient.prescription,
      doctorName: patient.doctorName
    };

    // Update patient fields
    patient.fullName = fullName || patient.fullName;
    patient.age = age ? Number(age) : patient.age;
    patient.gender = gender || patient.gender;
    patient.bloodGroup = bloodGroup || patient.bloodGroup;
    patient.allergies = allergies !== undefined ? allergies : patient.allergies;
    patient.diagnosis = diagnosis !== undefined ? diagnosis : patient.diagnosis;
    patient.prescription = prescription !== undefined ? prescription : patient.prescription;
    patient.doctorName = doctorName || patient.doctorName;
    patient.lastUpdated = new Date().toISOString();
    patient.isTampered = false; // Reset tamper flag on official doctor update
    patient.tamperedFields = [];

    // Recalculate hash because this is a legitimate update
    patient.recordHash = generateRecordHash(patient);

    const updated = await patient.save();

    // Audit Log
    await AuditLog.create({
      user: req.user.username,
      role: req.user.role,
      actionType: 'PATIENT_UPDATE',
      targetId: patient.patientId,
      oldValue: JSON.stringify(oldValues),
      newValue: JSON.stringify({
        fullName: patient.fullName,
        age: patient.age,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup,
        allergies: patient.allergies,
        diagnosis: patient.diagnosis,
        prescription: patient.prescription,
        doctorName: patient.doctorName
      })
    });

    await ActivityLog.create({
      user: req.user.username,
      role: req.user.role,
      action: 'UPDATE',
      isSuccess: true,
      ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1'
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update patient', error: error.message });
  }
};

exports.deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    await Patient.findByIdAndDelete(req.params.id);

    // Audit Log
    await AuditLog.create({
      user: req.user.username,
      role: req.user.role,
      actionType: 'PATIENT_DELETE',
      targetId: patient.patientId,
      oldValue: JSON.stringify(patient)
    });

    await ActivityLog.create({
      user: req.user.username,
      role: req.user.role,
      action: 'DELETE',
      isSuccess: true,
      ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1'
    });

    res.json({ message: 'Patient record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete patient' });
  }
};
