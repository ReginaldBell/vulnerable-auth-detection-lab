// =====================================================================================
// INTERNAL ROUTES (Protected /internal/* endpoints)
// =====================================================================================
//
// 
//
// What this file does :
// - Defines routes that are ONLY accessible to logged-in users
// - Blocks all access if no valid session exists
// - Simulates a real “internal application area” (dashboards, settings, reports)
//
// Think of this like:
// - The employee-only area of a company website
// - If you’re not logged in, you never get past the front door
//
// =====================================================================================

console.log("INTERNAL ROUTES FILE LOADED");

const express = require("express");

module.exports = function({ VULN_MODE }) {
  const router = express.Router();


// =====================================================================================
// GLOBAL GATEKEEPER FOR ALL /internal/* ROUTES
// =====================================================================================
//
// This middleware runs BEFORE any route below it.
//
// Workflow:
// 1) Mark telemetry: user is attempting to access an internal route
// 2) Check if a session exists AND contains a user_id
// 3) If not logged in → block with 401 Unauthorized
// 4) If logged in → allow request to continue
//
//  analogy:
// - This is a security guard at the door checking your badge
// - No badge = no entry
//
// IMPORTANT:
// - This protects ALL routes defined AFTER this middleware
// - Includes /dashboard, /settings, /reports, etc.
router.use((req, res, next) => {
  req.telemetry.event_type = "internal_route_access";

  // If there is no session OR no logged-in user attached to it,
  // the request is rejected immediately.
  if (!req.session || !req.session.user_id) {
    req.telemetry.result = "failure";
    req.telemetry.reason = "no_session";
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  // If we reach this point, the user is authenticated.
  req.telemetry.result = "success";
  req.telemetry.reason = "authorized";
  next(); // Allow request to continue to the actual route
});

// =====================================================================================
// GET /internal/dashboard
// =====================================================================================
//
// Purpose:
// - Represents a logged-in user landing page
// - Returns basic identity info pulled from the session
//
// Example response (simplified):
// {
//   ok: true,
//   page: "dashboard",
//   user: "demoUser",
//   user_id: "1"
// }
router.get("/dashboard", (req, res) =>
  res.json({
    ok: true,
    page: "dashboard",
    user: req.session.username,
    user_id: req.session.user_id
  })
);

// =====================================================================================
// GET /internal/settings
// =====================================================================================
//
// Purpose:
// - Represents a user settings page
// - Still fully protected by the session gate above
//
// Key point:
// - No new auth logic here — security is centralized in middleware
router.get("/settings", (req, res) =>
  res.json({
    ok: true,
    page: "settings",
    user: req.session.username,
    user_id: req.session.user_id
  })
);

// =====================================================================================
// GET /internal/reports
// =====================================================================================
//
// Purpose:
// - Represents sensitive internal data (reports, analytics, logs, etc.)
//
// Security takeaway:
// - Sensitive routes should NEVER implement their own auth repeatedly
// - They rely on a single, consistent gatekeeper middleware
router.get("/reports", (req, res) =>
  res.json({
    ok: true,
    page: "reports",
    user: req.session.username,
    user_id: req.session.user_id
  })
);

// -------------------------------------------------------------------------------------
// Export router factory
  return router;
};
