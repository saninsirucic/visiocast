const jwt = require("jsonwebtoken");

// Provjeri token i ubaci user u req.user
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Nema tokena" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // npr { id, username, role }
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Nevažeći token" });
  }
}

// Dozvoli samo određenu rolu
function requireRole(role) {
  return (req, res, next) => {
    const userRole = req.user?.role;
    if (userRole !== role) {
      return res.status(403).json({ message: "Zabranjeno (nema prava)" });
    }
    return next();
  };
}

module.exports = { auth, requireRole };
