// backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// MVP: kreira prvog admina (radi samo ako nema nijednog usera)
router.post("/seed-admin", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "Fali username/password" });

  const count = await User.countDocuments();
  if (count > 0) return res.status(400).json({ error: "Admin već postoji" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, passwordHash, role: "admin" });

  res.json({ ok: true, id: user._id, username: user.username });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "Fali username/password" });

  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ error: "Pogrešan login" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Pogrešan login" });

  const token = jwt.sign(
    { id: user._id.toString(), username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token, user: { username: user.username, role: user.role } });
});

module.exports = router;
