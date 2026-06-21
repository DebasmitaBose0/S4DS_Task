const express = require('express');
const router = express.Router();
const simulationController = require('../controllers/simulationController');

router.post('/unauthorized-modify', simulationController.simulateUnauthorizedModify);
router.post('/record-deletion', simulationController.simulateRecordDeletion);
router.post('/nosql-vuln', simulationController.nosqlInjectionVulnerable);
router.post('/nosql-secured', simulationController.nosqlInjectionSecured);

module.exports = router;
