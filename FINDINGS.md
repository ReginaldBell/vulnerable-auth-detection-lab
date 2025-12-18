# Security Findings — Phase 3

> **Scope:** Document intentionally introduced vulnerabilities using observed application behavior and telemetry evidence.  
> **Method:** Evidence-based analysis using structured JSON telemetry with no code review or dynamic scanning.

---

## Executive Summary

Three authentication and authorization vulnerabilities were identified through telemetry analysis:

| ID | Vulnerability | Severity | MITRE ATT&CK |
|---|---|---|---|
| **F-01** | User Enumeration via Login Response | Medium | T1087 |
| **F-02** | Unrestricted Brute Force Attempts | High | T1110 |
| **F-03** | Authorization Bypass on Internal Endpoint | Critical | T1190 |

All findings are validated with `request_id` anchors from production telemetry logs.

---

## Telemetry Schema Reference

Evidence is derived from the following structured log fields:

```json
{
  "timestamp": "ISO 8601 timestamp",
  "request_id": "unique request identifier",
  "ip": "client IP address",
  "method": "HTTP method",
  "path": "request path",
  "status": "HTTP status code",
  "event_type": "categorized event",
  "result": "success | failure",
  "reason": "detailed result reason",
  "user_id": "authenticated user ID or null",
  "session_id": "session identifier",
  "vuln_mode": "boolean flag",
  "user_agent": "client user agent"
}
```

---

## F-01: User Enumeration via Login Response

### Description

The authentication endpoint leaks account existence information through differential error messages. Attackers can systematically enumerate valid usernames before attempting password attacks.

### Evidence

**Non-existent User:**
```json
{
  "timestamp": "2025-12-18T21:29:51.125Z",
  "request_id": "97ea580a-807b-405f-962f-322a1257208e",
  "path": "/login",
  "status": 401,
  "result": "failure",
  "reason": "no_such_user"
}
```

**Valid User, Invalid Password:**
```json
{
  "timestamp": "2025-12-18T21:39:33.886Z",
  "request_id": "597a2a0d-6be2-4bcb-b8b0-447f61b52ad8",
  "path": "/login",
  "status": 401,
  "result": "failure",
  "reason": "bad_password"
}
```

### Impact

- **Attack Path:** Enables reconnaissance phase of credential attacks
- **Risk:** Reduces brute-force complexity by confirming valid targets
- **Scale:** Automated tools can enumerate entire username spaces

### Detection Indicators

```
event_type = "login_attempt" 
AND result = "failure"
AND reason IN ("no_such_user", "bad_password")
```

**Alert Logic:**
- Multiple `no_such_user` failures across varied usernames from single IP
- Transition from enumeration pattern to targeted `bad_password` attempts
- Correlation with subsequent brute-force activity (F-02)

---

## F-02: Unrestricted Brute Force Attempts

### Description

The login endpoint accepts unlimited authentication attempts without rate limiting, account lockout, or progressive delays. This enables high-velocity credential attacks.

### Evidence

**Burst Pattern (86ms window):**

```
2025-12-18T21:29:51.125Z | 97ea580a-807b-405f-962f-322a1257208e | 401 | no_such_user
2025-12-18T21:29:51.136Z | a46bc700-b57e-4222-8f50-9e884a6bc4dc | 401 | no_such_user
2025-12-18T21:29:51.147Z | 99ccfbb1-acf0-40a5-be55-f07ef46eafd1 | 401 | no_such_user
2025-12-18T21:29:51.157Z | b36ba87d-0f76-460e-9fca-b9318d0b2833 | 401 | no_such_user
2025-12-18T21:29:51.211Z | d32b403d-5265-42f8-92be-fbed26ab7d95 | 401 | no_such_user
... [additional requests omitted for brevity]
```

**Attack Velocity:** High-velocity burst (5 attempts in ~86ms, equivalent to ~58 req/sec).

### Impact

- **Attack Path:** Enables password guessing at scale
- **Risk:** Combined with F-01, supports targeted brute-force against known accounts
- **Scale:** No defensive throttling observed over sustained attack period

### Detection Indicators

```
COUNT(login_attempt WHERE result = "failure" AND ip = $attacker_ip) > threshold
WITHIN time_window
```

**Alert Logic:**
- ≥10 login failures from single IP within 60 seconds
- ≥50 login failures from single IP within 5 minutes
- Any success event following high-volume failure pattern
- Distributed attacks from multiple IPs targeting same username

---

## F-03: Authorization Bypass on Internal Endpoint

### Description

The `/internal/reports` endpoint returns sensitive data without requiring authenticated session validation. Access control is bypassed when `vuln_mode=true`, allowing unauthenticated access to internal resources.

### Evidence

**Unauthorized Access Granted:**
```json
{
  "timestamp": "2025-12-18T21:30:35.446Z",
  "request_id": "9e94150c-5595-4ed3-9eb3-282b9b8d7409",
  "path": "/internal/reports",
  "method": "GET",
  "status": 200,
  "event_type": "internal_route_access",
  "result": "success",
  "reason": "vuln_authz_bypass",
  "user_id": null,
  "vuln_mode": true
}
```

**Control Comparison (Proper Gate):**
```json
{
  "timestamp": "2025-12-18T21:30:46.303Z",
  "request_id": "a0bfb082-c904-4c51-b304-79f2b51930f1",
  "path": "/internal/dashboard",
  "method": "GET",
  "status": 401,
  "event_type": "internal_route_access",
  "result": "failure",
  "reason": "no_session",
  "user_id": null
}
```

### Impact

- **Attack Path:** Direct unauthorized access to internal functionality
- **Risk:** Information disclosure
- **Scale:** Complete authentication bypass on specific internal route

### Detection Indicators

```
path = "/internal/reports"
AND status = 200
AND user_id IS NULL
```

**Alert Logic:**
- Any internal endpoint success without authenticated `user_id`
- `reason = "vuln_authz_bypass"` in telemetry
- Access to `/internal/*` paths without corresponding session validation events

---

## Combined Attack Chain

These vulnerabilities enable a realistic multi-stage attack:

```
1. Enumeration (F-01)
   └─> Identify valid usernames via differential responses
   
2. Brute Force (F-02)
   └─> Attempt password guessing against confirmed accounts
   
3. Authorization Bypass (F-03)
   └─> Access internal resources without authentication
```

**Timeline Evidence:**
- `21:29:51` - Enumeration begins (F-01)
- `21:29:51` - Brute force burst (F-02)
- `21:30:35` - Internal access exploited (F-03)

---

## Remediation Roadmap

**Phase 4 Scope** (Immediate):
1. Normalize all login error responses to generic "Invalid credentials" message
2. Implement mandatory session validation on all `/internal/*` routes
3. Add telemetry tests to validate control effectiveness



---

## Phase 3 Completion Criteria

Phase 3 is complete when:
1. ✅ Each vulnerability has telemetry-backed evidence with `request_id` anchors
2. ✅ MITRE mapping tied to observed behaviors (see MITRE-MAPPING.md)
3. ✅ Incident timeline documented with evidence references (see INCIDENT-REPORT.md)
