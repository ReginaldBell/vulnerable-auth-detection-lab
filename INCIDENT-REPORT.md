# Security Incident Report — Phase 3

---

## Incident Metadata

| Field | Value |
|-------|-------|
| **Incident ID** | LAB-2025-001 |
| **Classification** | Authentication & Authorization Exploitation (Intentional Lab) |
| **Severity** | High |
| **Status** | Documented (Awaiting Remediation) |
| **Date Range** | 2025-12-18 21:29:51 UTC - 21:39:33 UTC |
| **Environment** | Node.js + Express application with session management |
| **Vuln Mode** | `true` (observed in telemetry) |

---

## Executive Summary

Telemetry analysis reveals a multi-stage attack pattern exploiting three distinct authentication and authorization weaknesses:

1. **User Enumeration** — Differential login responses enabled account discovery
2. **Brute Force** — Unlimited authentication attempts facilitated credential attacks
3. **Authorization Bypass** — Internal endpoint accessible without authentication

The attack sequence demonstrates realistic adversary behavior: reconnaissance → credential access → unauthorized access. All activity is validated with structured telemetry evidence (`request_id` anchors).

**Impact:** Successful unauthorized access to internal resources without valid credentials.

---

## Evidence Sources

**Primary:**
- Structured JSON telemetry logs with complete request lifecycle tracking
- Fields analyzed: `timestamp`, `request_id`, `ip`, `method`, `path`, `status`, `event_type`, `result`, `reason`, `user_id`, `session_id`, `vuln_mode`, `user_agent`

**Analysis Method:**
- Time-series correlation of authentication events
- Behavioral pattern analysis (frequency, response differentials, authorization failures)
- Control comparison (successful blocks vs. bypasses)

---

## Attack Timeline

### Phase 1: Reconnaissance (T1087 — Account Discovery)

**21:29:51.125 UTC** — Initial Enumeration Attempt

```json
{
  "timestamp": "2025-12-18T21:29:51.125Z",
  "request_id": "97ea580a-807b-405f-962f-322a1257208e",
  "method": "POST",
  "path": "/login",
  "status": 401,
  "event_type": "login_attempt",
  "result": "failure",
  "reason": "no_such_user",
  "user_id": null
}
```

**Observation:** Login attempt returns `no_such_user`, confirming username does not exist in system.

---

### Phase 2: Credential Access (T1110 — Brute Force)

**21:29:51.125 - 21:29:51.211 UTC** — High-Velocity Attack Burst

```
Time (UTC)              | Request ID (partial)      | Status | Reason
-----------------------|---------------------------|--------|---------------
21:29:51.125           | 97ea580a-807b-405f-962f  | 401    | no_such_user
21:29:51.136 (+11ms)   | a46bc700-b57e-4222-8f50  | 401    | no_such_user
21:29:51.147 (+11ms)   | 99ccfbb1-acf0-40a5-be55  | 401    | no_such_user
21:29:51.157 (+10ms)   | b36ba87d-0f76-460e-9fca  | 401    | no_such_user
21:29:51.211 (+54ms)   | d32b403d-5265-42f8-92be  | 401    | no_such_user
```

**Metrics:**
- **Duration:** 86ms window
- **Attempts:** 5+ failed login requests
- **Velocity:** ~58 req/sec equivalent
- **Response:** Consistent 401 status with no rate limiting

**Observation:** Unrestricted authentication attempts enable automated password guessing at scale.

---

**21:30:14.498 UTC** — Sustained Attack Pattern

```json
{
  "timestamp": "2025-12-18T21:30:14.498Z",
  "request_id": "9daea786-d0dc-42cc-95a1-60d55c248187",
  "path": "/login",
  "status": 401,
  "result": "failure",
  "reason": "no_such_user"
}
```

**21:30:25.911 UTC** — Continued Probing

```json
{
  "timestamp": "2025-12-18T21:30:25.911Z",
  "request_id": "2a987b8f-1106-428b-9e45-3a6b5df6f351",
  "path": "/login",
  "status": 401,
  "result": "failure",
  "reason": "no_such_user"
}
```

**Observation:** Attack persists over extended period with no defensive response.

---

### Phase 3: Initial Access (T1190 — Exploit Public-Facing Application)

**21:30:35.446 UTC** — Authorization Bypass Exploitation

```json
{
  "timestamp": "2025-12-18T21:30:35.446Z",
  "request_id": "9e94150c-5595-4ed3-9eb3-282b9b8d7409",
  "method": "GET",
  "path": "/internal/reports",
  "status": 200,
  "event_type": "internal_route_access",
  "result": "success",
  "reason": "vuln_authz_bypass",
  "user_id": null,
  "session_id": "present-but-unauthenticated",
  "vuln_mode": true
}
```

