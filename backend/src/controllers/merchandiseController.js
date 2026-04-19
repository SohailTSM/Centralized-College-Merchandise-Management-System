const MerchandiseRepository = require('../repositories/MerchandiseRepository');
const { MerchandiseFactory } = require('../patterns/factory/MerchandiseFactory');

// GET /api/merchandise
const getAll = async (req, res, next) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 12;
    const filter = { isActive: true };
    if (req.query.type)   filter.type   = req.query.type;
    if (req.query.clubId) filter.clubId = req.query.clubId;

    const result = await MerchandiseRepository.findAll(filter, page, limit);
    res.json(result);
  } catch (err) { next(err); }
};

// GET /api/merchandise/:id
const getOne = async (req, res, next) => {
  try {
    const item = await MerchandiseRepository.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Merchandise not found' });
    res.json(item);
  } catch (err) { next(err); }
};

// POST /api/merchandise
const create = async (req, res, next) => {
  try {
    if (!req.user.clubId)
      return res.status(400).json({ message: 'Your account is not linked to a club. Ask the central admin to assign you to a club.' });

    const { type, name, description, price, availableSizes, imageUrl } = req.body;

    const product = MerchandiseFactory.create(type, {
      name, description, price, availableSizes, imageUrl,
      clubId: req.user.clubId,
    });

    if (!product.validate())
      return res.status(400).json({ message: 'Invalid merchandise data' });

    const item = await MerchandiseRepository.create(product.toDocument());
    res.status(201).json(item);
  } catch (err) { next(err); }
};

// PUT /api/merchandise/:id
const update = async (req, res, next) => {
  try {
    const item = await MerchandiseRepository.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Merchandise not found' });
    if (String(item.clubId._id || item.clubId) !== String(req.user.clubId))
      return res.status(403).json({ message: 'You can only edit your own club merchandise' });
    const updated = await MerchandiseRepository.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) { next(err); }
};

// PATCH /api/merchandise/:id/status  — toggle isActive (deactivate or reactivate)
const toggleStatus = async (req, res, next) => {
  try {
    const item = await MerchandiseRepository.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Merchandise not found' });
    if (String(item.clubId._id || item.clubId) !== String(req.user.clubId))
      return res.status(403).json({ message: 'Not authorized' });
    const updated = await MerchandiseRepository.update(req.params.id, { isActive: !item.isActive });
    res.json(updated);
  } catch (err) { next(err); }
};

// GET /api/merchandise/club/mine
const getMyClubListings = async (req, res, next) => {
  try {
    // Return all listings (active and inactive) for admin management
    const items = await MerchandiseRepository.findByClub(req.user.clubId, false);
    res.json(items);
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, toggleStatus, getMyClubListings };
