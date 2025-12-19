const fs = require("fs");
const http = require("http");
const https = require("https");

const TARGET = process.env.TARGET || "http://localhost:3000";
const UA = "SecureAuthScanner/1.0";
const OUT_DIR = process.env.OUT_DIR || "evidence/scanner-results";

function nowIso() {
  return new Date().toISOString();
}

function safeMkdir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function clip(s, max = 500) {
  if (typeof s !== "string") return "";
  return s.length > max ? s.slice(0, max) + "..." : s;
}

function extractCookie(setCookieHeader) {
  if (!setCookieHeader) return "";
  const first = setCookieHeader.split(",")[0];
  const cookiePair = first.split(";")[0].trim();
  return cookiePair;
}

function asJsonLine(obj) {
  return JSON.stringify(obj) + "\n";
}

async function withTimeout(promise, ms = 10000) {
  return Promise.race([
    promise,
    new Promise((resolve) =>
      setTimeout(() => resolve({ ok: false, error: "hard-timeout" }), ms)
    )
  ]);
}

function reqRaw(path, { method = "GET", headers = {}, body = null, cookie = "" } = {}) {
  const base = new URL(TARGET);
  const url = new URL(path, TARGET);

  const isHttps = url.protocol === "https:";
  const lib = isHttps ? https : http;

  const h = {
    "User-Agent": UA,
    ...headers
  };

  if (cookie) h["Cookie"] = cookie;

  const opts = {
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port || (isHttps ? 443 : 80),
    path: url.pathname + url.search,
    method,
    headers: h
  };

  return new Promise((resolve) => {
    const t0 = Date.now();

    const req = lib.request(opts, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const setCookie = res.headers["set-cookie"] ? res.headers["set-cookie"].join(",") : "";
        const contentType = res.headers["content-type"] || "";
        resolve({
          ok: true,
          ts: nowIso(),
          path,
          method,
          status: res.statusCode,
          contentType,
          setCookie: clip(setCookie, 500),
          bodySnippet: clip(data, 500),
          ms: Date.now() - t0
        });
      });
    });

    req.setTimeout(8000, () => {
      req.destroy(new Error("timeout"));
    });

    req.on("error", (e) => {
      resolve({
        ok: false,
        ts: nowIso(),
        path,
        method,
        error: String(e),
        ms: Date.now() - t0
      });
    });

    if (body !== null) req.write(body);
    req.end();
  });
}

