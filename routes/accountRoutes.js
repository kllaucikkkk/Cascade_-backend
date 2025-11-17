const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const verifyToken = require('../middleware/authMiddleware');

// GET /api/accounts (wymaga autoryzacji)
router.get('/', verifyToken, accountController.getAccounts);

// POST /api/accounts (wymaga autoryzacji)
router.post('/', verifyToken, accountController.createAccountValidation, accountController.createAccount);

module.exports = router;
