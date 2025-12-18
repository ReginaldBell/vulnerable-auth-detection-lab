console.log("INTERNAL ROUTES FILE LOADED");
const express = require("express");
const router = express.Router();


const VULN_MODE = process.env.VULN_MODE === "true";
console.log("INTERNAL VULN_MODE =", VULN_MODE);

// Intentional authz flaw (ONLY in vuln mode): reports bypasses session gate
if (VULN_MODE) {
  router.get("/reports", (req, res) => {
    req.telemetry.event_type = "internal_route_access";
    req.telemetry.result = "success";
    req.telemetry.reason = "vuln_authz_bypass";

    return res.json({ ok: true, page: "reports", bypass: true });
  });
}

// Gate ALL other /internal/* routes
router.use((req, res, next) => {
  req.telemetry.event_type = "internal_route_access";

  if (!req.session || !req.session.user_id) {
    req.telemetry.result = "failure";
    req.telemetry.reason = "no_session";
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  req.telemetry.result = "success";
  req.telemetry.reason = "authorized";
  next();
});

router.get("/dashboard", (req, res) =>
  res.json({
    ok: true,
    page: "dashboard",
    user: req.session.username,
    user_id: req.session.user_id
  })
);

router.get("/settings", (req, res) =>
  res.json({
    ok: true,
    page: "settings",
    user: req.session.username,
    user_id: req.session.user_id
  })
);

// Secure reports route (only when NOT vuln mode)
if (!VULN_MODE) {
  router.get("/reports", (req, res) =>
    res.json({
      ok: true,
      page: "reports",
      user: req.session.username,
      user_id: req.session.user_id
    })
  );
}

module.exports = router;

