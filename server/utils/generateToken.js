const jwt = require('jsonwebtoken');

const generateToken = (res, userId) => {
  const token = jwt.sign(
    { userId }, // This is the payload
    process.env.JWT_SECRET, // Your secret key from .env
    { expiresIn: '30d' } // Token expires in 30 days
  );

  // Note: We are not using cookies here for simplicity in a MERN stack.
  // We will send the token back in the JSON response.
  return token;
};

module.exports = generateToken;