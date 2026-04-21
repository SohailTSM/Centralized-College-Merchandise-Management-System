const express = require('express');
const router  = express.Router();
const { register, login, getMe, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register',         register);
router.post('/login',            login);
router.get('/me',                protect, getMe);
router.put('/change-password',   protect, changePassword);

// @route   POST /api/auth/internal/verify-token
// @desc    Internal route for other microservices to decode JWT over the network
// @access  Internal
router.post('/internal/verify-token', protect, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
