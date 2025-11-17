const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');

// Walidator dla tworzenia transakcji
const createTransactionValidation = [
  body('accountId')
    .notEmpty()
    .withMessage('Account ID is required'),
  body('amount')
    .isFloat({ gt: 0 })
    .withMessage('Amount must be greater than 0'),
  body('type')
    .isIn(['deposit', 'withdrawal', 'transfer'])
    .withMessage('Type must be deposit, withdrawal, or transfer'),
  body('category')
    .optional()
    .trim(),
  body('description')
    .optional()
    .trim(),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be in ISO8601 format')
];

// GET /api/transactions (z filtrowaniem przez query params)
const getTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { accountId, fromDate, toDate, type } = req.query;

    // Budowanie zapytania SQL z warunkami filtrowania
    let query = `
      SELECT t.transaction_id, t.account_id, a.account_name, t.amount, t.type, t.category, t.description, t.transaction_date
      FROM transactions t
      JOIN accounts a ON t.account_id = a.account_id
      WHERE a.user_id = ?
    `;
    const params = [userId];

    // Filtrowanie po accountId
    if (accountId) {
      query += ' AND t.account_id = ?';
      params.push(accountId);
    }

    // Filtrowanie po dacie od
    if (fromDate) {
      query += ' AND t.transaction_date >= ?';
      params.push(fromDate);
    }

    // Filtrowanie po dacie do
    if (toDate) {
      query += ' AND t.transaction_date <= ?';
      params.push(toDate);
    }

    // Filtrowanie po typie transakcji
    if (type) {
      query += ' AND t.type = ?';
      params.push(type);
    }

    query += ' ORDER BY t.transaction_date DESC';

    const [transactions] = await db.query(query, params);

    res.status(200).json({
      transactions: transactions.map(tx => ({
        transactionId: tx.transaction_id,
        accountId: tx.account_id,
        accountName: tx.account_name,
        amount: parseFloat(tx.amount),
        type: tx.type,
        category: tx.category,
        description: tx.description,
        date: tx.transaction_date
      }))
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching transactions' 
    });
  }
};

// POST /api/transactions
const createTransaction = async (req, res) => {
  const connection = await db.getConnection();
  
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
    const { accountId, amount, type, category, description, date } = req.body;

    // Rozpoczęcie transakcji (TRANSACTION w bazie danych)
    await connection.beginTransaction();

    // Sprawdzenie czy konto należy do użytkownika
    const [accounts] = await connection.query(
      'SELECT balance FROM accounts WHERE account_id = ? AND user_id = ?',
      [accountId, userId]
    );

    if (accounts.length === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        message: 'Account not found or does not belong to user' 
      });
    }

    const currentBalance = parseFloat(accounts[0].balance);

    // Obliczenie nowego salda
    let newBalance;
    if (type === 'deposit') {
      newBalance = currentBalance + parseFloat(amount);
    } else if (type === 'withdrawal') {
      newBalance = currentBalance - parseFloat(amount);
      
      // Sprawdzenie czy wystarczające środki
      if (newBalance < 0) {
        await connection.rollback();
        return res.status(400).json({ 
          message: 'Insufficient funds' 
        });
      }
    } else if (type === 'transfer') {
      newBalance = currentBalance - parseFloat(amount);
      
      if (newBalance < 0) {
        await connection.rollback();
        return res.status(400).json({ 
          message: 'Insufficient funds for transfer' 
        });
      }
    }

// Utworzenie transakcji
const transactionId = uuidv4();

let transactionDate;
if (date) {
  const d = new Date(date);
  transactionDate = d.toISOString().slice(0, 19).replace('T', ' ');
} else {
  const d = new Date();
  transactionDate = d.toISOString().slice(0, 19).replace('T', ' ');
}

await connection.query(
  `INSERT INTO transactions (transaction_id, account_id, amount, type, category, description, transaction_date)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [transactionId, accountId, amount, type, category, description, transactionDate]
);
    // Commit transakcji
    await connection.commit();

    res.status(201).json({
      transactionId,
      message: 'Transaction created successfully',
      newBalance: newBalance.toFixed(2)
    });

  } catch (error) {
    await connection.rollback();
    console.error('Create transaction error:', error);
    res.status(500).json({ 
      message: 'Server error while creating transaction' 
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getTransactions,
  createTransaction,
  createTransactionValidation
};
