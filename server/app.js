const express = require("express");
const session = require("express-session");
const crypto = require("crypto");

const authRoutes = require("./routes/auth");
const internalRoutes = require("./routes/internal");

const app = express();

const VULN_MODE = process.env.VULN_MODE === "true";

app.use(express.json());

// Sessions (keep baseline contract)
app.use(
  session({
    secret: "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true
    }
  })
);

// Telemetry middleware (structured JSON logs)
app.use((req, res, next) => {
  const request_id = crypto.randomUUID();
  req.request_id = request_id;

  req.telemetry = {
    event_type: null,
    result: null,
    reason: null
  };

  res.on("finish", () => {
    const xff = req.headers["x-forwarded-for"];
    const ip =
      (typeof xff === "string" && xff.split(",")[0].trim()) ||
      req.socket.remoteAddress ||
      null;

    const event = {
      timestamp: new Date().toISOString(),
      request_id,
      ip,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,

      event_type: req.telemetry.event_type,
      result: req.telemetry.result,
      reason: req.telemetry.reason,

      user_id: (req.session && req.session.user_id) || null,
      session_id: req.sessionID || null,

      vuln_mode: VULN_MODE,
      user_agent: req.headers["user-agent"] || null
    };

    const fs = require('fs');
    fs.appendFileSync('telemetry.log', JSON.stringify(event) + '\n');
    console.log(JSON.stringify(event));
  });

  next();
});

app.use("/", authRoutes);
app.use("/internal", internalRoutes);

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`server listening on http://localhost:${PORT}`);
  console.log(`VULN_MODE=${VULN_MODE}`);
});
