const express = require('express');
const router  = express.Router();
const { getAll, getMySlots, create, update, getSlotOrders, searchStudents, getMerchWithOrders } = require('../controllers/deliveryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/search-students',      protect, authorize('club_admin'), searchStudents);
router.get('/merch-with-orders',    protect, authorize('club_admin'), getMerchWithOrders);
router.get('/mine',                 protect, authorize('club_admin'), getMySlots);
router.get('/:id/orders',           protect, authorize('club_admin'), getSlotOrders);
router.get('/',                     protect, getAll);
router.post('/',                    protect, authorize('club_admin'), create);
router.put('/:id',                  protect, authorize('club_admin'), update);

module.exports = router;
