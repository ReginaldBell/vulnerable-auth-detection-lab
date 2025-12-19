🔐 Vulnerable Auth Detection Lab

A detection-engineering lab built around deliberately vulnerable authentication systems.
Simulate real attacks, analyze security telemetry, map activity to MITRE ATT&CK, and validate defensive controls — exactly how SOC teams work in production.

⸻

🎯 What This Lab Demonstrates (At a Glance)

This project mirrors the real SOC detection lifecycle:
	•	📊 Baseline Security — Deploy functional authentication with full logging & monitoring
	•	🚨 Introduce Vulnerabilities — SQL injection, weak sessions, auth bypasses
	•	⚔️ Attack Simulation — Brute force, credential abuse, injection attacks
	•	🔍 Telemetry Analysis — Parse logs and identify attack patterns
	•	🗺️ MITRE ATT&CK Mapping — Translate behavior into standardized techniques
	•	🛡️ Hardening & Validation — Patch vulnerabilities and verify risk reduction

Core idea: You can’t detect what you haven’t seen — and you can’t prove defenses work without testing them against real attacks.

⸻

💡 Why This Lab Is Different

Most labs start with already-hardened systems.
This one starts before security exists.

You learn how to:
	•	✅ Recognize exploitable authentication weaknesses
	•	✅ Read attack signals as they appear in logs
	•	✅ Build detections based on observed behavior, not theory
	•	✅ Validate controls with before/after telemetry
	•	✅ Think like an attacker to defend like a blue teamer

This reflects how real blue teams mature detections.

⸻

🗓️ Project Phases (SOC Workflow)

Phase 1 — Foundation & Telemetry

📊 Establish baseline behavior
	•	Authentication service (login, sessions, passwords)
	•	Application, access, and system logging
	•	Normal user behavior baselines

Deliverable: Observable authentication system

⸻

Phase 2 — Exploitation & Attack Simulation

⚔️ Generate real attack telemetry
	•	SQL injection
	•	Authentication bypass
	•	Weak session handling
	•	Brute force & credential abuse

Mapped Techniques:
	•	T1110 — Brute Force
	•	T1078 — Valid Accounts
	•	T1190 — Exploit Public-Facing App

Deliverable: Attack datasets + logs

⸻

Phase 3 — Detection Engineering

🔍 Build detections from telemetry
	•	Log analysis & anomaly detection
	•	Detection logic (SIEM / Sigma / custom rules)
	•	MITRE ATT&CK mapping
	•	Incident timelines & IOCs

Deliverable: Detection rules + SOC-style analysis

⸻

Phase 4 — Security Hardening & Validation

🛡️ Prove defenses work
	•	Input validation & prepared statements
	•	Session regeneration & management
	•	Rate limiting & account lockouts
	•	MFA implementation

Validation:
	•	Re-run attacks
	•	Compare before/after telemetry
	•	Document measurable risk reduction

Deliverable: Hardened system + validation report

⸻

📂 Detection Case Studies (Evidence-Based)

This lab includes multiple documented attack scenarios, each with:
	•	📄 Authentication log samples
	•	🚨 Detection logic
	•	🗺️ MITRE ATT&CK mappings
	•	🔧 Patch applied
	•	🔁 Validation results

One scenario is documented in full depth; additional scenarios demonstrate detection breadth.

⸻

👥 Who This Is For
	•	🔵 SOC Analysts — Detection engineering & threat hunting
	•	🛡️ Blue Team Engineers — Attack → detect → defend workflows
	•	📚 Security Students — Full incident lifecycle experience
	•	📈 Detection Engineers — Real auth telemetry patterns
	•	🎓 Career Changers — Portfolio-ready security project

⸻

📖 Skills Demonstrated

Technical
	•	Log analysis (auth, app, system logs)
	•	Detection rule development (SIEM / Sigma)
	•	MITRE ATT&CK mapping
	•	Authentication security
	•	Control validation & testing

Professional
	•	Incident documentation
	•	Threat behavior analysis
	•	Risk communication
	•	Security decision reasoning

⸻

🚀 Real-World Relevance

This project directly supports:
	•	🎤 SOC Interviews — Explain detections with real examples
	•	💼 Detection Engineering Roles — Proven rule development & validation
	•	🚨 Incident Response — Attack pattern recognition
	•	📂 Security Portfolios — End-to-end SOC workflow demonstration

Authentication attacks remain one of the most common breach entry points.
Understanding how to detect and stop them is foundational.

⸻

🛠️ Technologies Used
	•	Authentication: Custom vulnerable auth service
	•	Logging: Application, access, system logs
	•	Detection: SIEM queries, Sigma-style logic
	•	Framework: MITRE ATT&CK
	•	Attack Simulation: Industry-standard tools

⸻

⚠️ Security Notice

This lab contains intentional vulnerabilities for education only.

❌ Do not deploy to production
❌ Do not expose to untrusted networks
✅ Use only in isolated lab environments


