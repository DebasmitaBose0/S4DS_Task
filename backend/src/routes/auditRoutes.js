const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { checkRole } = require('../security/tmdsFramework');

router.get('/', checkRole(['Admin']), auditController.getAuditLogs);

module.exports = router;
