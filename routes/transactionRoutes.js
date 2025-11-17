const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const verifyToken = require('../middleware/authMiddleware');

// GET /api/transactions (wymaga autoryzacji, z query params)
router.get('/', verifyToken, transactionController.getTransactions);

// POST /api/transactions (wymaga autoryzacji)
router.post('/', verifyToken, transactionController.createTransactionValidation, transactionController.createTransaction);

module.exports = router;