**Critical Indicators:**
- ✅ `status: 200` — Request succeeded
- ⚠️ `user_id: null` — No authenticated user
- ⚠️ `reason: vuln_authz_bypass` — Explicit bypass flag
- ⚠️ `vuln_mode: true` — Vulnerable configuration active

**Impact:** Unauthorized access to internal endpoint without valid authentication context.

---

### Control Comparison: Proper Authorization Gate

**21:30:46.303 UTC** — Expected Blocking Behavior

```json
{
  "timestamp": "2025-12-18T21:30:46.303Z",
  "request_id": "a0bfb082-c904-4c51-b304-79f2b51930f1",
  "method": "GET",
  "path": "/internal/dashboard",
  "status": 401,
  "event_type": "internal_route_access",
  "result": "failure",
  "reason": "no_session",
  "user_id": null
}
```

**Observation:** Different internal endpoint (`/internal/dashboard`) correctly blocks unauthenticated access. This confirms `/internal/reports` bypass is isolated to specific route, not systemic authentication failure.

---

### Phase 4: Enumeration Validation

**21:39:33.886 UTC** — Differential Response Confirmation

```json
{
  "timestamp": "2025-12-18T21:39:33.886Z",
  "request_id": "597a2a0d-6be2-4bcb-b8b0-447f61b52ad8",
  "path": "/login",
  "status": 401,
  "result": "failure",
  "reason": "bad_password",
  "user_id": null
}
```

**Key Differential:**
- `no_such_user` (earlier attempts) vs. `bad_password` (this attempt)
- Confirms login endpoint leaks account existence information

---

## Technical Analysis

### Finding 1: User Enumeration (F-01)

**Vulnerability:** Login endpoint returns different error reasons based on account existence.

**Evidence:**
- Unknown username → `reason: "no_such_user"`
- Valid username → `reason: "bad_password"`

**Attack Vector:**
```
1. Attacker submits common usernames (admin, user, test)
2. System responds with "no_such_user" for invalid accounts
3. System responds with "bad_password" for valid accounts
4. Attacker compiles list of confirmed usernames
5. Attacker focuses credential attacks on validated accounts
```

**MITRE Mapping:** T1087 Account Discovery

---

### Finding 2: Brute Force Susceptibility (F-02)

**Vulnerability:** No rate limiting, account lockout, or progressive delays on authentication endpoint.

**Evidence:**
- 5+ attempts within 86ms window
- No observable throttling behavior
- Consistent 401 responses across all attempts

**Attack Vector:**
```
1. Attacker targets enumerated accounts (from F-01)
2. Attacker submits automated password guesses
3. System processes all attempts without defensive response
4. Attacker achieves high attempt volume per time unit
5. Attack continues until credentials discovered or list exhausted
```

**MITRE Mapping:** T1110 Brute Force (T1110.001 Password Guessing)

---

### Finding 3: Authorization Bypass (F-03)

**Vulnerability:** `/internal/reports` endpoint accessible without authenticated session when `vuln_mode=true`.

**Evidence:**
- Request returns `200 OK`
- `user_id` remains `null` (no authentication)
- Explicit `reason: "vuln_authz_bypass"` flag
- Control comparison shows `/internal/dashboard` correctly blocks with `401`

**Attack Vector:**
```
1. Attacker probes internal routes (/internal/*)
2. Attacker discovers /internal/reports bypasses authentication
3. Attacker accesses sensitive internal data without credentials
```

**MITRE Mapping:** T1190 Exploit Public-Facing Application

---

## Session Behavior Notes

**Observation:** `session_id` appears in logs even when `user_id` is `null`.

**Interpretation:**
- Session identifiers are generated for all requests (authenticated or not)
- Session existence ≠ authenticated session
- Authentication establishes `user_id` within session context
- Authorization checks must validate `user_id` presence, not just `session_id`

**Security Implication:** Session management alone does not provide authentication. Authorization logic must explicitly verify authenticated user context.

---

## Attack Chain Summary

