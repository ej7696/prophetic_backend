const jwt = require("jsonwebtoken");

module.exports.verifyConsultantToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res
      .status(403)
      .json({ status: "error", message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(
      token.split(" ")[1],
      process.env.CONSULTANT_SECRET
    );

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ status: "error", message: "Invalid token." });
  }
};
