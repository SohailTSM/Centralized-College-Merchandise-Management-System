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

// @route   GET /api/auth/internal/users/:id
// @desc    Internal route for Fulfillment to fetch basic public user profile
// @access  Internal (No JWT required, assumes safe loopback from API Gateway protection)
router.get('/internal/users/:id', async (req, res, next) => {
  try {
    const UserRepository = require('../repositories/UserRepository');
    const user = await UserRepository.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ _id: user._id, name: user.name, email: user.email, rollNumber: user.rollNumber, mobile: user.mobile, sizeProfile: user.sizeProfile });
  } catch(err) { next(err); }
});

// @route   GET /api/auth/internal/search-students
router.get('/internal/search-students', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);
    const UserRepository = require('../repositories/UserRepository');
    const students = await UserRepository.search(q);
    res.json(students);
  } catch(err) { next(err); }
});

// @route   GET /api/auth/internal/club-managers
router.get('/internal/club-managers', async (req, res, next) => {
  try {
    const UserRepository = require('../repositories/UserRepository');
    res.json(await UserRepository.findAll({ role: 'club_admin' }));
  } catch(err) { next(err); }
});

// @route   POST /api/auth/internal/club-managers
router.post('/internal/club-managers', async (req, res, next) => {
  try {
    const bcrypt = require('bcryptjs');
    const UserRepository = require('../repositories/UserRepository');
    const { name, email, password, clubId } = req.body;
    const existing = await UserRepository.findByEmail(email);
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 12);
    const manager = await UserRepository.create({ name, email, passwordHash, role: 'club_admin', clubId });
    res.status(201).json(manager);
  } catch(err) { next(err); }
});

// @route   DELETE /api/auth/internal/club-managers/:id
router.delete('/internal/club-managers/:id', async (req, res, next) => {
  try {
    const UserRepository = require('../repositories/UserRepository');
    await UserRepository.delete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch(err) { next(err); }
});

// @route   GET /api/auth/internal/students
router.get('/internal/students', async (req, res, next) => {
  try {
    const UserRepository = require('../repositories/UserRepository');
    res.json(await UserRepository.findAll({ role: 'student' }));
  } catch(err) { next(err); }
});

module.exports = router;
