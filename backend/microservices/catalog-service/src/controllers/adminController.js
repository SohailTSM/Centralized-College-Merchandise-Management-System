/**
 * Central Admin Controller
 * Only accessible to users with role = 'central_admin'
 * Handles: create/manage clubs, create club manager accounts
 */
const ClubRepository  = require('../repositories/ClubRepository');
const axios           = require('axios');

// ─── Clubs ────────────────────────────────────────────────────────────────────

// GET /api/admin/clubs
const getAllClubs = async (req, res, next) => {
  try {
    const rawClubs = await ClubRepository.findAll();
    
    let managersMap = {};
    try {
      const authRes = await axios.get('http://localhost:5001/api/auth/internal/club-managers');
      const managers = authRes.data;
      managersMap = managers.reduce((acc, mgr) => {
        acc[mgr._id] = { _id: mgr._id, name: mgr.name, email: mgr.email };
        return acc;
      }, {});
    } catch(e) {}

    const stitchedClubs = rawClubs.map(club => {
      // Map back to adminId just like Mongoose populate used to
      return { ...club, adminId: managersMap[club.adminId] || club.adminId };
    });

    res.json(stitchedClubs);
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
    const authRes = await axios.get('http://localhost:5001/api/auth/internal/club-managers');
    res.json(authRes.data);
  } catch (err) { next(err); }
};

// POST /api/admin/club-managers  — create a club manager for an existing club
const createClubManager = async (req, res, next) => {
  try {
    const { name, email, password, clubId } = req.body;
    if (!name || !email || !password || !clubId)
      return res.status(400).json({ message: 'name, email, password, and clubId are required' });

    const club = await ClubRepository.findById(clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    // Let the Auth Service create the user and hash the password
    let manager;
    try {
      const authRes = await axios.post('http://localhost:5001/api/auth/internal/club-managers', { name, email, password, clubId });
      manager = authRes.data;
    } catch(err) {
      return res.status(err.response?.status || 500).json({ message: err.response?.data?.message || 'Error creating manager on Auth Service' });
    }

    // Update club's adminId to this manager
    await ClubRepository.update(clubId, { adminId: manager._id });

    res.status(201).json({ _id: manager._id, name: manager.name, email: manager.email, clubId: manager.clubId });
  } catch (err) { next(err); }
};

// DELETE /api/admin/club-managers/:id
const deleteClubManager = async (req, res, next) => {
  try {
    await axios.delete(`http://localhost:5001/api/auth/internal/club-managers/${req.params.id}`);
    res.json({ message: 'Club manager deleted' });
  } catch (err) { next(err); }
};

// GET /api/admin/students
const getAllStudents = async (req, res, next) => {
  try {
    const authRes = await axios.get('http://localhost:5001/api/auth/internal/students');
    res.json(authRes.data);
  } catch (err) { next(err); }
};

module.exports = {
  getAllClubs, createClub, updateClub, deleteClub,
  getAllClubManagers, createClubManager, deleteClubManager,
  getAllStudents,
};
