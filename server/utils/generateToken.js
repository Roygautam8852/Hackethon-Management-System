const jwt = require("jsonwebtoken");

const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || "hacklytics_dev_secret_key_12345";
  return jwt.sign({ id: userId }, secret, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

module.exports = generateToken;
