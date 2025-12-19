// =====================================================================================
// AUTH ROUTES (signup / login / logout)
// =====================================================================================
//
// 
//
// What this file does :
// 1) Creates an Express "router" that holds 3 endpoints:
//    - POST /signup  -> create a new user (in memory)
//    - POST /login   -> verify credentials + create a session
//    - POST /logout  -> destroy the session
//
// Who is this for?
// - People learning web auth basics
// - People who want to see how telemetry/logging fields can be set per request
//
// IMPORTANT LIMITATION (Phase 1):
// - Users are stored in memory (Map). If the server restarts, all users are gone.
// - This is for learning / labs, not production persistence.
//
// Example usage (PowerShell):
// - Signup:
//   $body = @{ username="demoUser"; password="demoPass123" } | ConvertTo-Json
//   curl.exe -i -X POST http://localhost:3000/signup -H "Content-Type: application/json" --data-raw $body
//
// - Login:
//   $body = @{ username="demoUser"; password="demoPass123" } | ConvertTo-Json
//   curl.exe -i -X POST http://localhost:3000/login -H "Content-Type: application/json" --data-raw $body
//
// - Logout:
//   curl.exe -i -X POST http://localhost:3000/logout
//
// =====================================================================================

console.log("AUTH ROUTES FILE LOADED");

const express = require("express");
const bcrypt = require("bcrypt");

const router = express.Router();

// -------------------------------------------------------------------------------------
// In-memory user store (Phase 1)
// -------------------------------------------------------------------------------------
// usersByUsername:
// - Key: username (string)
// - Value: user object { id, username, password_hash }
//
// nextUserId:
// - Simple counter to assign unique IDs (as strings) to new users.
const usersByUsername = new Map();
let nextUserId = 1;

// -------------------------------------------------------------------------------------
// normalizeUsername(u)
// -------------------------------------------------------------------------------------
// Goal: take whatever came in and safely convert it into a clean username string.
// - If u is a string: trim spaces ("  bob  " -> "bob")
// - If u is not a string: return an empty string
//
// Why this matters:
// - Prevents errors when req.body.username is missing or not a string
// - Makes validation consistent (length checks behave predictably)
function normalizeUsername(u) {
  return typeof u === "string" ? u.trim() : "";
}

// =====================================================================================
// POST /signup
// =====================================================================================
// Workflow (high-level):
// 1) Mark telemetry: this request is a "signup_attempt"
// 2) Read username + password from JSON body (safely)
// 3) Validate username/password rules
// 4) Check if username already exists
// 5) Hash password using bcrypt
// 6) Store new user in memory
// 7) Return success response (201)
//
// Typical responses:
// - 201 Created (success)
// - 400 Bad Request (validation failures)
// - 409 Conflict (username already exists)
// - 500 Internal Server Error (unexpected issue)
router.post("/signup", async (req, res) => {
  // Telemetry is assumed to be created earlier by middleware.
  // Here we label what kind of event this request represents.
  req.telemetry.event_type = "signup_attempt";

  try {
    // Pull inputs from body, but do it defensively.
    // - username is normalized (trim + ensure string)
    // - password must be a string, otherwise becomes ""
    const username = normalizeUsername(req.body && req.body.username);
    const password =
      typeof (req.body && req.body.password) === "string" ? req.body.password : "";

    // Rule: username must be at least 3 characters
    // If it fails, we set telemetry fields and return a helpful error.
    if (username.length < 3) {
      req.telemetry.result = "failure";
      req.telemetry.reason = "username_too_short";
      return res.status(400).json({ ok: false, error: "username must be at least 3 characters" });
    }

    // Rule: password must be at least 6 characters
    if (password.length < 6) {
      req.telemetry.result = "failure";
      req.telemetry.reason = "password_too_short";
      return res.status(400).json({ ok: false, error: "password must be at least 6 characters" });
    }

    // Ensure usernames are unique
    // - If this username is already in the Map, we block creation.
    if (usersByUsername.has(username)) {
      req.telemetry.result = "failure";
      req.telemetry.reason = "username_taken";
      return res.status(409).json({ ok: false, error: "username already exists" });
    }

    // Hashing the password:
    // - bcrypt.hash(password, 10) uses a cost factor of 10
    // - Storing hashes (not plain passwords) is a basic security practice
    const password_hash = await bcrypt.hash(password, 10);

    // Create a user record and store it in the in-memory Map
    const user = { id: String(nextUserId++), username, password_hash };
    usersByUsername.set(username, user);

    // Telemetry for success
    req.telemetry.result = "success";
    req.telemetry.reason = "created";

    // Return success payload
    return res.status(201).json({ ok: true, user_id: user.id, username: user.username });
  } catch (e) {
    // Any unexpected error ends here
    req.telemetry.result = "failure";
    req.telemetry.reason = "server_error";
    return res.status(500).json({ ok: false, error: "internal error" });
  }
});

