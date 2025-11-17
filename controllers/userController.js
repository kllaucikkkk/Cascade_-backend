const db = require('../config/db');

// GET /api/user/profile
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [users] = await db.query(
      `SELECT user_id, email, first_name, last_name, created_at
       FROM users
       WHERE user_id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    const user = users[0];

    res.status(200).json({
      userId: user.user_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      createdAt: user.created_at
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching profile' 
    });
  }
};

module.exports = {
  getUserProfile
};
