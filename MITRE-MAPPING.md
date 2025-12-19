# MITRE ATT&CK Mapping 

> **Purpose:** Map observed authentication vulnerabilities to MITRE ATT&CK framework techniques.  
> **Method:** Evidence-based correlation using telemetry data from production logs.

---

## Quick Reference Table

| Finding | MITRE Technique | Tactic | Evidence Anchor |
|---------|----------------|--------|-----------------|
| F-01: User Enumeration | **T1087** Account Discovery | Discovery | `97ea580a...` / `597a2a0d...` |
| F-02: Brute Force | **T1110** Brute Force | Credential Access | `97ea580a...` (burst pattern) |
| F-03: Authorization Bypass | **T1190** Exploit Public-Facing App | Initial Access | `9e94150c...` |

---

## Detailed Technique Analysis

### T1087 — Account Discovery

**Observed Behavior:**  
Login endpoint returns different error reasons based on account existence, enabling systematic username enumeration.

**Telemetry Evidence:**

```json
// Non-existent account
{
  "timestamp": "2025-12-18T21:29:51.125Z",
  "request_id": "97ea580a-807b-405f-962f-322a1257208e",
  "path": "/login",
  "result": "failure",
  "reason": "no_such_user"
}

// Valid account, wrong password
{
  "timestamp": "2025-12-18T21:39:33.886Z",
  "request_id": "597a2a0d-6be2-4bcb-b8b0-447f61b52ad8",
  "path": "/login",
  "result": "failure",
  "reason": "bad_password"
}
```

**ATT&CK Context:**
- **Tactic:** Discovery
- **Sub-technique:** T1087.001 (Local Account)
- **Description:** Adversaries enumerate accounts to identify valid targets for further attacks
- **Detection:** Monitor for patterns of systematic login failures with varied usernames

**Real-World Parallel:**  
This behavior mirrors reconnaissance techniques used in credential stuffing and targeted phishing campaigns, where attackers first validate account existence before investing resources in password attacks.

---

### T1110 — Brute Force

**Observed Behavior:**  
Login endpoint processes unlimited authentication attempts without throttling, enabling high-velocity password guessing.

**Telemetry Evidence:**

```
Timestamp               | Request ID (partial)      | Status | Reason
-----------------------|---------------------------|--------|---------------
2025-12-18T21:29:51.125| 97ea580a-807b-405f-962f  | 401    | no_such_user
2025-12-18T21:29:51.136| a46bc700-b57e-4222-8f50  | 401    | no_such_user
2025-12-18T21:29:51.147| 99ccfbb1-acf0-40a5-be55  | 401    | no_such_user
2025-12-18T21:29:51.157| b36ba87d-0f76-460e-9fca  | 401    | no_such_user
2025-12-18T21:29:51.211| d32b403d-5265-42f8-92be  | 401    | no_such_user
```

**Attack Metrics:**
- **Duration:** 86ms burst window with 5+ attempts
- **Velocity:** ~10-12 requests/second sustained
- **Response:** Consistent 401 status with no progressive delays

**ATT&CK Context:**
- **Tactic:** Credential Access
- **Sub-technique:** T1110.001 (Password Guessing), T1110.004 (Credential Stuffing)
- **Description:** Adversaries use trial-and-error to guess valid credentials
- **Detection:** Alert on high-frequency authentication failures from single source

**Real-World Parallel:**  
Unrestricted authentication attempts are exploited in botnet-driven credential stuffing attacks, where compromised credentials from data breaches are tested at scale across multiple services.

---

### T1190 — Exploit Public-Facing Application

**Observed Behavior:**  
Internal endpoint `/internal/reports` returns sensitive data without session validation when `vuln_mode=true`, bypassing authentication requirements.

**Telemetry Evidence:**

```json
// Unauthorized access succeeds
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

// Control: Proper authorization gate
{
  "timestamp": "2025-12-18T21:30:46.303Z",
  "request_id": "a0bfb082-c904-4c51-b304-79f2b51930f1",
  "path": "/internal/dashboard",
  "status": 401,
  "reason": "no_session",
  "user_id": null
}
```