// =====================================================================================
// POST /login
// =====================================================================================
// Workflow (high-level):
// 1) Mark telemetry: this request is a "login_attempt"
// 2) Read username + password from JSON body (safely)
// 3) Look up user in memory by username
// 4) Compare password with stored bcrypt hash
// 5) If correct: set session values (user_id + username)
// 6) Return success response
//
// Typical responses:
// - 200 OK (success)
// - 401 Unauthorized (invalid credentials)
// - 500 Internal Server Error (unexpected issue)
//
// Session concept :
// - After login, the server stores "who you are" inside req.session
// - Future requests can check req.session.user_id to know you're logged in
router.post("/login", async (req, res) => {
  req.telemetry.event_type = "login_attempt";

  try {
    const username = normalizeUsername(req.body && req.body.username);
    const password =
      typeof (req.body && req.body.password) === "string" ? req.body.password : "";

    // Look up the user in the Map.
    // If not found, we do NOT reveal whether the user exists.
    // We just return "invalid credentials".
    const user = usersByUsername.get(username);
    if (!user) {
      req.telemetry.result = "failure";
      req.telemetry.reason = "invalid_credentials";
      return res.status(401).json({ ok: false, error: "invalid credentials" });
    }

    // Compare incoming password against stored bcrypt hash.
    // bcrypt.compare handles the hashing + safe comparison internally.
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      req.telemetry.result = "failure";
      req.telemetry.reason = "invalid_credentials";
      return res.status(401).json({ ok: false, error: "invalid credentials" });
    }

    // If credentials are valid:
    // Store identity markers into the session so later requests can recognize the user.
    req.session.user_id = user.id;
    req.session.username = user.username;

    req.telemetry.result = "success";

    // Return a simple success response
    return res.json({ ok: true, user_id: user.id, username: user.username });
  } catch (e) {
    req.telemetry.result = "failure";
    req.telemetry.reason = "server_error";
    return res.status(500).json({ ok: false, error: "internal error" });
  }
});

// =====================================================================================
// POST /logout
// =====================================================================================
// Workflow (high-level):
// 1) Mark telemetry: this request is a "logout" event
// 2) If there's no session object, treat as a no-op success
// 3) Destroy the session server-side
// 4) Return success
//
// Typical responses:
// - 200 OK (success)
// - 500 Internal Server Error (session destroy failed)
router.post("/logout", (req, res) => {
  req.telemetry.event_type = "logout";

  // If session middleware didn't attach a session, we can't destroy it.
  // This route treats that as a "nothing to do" success.
  if (!req.session) {
    req.telemetry.result = "failure";
    req.telemetry.reason = "no_session";
    return res.status(200).json({ ok: true });
  }

  // Destroy session (server-side) to log the user out
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

// Export router so the main app can mount it (ex: app.use(router) or app.use("/auth", router))
module.exports = router;

