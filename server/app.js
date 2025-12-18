const express = require("express");
const session = require("express-session");
const crypto = require("crypto");

const authRoutes = require("./routes/auth");
const internalRoutes = require("./routes/internal");


const app = express();

// Global error handlers
process.on("uncaughtException", (err) => {
  console.error("uncaughtException:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("unhandledRejection:", err);
});

app.use(express.json());

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

  // Route handlers can set these fields for SOC-style telemetry
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
      session_id: req.sessionID || null
    };

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
});

// Express error middleware
app.use((err, req, res, next) => {
  console.error("express_error:", err);
  res.status(500).json({ ok: false, error: "internal error" });
});
