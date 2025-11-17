const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const verifyToken = require('../middleware/authMiddleware');

// GET /api/dashboard/overview (wymaga autoryzacji)
router.get('/overview', verifyToken, dashboardController.getDashboardOverview);

module.exports = router;
