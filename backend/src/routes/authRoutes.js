const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { checkRole } = require('../security/tmdsFramework');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/users', checkRole(['Admin']), authController.getUsers);

module.exports = router;
