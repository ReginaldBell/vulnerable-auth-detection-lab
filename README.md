🔐 Vulnerable Auth Detection Lab

A detection-engineering project demonstrating how authentication vulnerabilities generate real SOC telemetry — and how detections and defensive controls are validated against live attack simulations.

This project reflects how modern security teams observe attacks, build detections, and prove controls work in production environments.

⸻

📂 Evidence Included (No Guesswork)
	•	✔ Authentication log samples from real attack simulations
	•	✔ Detection logic tied directly to observed behavior
	•	✔ MITRE ATT&CK mappings with technique justification
	•	✔ Before/after telemetry validating security controls

This project prioritizes evidence over theory.

⸻

🎯 What This Project Demonstrates (At a Glance)

This project mirrors the full SOC detection lifecycle:
	•	📊 Baseline Security — Functional authentication with comprehensive logging
	•	🚨 Vulnerability Introduction — SQL injection, weak sessions, auth bypasses
	•	⚔️ Attack Simulation — Brute force, credential abuse, injection attacks
	•	🔍 Telemetry Analysis — Log parsing and attack pattern identification
	•	🗺️ MITRE ATT&CK Alignment — Observed behavior mapped for analyst triage
	•	🛡️ Hardening & Validation — Controls applied and validated through retesting

You can’t detect what you haven’t seen — and you can’t prove defenses work without testing them.

⸻

💡 Why This Approach Matters

Most security labs start with already-hardened systems.
This project intentionally starts before security exists.

It demonstrates how to:
	•	✅ Recognize exploitable authentication weaknesses
	•	✅ Read attack telemetry as it appears in logs
	•	✅ Build detections from observed behavior, not assumptions
	•	✅ Validate controls using before/after evidence
	•	✅ Think like an attacker to defend effectively

This reflects real blue-team workflows, not academic exercises.

⸻

⭐ Flagship Detection Case (Primary Walkthrough)

Brute Force Authentication Abuse — MITRE ATT&CK T1110

A full attack → detection → patch → validation walkthrough is included, featuring:
	•	Authentication log samples showing repeated failures
	•	Threshold-based detection logic
	•	MITRE ATT&CK technique justification
	•	Rate limiting and account lockout remediation
	•	Retesting to confirm measurable risk reduction

Additional scenarios are summarized to demonstrate detection breadth.

⸻

🗓️ Project Phases (SOC Workflow)

Phase 1 — Foundation & Telemetry

📊 Establish baseline behavior
	•	Authentication service (login, sessions, password handling)
	•	Application, access, and system logging
	•	Normal user behavior baselines

Deliverable: Fully observable authentication system

⸻

Phase 2 — Exploitation & Attack Simulation

⚔️ Generate authentic attack telemetry
	•	SQL injection
	•	Authentication bypass
	•	Weak session handling
	•	Brute force & credential abuse

Mapped Techniques:
	•	T1110 — Brute Force
	•	T1078 — Valid Accounts
	•	T1190 — Exploit Public-Facing Application

Deliverable: Attack datasets with corresponding logs

⸻

Phase 3 — Detection Engineering

🔍 Build detections from telemetry
	•	Log analysis and anomaly identification
	•	Detection logic (SIEM / Sigma-style rules)
	•	MITRE ATT&CK mapping for analyst alignment
	•	Incident timelines and IOCs

Deliverable: Detection ruleset and SOC-style documentation

⸻

Phase 4 — Security Hardening & Validation

🛡️ Prove controls work
	•	Input validation & prepared statements
	•	Session regeneration and management
	•	Rate limiting & account lockout policies
	•	MFA implementation

Validation Method:
	•	Replayed attacks
	•	Before/after telemetry comparison
	•	Documented risk reduction

Deliverable: Hardened system with validation report

⸻

🧠 Analyst Considerations (Decision-Making)
	•	Detection thresholds selected to balance sensitivity vs alert fatigue
	•	Events grouped by source IP and time window to reduce false positives
	•	Controls validated through replayed attacks rather than assumption

These considerations reflect real SOC decision tradeoffs.

⸻

👥 Who This Project Is For
	•	🔵 SOC Analysts — Detection engineering and threat hunting
	•	🛡️ Blue Team Engineers — Attack-defend workflows
	•	📚 Security Students — Full incident lifecycle exposure
	•	📈 Detection Engineers — Real authentication telemetry patterns
	•	🎓 Career Changers — Portfolio-ready security capability

⸻

📖 Skills Demonstrated

Technical
	•	Authentication log analysis
	•	Detection rule development
	•	MITRE ATT&CK mapping
	•	Security control validation
	•	Attack simulation analysis

Professional
	•	Incident documentation
	•	Risk communication
	•	Analyst-focused reasoning
	•	Security decision justification

⸻

🚀 Real-World Relevance

This project directly supports:
	•	🎤 SOC Interviews — Explain detections using real evidence
	•	💼 Detection Engineering Roles — Rule development + validation
	•	🚨 Incident Response — Attack pattern recognition
	•	📂 Security Portfolios — End-to-end SOC capability demonstration

Authentication attacks remain one of the most common initial access vectors in real breaches.

⸻

🛠️ Technologies Used
	•	Authentication: Custom vulnerable authentication service
	•	Logging: Application, access, and system logs
	•	Detection: SIEM queries, Sigma-style logic
	•	Framework: MITRE ATT&CK
	•	Attack Simulation: Industry-standard tooling

⸻

⚠️ Security Notice

This project contains intentional vulnerabilities for educational use only.

❌ Do not deploy to production
❌ Do not expose to untrusted networks
✅ Use only in isolated lab environments