```
┌─────────────────────────────────────────────────────────────┐
│                  OBSERVED ATTACK SEQUENCE                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  21:29:51  [RECON]  User Enumeration                        │
│            └─> Identify valid vs invalid usernames          │
│            └─> MITRE: T1087 Account Discovery              │
│                                                             │
│            ↓                                                 │
│                                                             │
│  21:29:51  [ACCESS]  Brute Force Attempt                    │
│            └─> High-velocity password guessing              │
│            └─> MITRE: T1110 Brute Force                    │
│                                                             │
│            ↓                                                 │
│                                                             │
│  21:30:35  [EXPLOIT]  Authorization Bypass                  │
│            └─> Unauthenticated access to /internal/reports  │
│            └─> MITRE: T1190 Exploit Public-Facing App      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Indicators of Compromise (IOCs)

### Behavioral IOCs

| Indicator | Value | Context |
|-----------|-------|---------|
| **Enumeration signal** | `no_such_user` vs `bad_password` | Differential responses |
| **Unauthorized access** | `200 OK` with `user_id=null` | Internal endpoint |
| **Bypass flag** | `reason="vuln_authz_bypass"` | Explicit vulnerability marker |

### Detection Rules

**Rule 1: User Enumeration**
```
event_type = "login_attempt" AND
result = "failure" AND
COUNT(DISTINCT reason) > 1 BY ip
WITHIN 5 minutes
```

**Rule 2: Brute Force**
```
event_type = "login_attempt" AND
result = "failure" AND
COUNT(*) > 10 BY ip
WITHIN 60 seconds
```

**Rule 3: Authorization Bypass**
```
path LIKE "/internal/%" AND
status = 200 AND
user_id IS NULL
```

---

## Remediation Plan

### Phase 4: Immediate Patching (Required)

**Priority 1: Eliminate Authorization Bypass (F-03)**
```
Action: Remove vuln_mode bypass logic from /internal/reports
Validation: Confirm 401 response with user_id=null
Evidence: Re-run exploit and observe 401 status
```

**Priority 2: Normalize Enumeration Signals (F-01)**
```
Action: Return generic "Invalid credentials" for all login failures
Validation: Confirm identical error messages regardless of account state
Evidence: Test with valid/invalid usernames, verify uniform responses
```

**Priority 3: Enforce Session Validation (All Internal Routes)**
```
Action: Apply authentication middleware to all /internal/* endpoints
Validation: Confirm 401 response for unauthenticated requests
Evidence: Attempt access without session, verify blocking
```

---

---

## Validation Criteria

Phase 3 documentation is complete when:

- ✅ Three vulnerabilities documented with telemetry evidence
- ✅ MITRE ATT&CK techniques mapped to observed behaviors
- ✅ Attack timeline established with `request_id` anchors
- ✅ Detection rules defined for each attack vector
- ✅ Remediation plan scoped for Phase 4 and Phase 6

---

## Appendices

### A. Complete Request ID Reference

| Timestamp (UTC) | Request ID | Event | Status | Reason |
|----------------|------------|-------|--------|--------|
| 21:29:51.125 | 97ea580a-807b-405f-962f-322a1257208e | Login | 401 | no_such_user |
| 21:29:51.136 | a46bc700-b57e-4222-8f50-9e884a6bc4dc | Login | 401 | no_such_user |
| 21:29:51.147 | 99ccfbb1-acf0-40a5-be55-f07ef46eafd1 | Login | 401 | no_such_user |
| 21:29:51.157 | b36ba87d-0f76-460e-9fca-b9318d0b2833 | Login | 401 | no_such_user |
| 21:29:51.211 | d32b403d-5265-42f8-92be-fbed26ab7d95 | Login | 401 | no_such_user |
| 21:30:14.498 | 9daea786-d0dc-42cc-95a1-60d55c248187 | Login | 401 | no_such_user |
| 21:30:25.911 | 2a987b8f-1106-428b-9e45-3a6b5df6f351 | Login | 401 | no_such_user |
| 21:30:35.446 | 9e94150c-5595-4ed3-9eb3-282b9b8d7409 | Internal | 200 | vuln_authz_bypass |
| 21:30:46.303 | a0bfb082-c904-4c51-b304-79f2b51930f1 | Internal | 401 | no_session |
| 21:39:33.886 | 597a2a0d-6be2-4bcb-b8b0-447f61b52ad8 | Login | 401 | bad_password |

### B. References

- **MITRE ATT&CK Framework:** [https://attack.mitre.org](https://attack.mitre.org)
- **OWASP Top 10 2021:** [https://owasp.org/Top10](https://owasp.org/Top10)
- **CWE-204:** Observable Response Discrepancy
- **CWE-307:** Improper Restriction of Excessive Authentication Attempts
- **CWE-306:** Missing Authentication for Critical Function

---

**Report Status:** Phase 3 Complete — Awaiting Phase 4 Remediation
