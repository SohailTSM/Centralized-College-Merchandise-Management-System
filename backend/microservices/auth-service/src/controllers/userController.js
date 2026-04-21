const UserRepository = require('../repositories/UserRepository');

// GET /api/users/profile
const getProfile = async (req, res, next) => {
  try {
    const user = await UserRepository.findById(req.user._id);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, sizeProfile } = req.body;
    const updated = await UserRepository.update(req.user._id, {
      ...(name && { name }),
      ...(sizeProfile && { sizeProfile }),
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile };
