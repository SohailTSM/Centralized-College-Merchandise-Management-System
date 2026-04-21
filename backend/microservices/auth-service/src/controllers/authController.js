const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/UserRepository');
const { UserProfileBuilder } = require('../patterns/builder/UserProfileBuilder');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// POST /api/auth/register  — STUDENTS ONLY
const register = async (req, res, next) => {
  try {
    const { name, email, password, rollNumber, mobile, sizeProfile } = req.body;

    const existing = await UserRepository.findByEmail(email);
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const profile = new UserProfileBuilder()
      .setName(name)
      .setEmail(email)
      .setSizeProfile(sizeProfile || {})
      .build();

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await UserRepository.create({
      name: profile.name,
      email: profile.email,
      passwordHash,
      role: 'student',          // registration is always student
      sizeProfile: profile.sizeProfile,
      rollNumber: rollNumber || '',
      mobile: mobile || '',
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      rollNumber: user.rollNumber,
      mobile: user.mobile,
      sizeProfile: user.sizeProfile,
      token: generateToken(user._id),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await UserRepository.findByEmail(email);
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: 'Invalid email or password' });

    res.json({
      _id:        user._id,
      name:       user.name,
      email:      user.email,
      role:       user.role,
      clubId:     user.clubId,
      rollNumber: user.rollNumber,
      mobile:     user.mobile,
      sizeProfile: user.sizeProfile,
      token: generateToken(user._id),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json(req.user);
};

// PUT /api/auth/change-password  (all roles)
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'currentPassword and newPassword are required' });
    if (newPassword.length < 6)
      return res.status(400).json({ message: 'New password must be at least 6 characters' });

    const user = await UserRepository.findByIdWithPassword(req.user._id);
    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) return res.status(401).json({ message: 'Current password is incorrect' });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await UserRepository.update(req.user._id, { passwordHash });
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, changePassword };
