const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require('../middleware/authMiddleware');

// POST /api/auth/register
router.post('/register', authController.registerValidation, authController.register);

// POST /api/auth/login
router.post('/login', authController.loginValidation, authController.login);

// POST /api/auth/logout (wymaga autoryzacji)
router.post('/logout', verifyToken, authController.logout);

module.exports = router;
