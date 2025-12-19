const express = require("express");
const session = require("express-session");
const crypto = require("crypto");

const authRoutes = require("./routes/auth");
const internalRoutes = require("./routes/internal");

const app = express();

// Global runtime flag used for behavior toggling and telemetry context
const VULN_MODE = process.env.VULN_MODE === "true";

// Request body parsing layer (JSON payload contract)
app.use(express.json());

// ============================================================================
// Session Layer
// ============================================================================
// Establishes server-side session state used by authentication and access control
// Contract expectations:
// - Session identifier stored client-side as a cookie
// - Session data stored server-side and attached to req.session
// - Authenticated identity represented by req.session.user_id
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

// ============================================================================
// Telemetry Middleware (Request Lifecycle Instrumentation)
// ============================================================================
// Responsibilities:
// - Generate a unique request identifier for correlation
// - Initialize telemetry fields for downstream mutation
// - Emit a single structured event after response completion
// - Capture auth/session context, routing outcome, and client metadata
app.use((req, res, next) => {
  // Correlation identifier for this request
  const request_id = crypto.randomUUID();
  req.request_id = request_id;

  // Telemetry contract populated by routes and security gates
  req.telemetry = {
    event_type: null,
    result: null,
    reason: null
  };
// Register route modules (moved outside middleware)
app.use('/auth', authRoutes);
app.use('/internal', internalRoutes);

  // Emit telemetry after status code and response are finalized
  res.on("finish", () => {
    // Client IP resolution with proxy awareness
    const xff = req.headers["x-forwarded-for"];
    const ip =
      (typeof xff === "string" && xff.split(",")[0].trim()) ||
      req.socket.remoteAddress ||
      null;

    // Canonical event schema (one event per request)
    const event = {
      timestamp: new Date().toISOString(),
      request_id,
      ip,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,

      // Classification provided by auth/internal middleware
      event_type: req.telemetry.event_type,
      result: req.telemetry.result,
      reason: req.telemetry.reason,

      // Session attribution (null when unauthenticated)
      user_id: (req.session && req.session.user_id) || null,
      session_id: req.sessionID || null,

      // Execution context and client fingerprint
      vuln_mode: VULN_MODE,
      user_agent: req.headers["user-agent"] || null
    };

    // Persistent + real-time telemetry sinks
    const fs = require("fs");
    fs.appendFileSync("telemetry.log", JSON.stringify(event) + "\n");
    console.log(JSON.stringify(event));
  });

  next();
});

// ============================================================================
// Route Mounting
// ============================================================================
// Auth routes:
// - Account creation
// - Credential verification
// - Session establishment / teardown
app.use("/", authRoutes);

// Internal routes:
// - Session-gated resources
// - Authorization enforced upstream in router middleware
app.use("/internal", internalRoutes);

// Health probe endpoint (no auth, no session dependency)
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// ============================================================================
// Server Bootstrap
// ============================================================================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`server listening on http://localhost:${PORT}`);
  console.log(`VULN_MODE=${VULN_MODE}`);
});

