🔐 Vulnerable Authentication Detection Lab (SecureAuth)

A detection-engineering and SOC simulation lab demonstrating how authentication weaknesses generate real security telemetry — and how detections and defensive controls are validated using live attack replay and an external scanner.

This project reflects how modern security teams observe attacks, build detections, validate controls, and document outcomes in real environments.

📂 Evidence-Driven Project (No Guesswork)

This repository contains direct evidence, not theoretical claims:

✔ Authentication telemetry from real attack simulations

✔ External scanner output validating exposed behaviors

✔ Detection logic tied to observed events

✔ MITRE ATT&CK mappings with justification

✔ Before/after telemetry proving control effectiveness

All conclusions are supported by artifacts in the evidence/ directory.

🎯 What This Project Demonstrates

This lab mirrors the full SOC detection lifecycle:

📊 Baseline Security — Observable authentication service with structured telemetry

🚨 Vulnerability Exposure — Intentional auth weaknesses to generate signal

⚔️ Attack Simulation — Brute force, credential abuse, auth probing

🔍 Telemetry Analysis — Log-based detection and pattern identification

🗺️ MITRE ATT&CK Alignment — Observed behavior mapped for analyst triage

🧪 Validation via Scanner — External scanner confirms exposure and denial behavior

🛡️ Control Validation — Retesting proves measurable risk reduction

You can’t detect what you haven’t seen — and you can’t prove defenses work without replaying attacks.

🧪 External Scanner Integration (Key Differentiator)

A custom external vulnerability scanner is included to validate the system from an attacker’s perspective.

Scanner Capabilities

Enumerates exposed routes

Executes unauthenticated and authenticated probes

Simulates brute-force and enumeration behavior

Captures timing, status codes, and denial behavior

Scanner Artifacts

auth-tests.txt

raw-events.jsonl

scan-summary.json

The scanner is external to the application, ensuring realistic validation without modifying backend logic.

⭐ Flagship Detection Case
Brute Force Authentication Abuse — MITRE ATT&CK T1110

Included walkthrough demonstrates:

Authentication logs showing repeated failures

Threshold-based detection logic

MITRE technique justification

Rate-limiting and account lockout controls

Scanner-validated retest confirming reduced attack success

Additional attack scenarios are summarized to demonstrate detection breadth.

🧭 Project Phases (SOC Workflow)
Phase 1 — Foundation & Telemetry

📊 Establish observable baseline behavior

Authentication service (login, sessions, access control)

Structured application telemetry

Normal user behavior baselines

Deliverable: Fully observable authentication system

Phase 2 — Exploitation & Attack Simulation

⚔️ Generate authentic attack telemetry

Brute force & credential abuse

Authentication probing

Session handling weaknesses

Mapped Techniques

T1110 — Brute Force

T1078 — Valid Accounts

T1190 — Exploit Public-Facing Application

Deliverable: Attack datasets with logs

Phase 3 — Detection Engineering

🔍 Build detections from evidence

Telemetry analysis

Detection logic (SIEM / Sigma-style)

MITRE ATT&CK mapping

Incident timelines and IOCs

Deliverable: SOC-style detection documentation

Phase 4 — Validation & Control Effectiveness

🛡️ Prove defenses work

External scanner validation

Attack replay after controls

Before/after telemetry comparison

Documented risk reduction

Deliverable: Validated security posture with evidence

🧠 Analyst Decision Considerations

Detection thresholds balance sensitivity vs alert fatigue

Events grouped by IP and time window to reduce false positives

Controls validated through replayed attacks, not assumption

These tradeoffs reflect real SOC decision-making.

👥 Who This Project Is For

🔵 SOC Analysts — Detection engineering & triage

🛡️ Blue Team Engineers — Attack-defend workflows

📚 Security Students — Full incident lifecycle exposure

📈 Detection Engineers — Telemetry-driven rule development

🎓 Career Changers — Portfolio-ready SOC capability

📖 Skills Demonstrated
Technical

Authentication telemetry analysis

Detection rule development

External scanner design

MITRE ATT&CK mapping

Security control validation

Professional

Incident documentation

Risk communication

Analyst-focused reasoning

Evidence-based conclusions

🚀 Real-World Relevance

This project directly supports:

🎤 SOC interviews — Explain detections using real evidence

💼 Detection engineering roles — Build and validate rules

🚨 Incident response — Recognize auth attack patterns

📂 Security portfolios — End-to-end SOC workflow

Authentication attacks remain one of the most common initial access vectors in real breaches.

🛠️ Technologies Used

Authentication: Custom vulnerable auth service

Telemetry: Structured application logging

Detection: SIEM / Sigma-style logic

Validation: Custom external scanner

Framework: MITRE ATT&CK

⚠️ Security Notice

This project contains intentional vulnerabilities for educational use only.

❌ Do not deploy to production
❌ Do not expose to untrusted networks
✅ Use only in isolated lab environments
