const express = require('express');
const router  = express.Router();
const {
  getAllClubs, createClub, updateClub, deleteClub,
  getAllClubManagers, createClubManager, deleteClubManager,
  getAllStudents,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const adminOnly = [protect, authorize('central_admin')];

router.get('/clubs',               ...adminOnly, getAllClubs);
router.post('/clubs',              ...adminOnly, createClub);
router.put('/clubs/:id',           ...adminOnly, updateClub);
router.delete('/clubs/:id',        ...adminOnly, deleteClub);

router.get('/club-managers',       ...adminOnly, getAllClubManagers);
router.post('/club-managers',      ...adminOnly, createClubManager);
router.delete('/club-managers/:id',...adminOnly, deleteClubManager);

router.get('/students',            ...adminOnly, getAllStudents);

module.exports = router;
