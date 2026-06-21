const { getModel } = require('../config/db');

const PatientSchema = {
  patientId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  allergies: { type: String, default: '' },
  diagnosis: { type: String, default: '' },
  prescription: { type: String, default: '' },
  doctorName: { type: String, required: true },
  lastUpdated: { type: String },
  recordHash: { type: String },
  isTampered: { type: Boolean, default: false },
  tamperedFields: { type: [String], default: [] }
};

module.exports = getModel('Patient', PatientSchema);
