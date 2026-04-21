const express = require('express');
const router  = express.Router();
const { placeOrder, getMyOrders, getClubOrders, updateStatus } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/',                protect, authorize('student'), placeOrder);
router.get('/my',               protect, authorize('student'), getMyOrders);
router.get('/',                 protect, authorize('club_admin'), getClubOrders);
router.patch('/:id/status',     protect, authorize('club_admin'), updateStatus);

module.exports = router;
