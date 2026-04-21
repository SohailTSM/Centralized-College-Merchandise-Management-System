const express = require('express');
const router  = express.Router();
const { getAllClubs } = require('../controllers/adminController');

// @route   GET /api/clubs
// @desc    Get all active clubs (Public/Student view)
// @access  Public
router.get('/', getAllClubs);

module.exports = router;