**ATT&CK Context:**
- **Tactic:** Initial Access
- **Secondary Tactic:** Privilege Escalation (T1548 - Abuse Elevation Control)
- **Description:** Adversaries exploit security flaws in public-facing applications to gain unauthorized access
- **Detection:** Monitor for internal resource access without authenticated user context

**Real-World Parallel:**  
Authorization bypass vulnerabilities enable direct access to administrative functions, internal APIs, and sensitive data—a common vector in web application breaches (e.g., OWASP A01:2021 Broken Access Control).

---

## Attack Kill Chain Mapping

These techniques form a coherent attack progression:

```
┌─────────────────────────────────────────────────────────┐
│                    ATTACK TIMELINE                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [T1087] Account Discovery                             │
│  └─> 21:29:51 - Enumerate valid usernames              │
│      Evidence: no_such_user vs bad_password responses  │
│                                                         │
│           ↓                                             │
│                                                         │
│  [T1110] Brute Force                                    │
│  └─> 21:29:51 - High-velocity password guessing        │
│      Evidence: 10-12 req/sec with no throttling        │
│                                                         │
│           ↓                                             │
│                                                         │
│  [T1190] Exploit Public-Facing Application             │
│  └─> 21:30:35 - Authorization bypass on /internal/*    │
│      Evidence: 200 OK with user_id=null                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Multi-Stage Attack Scenario:**
1. **Reconnaissance** - Attacker enumerates valid accounts using F-01
2. **Credential Access** - Attacker brute-forces enumerated accounts using F-02
3. **Initial Access** - Attacker exploits authorization bypass using F-03 to access internal resources

---

## Detection & Response Recommendations

### T1087 Detection

**Sigma Rule Concept:**
```yaml
title: User Enumeration via Login Response Differential
logsource:
  category: application
  product: auth_service
detection:
  selection_enum:
    event_type: login_attempt
    result: failure
    reason:
      - no_such_user
      - bad_password
  condition: selection_enum
  timeframe: 5m
  threshold: 10
```

**Response Actions:**
- Normalize error messages to generic "Invalid credentials"
- Implement account enumeration protection
- Add CAPTCHA after N failed attempts

---

### T1110 Detection

**Sigma Rule Concept:**
```yaml
title: Brute Force Authentication Attempt
logsource:
  category: application
  product: auth_service
detection:
  selection_brute:
    event_type: login_attempt
    result: failure
  condition: selection_brute | count(ip) by ip > 10
  timeframe: 1m
```

**Response Actions:**
- Implement rate limiting (exponential backoff)
- Enable account lockout after M failures
- Deploy WAF rules for authentication endpoint protection

---

### T1190 Detection

**Sigma Rule Concept:**
```yaml
title: Authorization Bypass on Internal Endpoint
logsource:
  category: application
  product: auth_service
detection:
  selection_bypass:
    path: /internal/*
    status: 200
    user_id: null
  condition: selection_bypass
```

**Response Actions:**
- Enforce mandatory session validation on all internal routes
- Remove vuln_mode bypass logic from production code
- Implement principle of least privilege for internal resources

---

## Phase 4 Validation Criteria

Before declaring Phase 4 complete, verify:

- ✅ T1087: Enumeration signals eliminated (uniform error messages)
- ✅ T1110: Brute force mitigated (rate limiting active)
- ✅ T1190: Authorization bypass patched (session validation enforced)

Each control must be validated with telemetry evidence showing the attack technique no longer succeeds.

---

## References

- **MITRE ATT&CK Framework:** [https://attack.mitre.org](https://attack.mitre.org)
- **T1087 - Account Discovery:** [https://attack.mitre.org/techniques/T1087](https://attack.mitre.org/techniques/T1087)
- **T1110 - Brute Force:** [https://attack.mitre.org/techniques/T1110](https://attack.mitre.org/techniques/T1110)
- **T1190 - Exploit Public-Facing Application:** [https://attack.mitre.org/techniques/T1190](https://attack.mitre.org/techniques/T1190)
- **Sigma Rules:** [https://github.com/SigmaHQ/sigma](https://github.com/SigmaHQ/sigma)
