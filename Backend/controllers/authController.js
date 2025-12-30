const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = function (passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://drawexplain-138149752130.europe-west1.run.app'}/api/v1/auth/google/callback`,
      },
      async function (accessToken, refreshToken, profile, cb) {
        try {
          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            user = new User({
              googleId: profile.id,
              email: profile.emails[0].value,
              name: profile.displayName,
            });
            await user.save();
          }

          const payload = {
            user: {
              id: user.id,
            },
          };

          jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" }, (err, token) => {
            if (err) return cb(err);
            return cb(null, { user, token });
          });
        } catch (err) {
          return cb(err);
        }
      }
    )
  );
};

// Middleware to verify JWT token
const authenticateJWT = (req, res, next) => {
  const token = req.header("x-auth-token");

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports.authenticateJWT = authenticateJWT;
