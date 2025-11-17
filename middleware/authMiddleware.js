const jwt = require('jsonwebtoken');

// Middleware do weryfikacji JWT tokenu
const verifyToken = (req, res, next) => {
  // Pobranie tokenu z nagłówka Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ 
      message: 'Access denied. No token provided.' 
    });
  }

  try {
    // Weryfikacja tokenu
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Dodanie danych użytkownika do req.user
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    return res.status(403).json({ 
      message: 'Invalid or expired token.' 
    });
  }
};

module.exports = verifyToken;
