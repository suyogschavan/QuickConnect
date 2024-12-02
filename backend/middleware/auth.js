const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const secret = process.env.SECRET;

const auth = (req, res, next) => {
  const tokenString = req.headers["authorization"];
  // console.log(token);
  if (!tokenString) {
    return res.status(403).send("A token is required for authentication");
  }

  const parts = tokenString.split(" ");
  const token = parts[1];

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
  } catch (err) {
    return res.status(401).send("Invalid Token");
  }
  return next();
};

module.exports = auth;