async function main() {
  safeMkdir(OUT_DIR);

  const rawPath = `${OUT_DIR}/raw-events.jsonl`;
  const txtPath = `${OUT_DIR}/auth-tests.txt`;
  const summaryPath = `${OUT_DIR}/scan-summary.json`;

  const findings = [];
  const run = {
    target: TARGET,
    user_agent: UA,
    started: nowIso(),
    tests: [],
    findings
  };

  try {
    fs.writeFileSync(rawPath, "");
    fs.writeFileSync(txtPath, "");

    function logRaw(evt) {
      fs.appendFileSync(rawPath, asJsonLine(evt));
      run.tests.push(evt);
    }

    function logTxt(line) {
      fs.appendFileSync(txtPath, line + "\n");
    }

    logTxt(`[${nowIso()}] SecureAuth Scanner started`);
    logTxt(`TARGET=${TARGET}`);
    logTxt(`UA=${UA}`);
    logTxt("");

    const routes = [
      { path: "/health", method: "GET" },
      { path: "/internal/dashboard", method: "GET" },
      { path: "/internal/settings", method: "GET" },
      { path: "/internal/reports", method: "GET" }
    ];

    for (const r of routes) {
      let evt;
      try {
        evt = await withTimeout(reqRaw(r.path, { method: r.method }));
      } catch (err) {
        evt = { ok: false, error: String(err) };
      }
      logRaw({ phase: "route_probe", ...evt });
      logTxt(`route_probe ${r.method} ${r.path} -> ${evt.status || evt.error || "ERR"}`);
    }

    logTxt("");
    logTxt("=== UNAUTH INTERNAL ACCESS TEST ===");

    let unauthDash;
    try {
      unauthDash = await withTimeout(reqRaw("/internal/dashboard", { method: "GET" }));
    } catch (err) {
      unauthDash = { ok: false, error: String(err) };
    }
    logRaw({ phase: "unauth_internal", ...unauthDash });

    if (unauthDash.ok && unauthDash.status === 401) {
      findings.push({
        id: "F-UNAUTH-401",
        title: "Internal routes enforce session gate",
        evidence: "GET /internal/dashboard returned 401 without session",
        observed: { status: unauthDash.status, contentType: unauthDash.contentType }
      });
      logTxt("PASS: unauth internal access blocked (401).");
    } else {
      findings.push({
        id: "F-UNAUTH-WEAK",
        title: "Internal route access control may be weak",
        evidence: "Expected 401 unauth, observed different result",
        observed: unauthDash
      });
      logTxt("WARN: expected 401 but observed different result.");
    }

    logTxt("");
    logTxt("=== AUTH FLOW TESTS ===");

    const uname = `scanuser_${Date.now()}`;
    const pw = "ScanPass123";

    let signup;
    try {
      signup = await withTimeout(reqRaw("/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: uname, password: pw })
      }));
    } catch (err) {
      signup = { ok: false, error: String(err) };
    }
    logRaw({ phase: "signup", username: uname, ...signup });
    logTxt(`signup -> ${signup.status || signup.error || "ERR"} (username=${uname})`);

    let login;
    try {
      login = await withTimeout(reqRaw("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: uname, password: pw })
      }));
    } catch (err) {
      login = { ok: false, error: String(err) };
    }
    logRaw({ phase: "login", username: uname, ...login });
    logTxt(`login -> ${login.status || login.error || "ERR"} (username=${uname})`);

    const sessionCookie = extractCookie(login.setCookie);
    if (!sessionCookie) {
      findings.push({
        id: "F-SESSION-NOCOOKIE",
        title: "No session cookie observed on login response",
        evidence: "Login response missing Set-Cookie (or not captured)",
        observed: { setCookie: login.setCookie, status: login.status }
      });
      logTxt("WARN: session cookie not observed.");
    } else {
      logTxt(`session_cookie captured: ${sessionCookie.split("=")[0]}=...`);
    }

    let authDash;
    try {
      authDash = await withTimeout(reqRaw("/internal/dashboard", {
        method: "GET",
        cookie: sessionCookie
      }));
    } catch (err) {
      authDash = { ok: false, error: String(err) };
    }
    logRaw({ phase: "auth_internal", ...authDash });
    logTxt(`auth GET /internal/dashboard -> ${authDash.status || authDash.error || "ERR"}`);

    if (authDash.ok && authDash.status === 200) {
      findings.push({
        id: "F-AUTH-OK",
        title: "Authenticated internal access succeeds",
        evidence: "GET /internal/dashboard returned 200 after login",
        observed: { status: authDash.status, contentType: authDash.contentType }
      });
      logTxt("PASS: authenticated internal access succeeded (200).");
    } else {
      findings.push({
        id: "F-AUTH-FAIL",
        title: "Authenticated internal access failed",
        evidence: "Expected 200 after login; observed different result",
        observed: authDash
      });
      logTxt("WARN: expected 200 for authenticated internal access but observed different result.");
    }

    logTxt("");
    logTxt("=== USER ENUMERATION SIGNAL TEST ===");

    const fakeUser = `nope_${Date.now()}`;
    let enumAttempt;
    try {
      enumAttempt = await withTimeout(reqRaw("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: fakeUser, password: "WrongPass123" })
      }));
    } catch (err) {
      enumAttempt = { ok: false, error: String(err) };
    }
    logRaw({ phase: "enum_probe", username: fakeUser, ...enumAttempt });
    logTxt(`enum_probe login(nonexistent user) -> ${enumAttempt.status || enumAttempt.error || "ERR"}`);

    findings.push({
      id: "F-ENUM-SIGNAL",
      title: "User enumeration signal check",
      evidence: "Invalid login attempt against nonexistent account observed",
      observed: { status: enumAttempt.status, snippet: enumAttempt.bodySnippet }
    });

    logTxt("");
    logTxt("=== RATE-LIMIT SIGNAL TEST (LIGHT) ===");

    let throttled = false;
    for (let i = 0; i < 8; i++) {
      let brute;
      try {
        brute = await withTimeout(reqRaw("/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: uname, password: "WrongPass123" })
        }));
      } catch (err) {
        brute = { ok: false, error: String(err) };
      }
      logRaw({ phase: "rate_probe", attempt: i + 1, ...brute });
      logTxt(`rate_probe attempt ${i + 1} -> ${brute.status || brute.error || "ERR"}`);
      if (brute.ok && brute.status === 429) throttled = true;
    }

    findings.push({
      id: "F-RATE-LIMIT",
      title: "Rate limit signal check (light)",
      evidence: "Multiple rapid invalid logins executed; checked for 429",
      observed: { throttled }
    });
  } finally {
    run.finished = nowIso();
    fs.writeFileSync(summaryPath, JSON.stringify(run, null, 2));
  }
}

main().catch((e) => {
  try {
    safeMkdir(OUT_DIR);
    fs.appendFileSync(`${OUT_DIR}/auth-tests.txt`, `\n[${nowIso()}] FATAL ${String(e)}\n`);
  } catch (_) {}
  process.exitCode = 1;
});
