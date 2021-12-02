const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');

module.exports = (req, res, next) => {
  // Proceed without error when method is OPTIONS
  if (req.method === 'OPTIONS') {
    return next();
  }
  // get token data attached to "headers.authorization"
  try {
    // Authorization: 'Bearer TOKEN'
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
      throw new Error('Token does not exist.');
    }
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    // I included token itself to store userId data, which can be used to be stored in "userData".
    req.userData = { userId: decodedToken.userId };
    // continue to next middlewares if this check-auth middleware is passed.
    next();
  } catch (err) {
    const error = new HttpError('Token authentication failed.', 403);
    return next(error);
  }
};
