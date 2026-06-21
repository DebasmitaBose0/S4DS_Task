const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { checkRole } = require('../security/tmdsFramework');

router.get('/', checkRole(['Admin', 'Doctor', 'Receptionist']), patientController.getPatients);
router.get('/:id', checkRole(['Admin', 'Doctor', 'Receptionist']), patientController.getPatientById);
router.post('/', checkRole(['Admin', 'Doctor', 'Receptionist']), patientController.createPatient);
router.put('/:id', checkRole(['Admin', 'Doctor']), patientController.updatePatient);
router.delete('/:id', checkRole(['Admin', 'Doctor']), patientController.deletePatient);

module.exports = router;
