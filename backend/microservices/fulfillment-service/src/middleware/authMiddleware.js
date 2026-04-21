const axios = require('axios');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized to access this route' });
  }

  try {
    // MICROSERVICES EXPERIMENT: Make HTTP call over loopback to Auth Service
    const response = await axios.post('http://localhost:5001/api/auth/internal/verify-token', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    req.user = response.data.user;
    next();
  } catch (error) {
    console.error('Microservice Auth Error:', error.message);
    return res.status(401).json({ message: 'Not authorized to access this route' });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role ${req.user ? req.user.role : 'None'} is not authorized to access this route` 
      });
    }
    next();
  };
};
