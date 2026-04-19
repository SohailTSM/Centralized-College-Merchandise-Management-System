const express = require('express');
const router  = express.Router();
const { getAll, getOne, create, update, toggleStatus, getMyClubListings } = require('../controllers/merchandiseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/club/mine',  protect, authorize('club_admin'), getMyClubListings);
router.get('/',           protect, getAll);
router.get('/:id',        protect, getOne);
router.post('/',          protect, authorize('club_admin'), create);
router.put('/:id',        protect, authorize('club_admin'), update);
router.patch('/:id/status', protect, authorize('club_admin'), toggleStatus);

module.exports = router;
