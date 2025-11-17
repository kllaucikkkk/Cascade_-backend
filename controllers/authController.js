const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');

// Walidatory
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .trim(),
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .trim()
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// POST /api/auth/register
const register = async (req, res) => {
  try {
    // Sprawdzenie błędów walidacji
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { email, password, firstName, lastName } = req.body;

    // Sprawdzenie czy email już istnieje
    const [existingUsers] = await db.query(
      'SELECT user_id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        message: 'Email already registered' 
      });
    }

    // Hashowanie hasła (10 rounds - bezpieczne i wydajne)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generowanie UUID dla nowego użytkownika
    const userId = uuidv4();

    // Wstawienie użytkownika do bazy danych
    await db.query(
      'INSERT INTO users (user_id, email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
      [userId, email, hashedPassword, firstName, lastName]
    );

    res.status(201).json({
      userId,
      email,
      message: 'User registered successfully'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Server error during registration' 
    });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    // Sprawdzenie błędów walidacji
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Pobranie użytkownika z bazy danych
    const [users] = await db.query(
      'SELECT user_id, email, password_hash, first_name, last_name FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    const user = users[0];

    // Weryfikacja hasła
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    // Generowanie JWT tokenu (wygasa po 24h)
    const token = jwt.sign(
      { 
        userId: user.user_id, 
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      token,
      userId: user.user_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Server error during login' 
    });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  // W przypadku JWT po stronie serwera logout jest opcjonalny
  // Token wygasa automatycznie lub klient usuwa go z localStorage
  res.status(200).json({ 
    message: 'Logged out successfully' 
  });
};

module.exports = {
  register,
  login,
  logout,
  registerValidation,
  loginValidation
};
