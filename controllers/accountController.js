const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');

// Walidator dla tworzenia konta
const createAccountValidation = [
  body('accountName')
    .notEmpty()
    .withMessage('Account name is required')
    .trim(),
  body('accountType')
    .notEmpty()
    .withMessage('Account type is required'),
  body('initialBalance')
    .isFloat({ min: 0 })
    .withMessage('Initial balance must be a positive number'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code')
];

// GET /api/accounts
const getAccounts = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [accounts] = await db.query(
      `SELECT account_id, account_name, account_type, balance, currency, is_verified, created_at
       FROM accounts
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    res.status(200).json({
      accounts: accounts.map(acc => ({
        accountId: acc.account_id,
        accountName: acc.account_name,
        accountType: acc.account_type,
        balance: parseFloat(acc.balance),
        currency: acc.currency,
        isVerified: acc.is_verified === 1,
        createdAt: acc.created_at
      }))
    });

  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching accounts' 
    });
  }
};

// POST /api/accounts
const createAccount = async (req, res) => {
  try {
    // Sprawdzenie błędów walidacji
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const userId = req.user.userId;
    const { accountName, accountType, initialBalance, currency = 'PLN' } = req.body;

    const accountId = uuidv4();

    await db.query(
      `INSERT INTO accounts (account_id, user_id, account_name, account_type, balance, currency, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [accountId, userId, accountName, accountType, initialBalance, currency, true]
    );

    res.status(201).json({
      accountId,
      accountName,
      message: 'Account created successfully'
    });

  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ 
      message: 'Server error while creating account' 
    });
  }
};

module.exports = {
  getAccounts,
  createAccount,
  createAccountValidation
};
