const express = require('express');
const router = express.Router();
const alertController = require('../controllers/auditController'); // using alert handlers inside auditController
const { checkRole } = require('../security/tmdsFramework');

router.get('/', checkRole(['Admin']), alertController.getAlerts);
router.put('/:id/resolve', checkRole(['Admin']), alertController.resolveAlert);

module.exports = router;
