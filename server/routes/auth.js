console.log("AUTH ROUTES FILE LOADED");
const express = require("express");
const bcrypt = require("bcrypt");

const router = express.Router();

// In-memory user store (Phase 1)
const usersByUsername = new Map();
let nextUserId = 1;

function normalizeUsername(u) {
  return typeof u === "string" ? u.trim() : "";
}

router.post("/signup", async (req, res) => {
  req.telemetry.event_type = "signup_attempt";

  try {
    const username = normalizeUsername(req.body && req.body.username);
    const password =
      typeof (req.body && req.body.password) === "string" ? req.body.password : "";

    if (username.length < 3) {
      req.telemetry.result = "failure";
      req.telemetry.reason = "username_too_short";
      return res.status(400).json({ ok: false, error: "username must be at least 3 characters" });
    }

    if (password.length < 6) {
      req.telemetry.result = "failure";
      req.telemetry.reason = "password_too_short";
      return res.status(400).json({ ok: false, error: "password must be at least 6 characters" });
    }

    if (usersByUsername.has(username)) {
      req.telemetry.result = "failure";
      req.telemetry.reason = "username_taken";
      return res.status(409).json({ ok: false, error: "username already exists" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = { id: String(nextUserId++), username, password_hash };
    usersByUsername.set(username, user);

    req.telemetry.result = "success";
    req.telemetry.reason = "created";
    return res.status(201).json({ ok: true, user_id: user.id, username: user.username });
  } catch (e) {
    req.telemetry.result = "failure";
    req.telemetry.reason = "server_error";
    return res.status(500).json({ ok: false, error: "internal error" });
  }
});

router.post("/login", async (req, res) => {
  req.telemetry.event_type = "login_attempt";

  try {
    const username = normalizeUsername(req.body && req.body.username);
    const password =
      typeof (req.body && req.body.password) === "string" ? req.body.password : "";

    const user = usersByUsername.get(username);
    if (!user) {
      req.telemetry.result = "failure";
      req.telemetry.reason = "no_such_user";
      return res.status(401).json({ ok: false, error: "invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      req.telemetry.result = "failure";
      req.telemetry.reason = "bad_password";
      return res.status(401).json({ ok: false, error: "invalid credentials" });
    }

    req.session.user_id = user.id;
    req.session.username = user.username;

    req.telemetry.result = "success";
    return res.json({ ok: true, user_id: user.id, username: user.username });
  } catch (e) {
    req.telemetry.result = "failure";
    req.telemetry.reason = "server_error";
    return res.status(500).json({ ok: false, error: "internal error" });
  }
});

router.post("/logout", (req, res) => {
  req.telemetry.event_type = "logout";

  if (!req.session) {
    req.telemetry.result = "failure";
    req.telemetry.reason = "no_session";
    return res.status(200).json({ ok: true });
  }

  req.session.destroy((err) => {
    if (err) {
      req.telemetry.result = "failure";
      req.telemetry.reason = "destroy_failed";
      return res.status(500).json({ ok: false, error: "logout failed" });
    }

    req.telemetry.result = "success";
    req.telemetry.reason = "destroyed";
    return res.json({ ok: true });
  });
});

module.exports = router;
