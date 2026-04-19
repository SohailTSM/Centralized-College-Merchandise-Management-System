/**
 * Central Admin Controller
 * Only accessible to users with role = 'central_admin'
 * Handles: create/manage clubs, create club manager accounts
 */
const bcrypt = require('bcryptjs');
const UserRepository  = require('../repositories/UserRepository');
const ClubRepository  = require('../repositories/ClubRepository');

// ─── Clubs ────────────────────────────────────────────────────────────────────

// GET /api/admin/clubs
const getAllClubs = async (req, res, next) => {
  try {
    const clubs = await ClubRepository.findAll();
    res.json(clubs);
  } catch (err) { next(err); }
};

// POST /api/admin/clubs
const createClub = async (req, res, next) => {
  try {
    const { name, description, logoUrl } = req.body;
    if (!name) return res.status(400).json({ message: 'Club name is required' });
    // adminId placeholder — will be set when creating the club manager
    const club = await ClubRepository.create({
      name,
      description: description || '',
      logoUrl: logoUrl || '',
      adminId: req.user._id, // temporarily set to central_admin, updated when club manager is created
    });
    res.status(201).json(club);
  } catch (err) { next(err); }
};

// PUT /api/admin/clubs/:id
const updateClub = async (req, res, next) => {
  try {
    const club = await ClubRepository.update(req.params.id, req.body);
    if (!club) return res.status(404).json({ message: 'Club not found' });
    res.json(club);
  } catch (err) { next(err); }
};

// DELETE /api/admin/clubs/:id
const deleteClub = async (req, res, next) => {
  try {
    await ClubRepository.delete(req.params.id);
    res.json({ message: 'Club deleted' });
  } catch (err) { next(err); }
};

// ─── Club Managers ─────────────────────────────────────────────────────────────

// GET /api/admin/club-managers
const getAllClubManagers = async (req, res, next) => {
  try {
    const managers = await UserRepository.findAll({ role: 'club_admin' });
    res.json(managers);
  } catch (err) { next(err); }
};

// POST /api/admin/club-managers  — create a club manager for an existing club
const createClubManager = async (req, res, next) => {
  try {
    const { name, email, password, clubId } = req.body;
    if (!name || !email || !password || !clubId)
      return res.status(400).json({ message: 'name, email, password, and clubId are required' });

    const existing = await UserRepository.findByEmail(email);
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const club = await ClubRepository.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    const passwordHash = await bcrypt.hash(password, 12);
    const manager = await UserRepository.create({
      name,
      email,
      passwordHash,
      role: 'club_admin',
      clubId,
    });

    // Update club's adminId to this manager
    await ClubRepository.update(clubId, { adminId: manager._id });

    res.status(201).json({ _id: manager._id, name: manager.name, email: manager.email, clubId: manager.clubId });
  } catch (err) { next(err); }
};

// DELETE /api/admin/club-managers/:id
const deleteClubManager = async (req, res, next) => {
  try {
    await UserRepository.delete(req.params.id);
    res.json({ message: 'Club manager deleted' });
  } catch (err) { next(err); }
};

// GET /api/admin/students
const getAllStudents = async (req, res, next) => {
  try {
    const students = await UserRepository.findAll({ role: 'student' });
    res.json(students);
  } catch (err) { next(err); }
};

module.exports = {
  getAllClubs, createClub, updateClub, deleteClub,
  getAllClubManagers, createClubManager, deleteClubManager,
  getAllStudents,
};
