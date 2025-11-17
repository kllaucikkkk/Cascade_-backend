const db = require('../config/db');

// GET /api/dashboard/overview
const getDashboardOverview = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Pobranie wszystkich kont użytkownika
    const [accounts] = await db.query(
      `SELECT account_id, account_name, balance, currency 
       FROM accounts 
       WHERE user_id = ?`,
      [userId]
    );

    // Obliczenie total balance (suma wszystkich kont)
    const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);

    // Pobranie ostatniej aktywności (5 najnowszych transakcji)
    const [recentTransactions] = await db.query(
      `SELECT t.transaction_id, t.amount, t.type, t.description, t.transaction_date, a.account_name
       FROM transactions t
       JOIN accounts a ON t.account_id = a.account_id
       WHERE a.user_id = ?
       ORDER BY t.transaction_date DESC
       LIMIT 5`,
      [userId]
    );

    // Mapowanie transakcji do formatu "recent activity"
    const recentActivity = recentTransactions.map(tx => ({
      activityId: tx.transaction_id,
      type: 'transaction',
      description: tx.description || tx.type,
      amount: parseFloat(tx.amount),
      date: tx.transaction_date
    }));

    res.status(200).json({
      totalBalance: totalBalance.toFixed(2),
      currency: 'PLN',
      accounts: accounts.map(acc => ({
        accountId: acc.account_id,
        accountName: acc.account_name,
        balance: parseFloat(acc.balance),
        currency: acc.currency
      })),
      recentActivity
    });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching dashboard data' 
    });
  }
};

module.exports = {
  getDashboardOverview
};
