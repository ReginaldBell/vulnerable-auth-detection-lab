console.log("INTERNAL ROUTES FILE LOADED");
const express = require("express");
const router = express.Router();

// Gate ALL /internal/* routes
router.use((req, res, next) => {
  console.log("INTERNAL GATE HIT", req.method, req.originalUrl);
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
  res.json({ ok: true, page: "dashboard", user: req.session.username, user_id: req.session.user_id })
);

router.get("/settings", (req, res) =>
  res.json({ ok: true, page: "settings", user: req.session.username, user_id: req.session.user_id })
);

router.get("/reports", (req, res) =>
  res.json({ ok: true, page: "reports", user: req.session.username, user_id: req.session.user_id })
);

module.exports = router;
