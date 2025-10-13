const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const userController = require("../controllers/userController");
const { authenticateJWT } = require("../controllers/authController");
const authRouter = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

authRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

authRouter.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  function (req, res) {
    const token = jwt.sign({ user: { id: req.user.id } }, JWT_SECRET, { expiresIn: "1d" });
    res.redirect(`${process.env.FRONTEND_URL || 'https://drawexplain-74788697407.europe-west1.run.app'}/auth-callback?token=${token}`);
  }
);

authRouter.post("/register", userController.registerUser);

authRouter.post("/login", userController.loginUser);

// New route to verify JWT token
authRouter.get("/verify", authenticateJWT, (req, res) => {
  res.json({ user: req.user });
});

module.exports = authRouter;
