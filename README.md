# 🔐 Vulnerable Authentication Detection Lab (SecureAuth)

A detection-engineering and SOC simulation lab demonstrating how authentication weaknesses generate real security telemetry — and how detections and defensive controls are validated using live attack replay and an external scanner.

This project reflects how modern security teams observe attacks, build detections, validate controls, and document outcomes in real environments.

---

## 📂 Evidence-Driven Project (No Guesswork)

This repository prioritizes evidence over theory. All claims are backed by artifacts generated during testing.

Included evidence:

- Authentication telemetry from real attack simulations
- External scanner output validating exposed behaviors
- Detection logic tied directly to observed events
- MITRE ATT&CK mappings with analyst justification
- Before/after telemetry proving control effectiveness

Artifacts are located in the `evidence/` directory.

---

## 🎯 What This Project Demonstrates

This lab mirrors the full SOC detection lifecycle:

- Baseline security with structured authentication telemetry
- Intentional vulnerability exposure to generate real signal
- Live attack simulation (brute force, credential abuse, auth probing)
- Telemetry analysis and detection engineering
- MITRE ATT&CK alignment for analyst triage
- External scanner validation from an attacker's perspective
- Control validation through replayed attacks

You can't detect what you haven't seen — and you can't prove defenses work without testing them.

---

## 🧪 External Scanner Integration (Key Differentiator)

A custom external vulnerability scanner is included to validate the system without modifying backend logic.

Scanner capabilities:

- Enumerates exposed routes
- Executes unauthenticated and authenticated probes
- Simulates brute-force and enumeration behavior
- Captures status codes, timing, and denial behavior

Scanner artifacts:

- `auth-tests.txt`
- `raw-events.jsonl`
- `scan-summary.json`

The scanner runs outside the application, ensuring realistic attacker-side validation.

---

## ⭐ Flagship Detection Case

**Brute Force Authentication Abuse — MITRE ATT&CK T1110**

The primary walkthrough demonstrates:

- Repeated authentication failures captured in telemetry
- Threshold-based detection logic
- MITRE ATT&CK technique justification
- Control validation via scanner retest
- Measurable reduction in attack success

Additional attack scenarios are summarized to demonstrate detection breadth.

---

## 🧭 Project Phases (SOC Workflow)

### Phase 1 — Foundation & Telemetry

- Observable authentication service
- Structured logging and baseline behavior

**Deliverable:** Fully observable authentication system

### Phase 2 — Exploitation & Attack Simulation

- Brute force and credential abuse
- Authentication probing

Mapped techniques:

- T1110 — Brute Force
- T1078 — Valid Accounts
- T1190 — Exploit Public-Facing Application

**Deliverable:** Attack datasets with corresponding logs

### Phase 3 — Detection Engineering

- Telemetry analysis
- Detection logic (SIEM / Sigma-style)
- MITRE ATT&CK mapping
- Incident documentation

**Deliverable:** SOC-style detection documentation

### Phase 4 — Validation & Control Effectiveness

- External scanner validation
- Attack replay after controls
- Before/after telemetry comparison

**Deliverable:** Evidence-backed validation report

---

## 🧠 Analyst Decision Considerations

- Detection thresholds selected to balance sensitivity vs alert fatigue
- Events grouped by source IP and time window to reduce false positives
- Controls validated through replayed attacks, not assumption

These tradeoffs reflect real SOC decision-making.

---

## 👥 Who This Project Is For

- **SOC Analysts** — detection engineering and triage
- **Blue Team Engineers** — attack-defend workflows
- **Security Students** — full incident lifecycle exposure
- **Detection Engineers** — telemetry-driven rule development
- **Career Changers** — portfolio-ready SOC capability

---

## 📖 Skills Demonstrated

### Technical

- Authentication telemetry analysis
- Detection rule development
- External scanner design
- MITRE ATT&CK mapping
- Security control validation

### Professional

- Incident documentation
- Risk communication
- Evidence-based conclusions

---

## 🚀 Real-World Relevance

This project directly supports:

- SOC analyst interviews
- Detection engineering roles
- Incident response discussions
- Security portfolio reviews

Authentication abuse remains one of the most common initial access vectors in real breaches.

---

## 🛠️ Technologies Used

- Custom vulnerable authentication service
- Structured application telemetry
- Detection logic (SIEM / Sigma-style)
- External validation scanner
- MITRE ATT&CK framework

---

## ⚠️ Security Notice

This project contains intentional vulnerabilities for educational use only.

- Do not deploy to production
- Do not expose to untrusted networks
- Use only in isolated lab environments
