const jwt = require("jsonwebtoken");
const UserModel = require("../models/User.model");

function isAuthenticated(req, res, next) {
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer" &&
    req.headers.authorization.split(" ")[1]
  ) {
    const theTokenInHeaders = req.headers.authorization.split(" ")[1];
    try {
      const decodedToken = jwt.verify(
        theTokenInHeaders,
        process.env.TOKEN_SECRET
      );
      req.payload = decodedToken;
      next();
    } catch (error) {
      res.status(403).json({ errorMessage: "Invalid Token" });
    }
  } else {
    res.status(403).json({ errorMessage: "Headers Malformed" });
  }
}

// Middleware to check if user is an Admin
async function isAdmin(req, res, next) {
  try {
    const user = await UserModel.findById(req.payload._id);
    if (!user) {
      return res.status(404).json({ errorMessage: "User not found" });
    }
    if (user.role !== "Admin") {
      return res.status(403).json({ errorMessage: "Access denied. Admin privileges required." });
    }
    next();
  } catch (error) {
    res.status(500).json({ errorMessage: "Error checking admin status" });
  }
}

module.exports = { isAuthenticated, isAdmin };
