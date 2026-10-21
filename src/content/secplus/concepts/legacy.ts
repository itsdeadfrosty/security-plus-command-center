import type { Concept } from "@/lib/types";

// Concept IDs are permanent: learner progress is keyed by them.
// Keep summaries to one plain sentence; put depth in `more`.
export const legacyConcepts: Concept[] = [
  // ---------------- Domain 2: web application attacks ----------------
  {
    id: "xss",
    name: "Cross-site scripting (XSS)",
    objectives: { "SY0-701": "2.3", "SY0-801": "2.5" },
    topic: "Web application attacks",
    summary: "An attacker gets malicious JavaScript to run in another user's browser through a vulnerable website.",
    example:
      "A forum stores a post containing <script> that sends each viewer's session cookie to the attacker. Every user who opens the post runs the script.",
    contrasts: [
      { conceptId: "sqli", distinction: "XSS targets the user's browser. SQL injection targets the application's database query on the server." },
      { conceptId: "csrf", distinction: "XSS runs the attacker's code in the victim's browser. CSRF runs no script on the site — it tricks the browser into sending a request the user didn't intend." },
    ],
    more:
      "Stored XSS saves the payload on the server (comments, profiles). Reflected XSS bounces it off a request parameter, usually via a crafted link. DOM-based XSS happens entirely in client-side JavaScript. Main defenses: output encoding, input validation, a Content Security Policy, and HttpOnly cookies so scripts cannot read session tokens.",
  },
  {
    id: "sqli",
    name: "SQL injection",
    objectives: { "SY0-701": "2.3", "SY0-801": "2.5" },
    topic: "Web application attacks",
    summary: "An attacker changes a database query by putting SQL syntax into unsafe application input.",
    example:
      "A login form builds: SELECT * FROM users WHERE name='<input>'. Entering ' OR 1=1 -- makes the WHERE clause always true and logs the attacker in.",
    contrasts: [
      { conceptId: "xss", distinction: "SQL injection executes on the database server. XSS executes in a victim's browser." },
      { conceptId: "command-injection", distinction: "SQL injection alters a database query. Command injection makes the server run operating-system commands." },
    ],
    more:
      "Indicators: quote characters, OR 1=1, UNION SELECT, or comment markers (--) in URLs and logs, plus database error messages returned to users. The primary fix is parameterized queries (prepared statements); input validation, least-privilege database accounts and a WAF add layers.",
  },
  {
    id: "csrf",
    name: "Cross-site request forgery (CSRF)",
    objectives: { "SY0-701": "2.4", "SY0-801": "2.5" },
    topic: "Web application attacks",
    summary: "A malicious site makes a logged-in user's browser send an unwanted request to a site that trusts that user.",
    example:
      "While logged in to their bank, a user visits a page with a hidden form that auto-submits a transfer request to the bank. The browser attaches the bank cookie, so the bank accepts it.",
    contrasts: [
      { conceptId: "ssrf", distinction: "CSRF abuses the victim's browser and the site's trust in the user. SSRF abuses the server, making it send requests to internal resources." },
      { conceptId: "xss", distinction: "CSRF doesn't need to run script on the target site. It only needs the victim's browser to send an authenticated request." },
    ],
    more:
      "CSRF works because browsers automatically attach cookies. Defenses: anti-CSRF tokens tied to the session, SameSite cookie attributes, and re-authentication for sensitive actions such as changing an email address or transferring money.",
  },
  {
    id: "ssrf",
    name: "Server-side request forgery (SSRF)",
    objectives: { "SY0-701": "2.4", "SY0-801": "2.5" },
    topic: "Web application attacks",
    summary: "An attacker makes a server send requests to a destination the attacker chooses, often internal systems the attacker cannot reach directly.",
    example:
      "An image-import feature fetches any URL. The attacker submits http://169.254.169.254/ and the server returns cloud instance metadata, including temporary credentials.",
    contrasts: [
      { conceptId: "csrf", distinction: "SSRF: the server makes the forged request. CSRF: the victim's browser makes it." },
      { conceptId: "directory-traversal", distinction: "Directory traversal reads files on the server's own file system. SSRF makes the server send network requests to other hosts." },
    ],
    more:
      "SSRF is dangerous in cloud environments because metadata services and internal APIs trust requests from inside the network. Defenses: allow-list the destinations, block internal and link-local address ranges, and segment the network so the web tier cannot reach sensitive services.",
  },
  {
    id: "session-hijacking",
    name: "Session hijacking",
    objectives: { "SY0-701": "2.4", "SY0-801": "2.5" },
    topic: "Web application attacks",
    summary: "An attacker steals or predicts a valid session token and uses it to take over an already-authenticated session.",
    example:
      "A session cookie is sent over unencrypted HTTP on café Wi-Fi. An attacker captures it and loads the site as the victim without knowing the password.",
    contrasts: [
      { conceptId: "on-path", distinction: "An on-path attack is a position (sitting between two parties). Session hijacking is a goal, and an on-path position is one way to steal the token." },
      { conceptId: "broken-authentication", distinction: "Broken authentication is a weakness in the login or session design. Session hijacking is the attack that exploits a token." },
    ],
    more:
      "Protect tokens with TLS everywhere, Secure and HttpOnly cookie flags, long random session IDs, regeneration of the ID after login, idle and absolute timeouts, and server-side invalidation at logout.",
  },
  {
    id: "broken-authentication",
    name: "Broken authentication",
    objectives: { "SY0-701": "2.4", "SY0-801": "2.5" },
    topic: "Web application attacks",
    summary: "Flaws in how an application verifies identity or manages sessions let attackers log in as someone else.",
    example:
      "A site allows unlimited login attempts, accepts 'password1', and keeps session IDs valid after logout. Each flaw makes account takeover easier.",
    contrasts: [
      { conceptId: "session-hijacking", distinction: "Broken authentication describes weak design (no lockout, weak tokens, no MFA). Session hijacking is one attack that takes advantage of it." },
      { conceptId: "credential-stuffing", distinction: "Credential stuffing is an attack. Missing rate limiting and MFA are the broken-authentication weaknesses that let it succeed." },
    ],
    more:
      "Common causes: no rate limiting or lockout, weak password rules, credentials in URLs, predictable session IDs, sessions not invalidated at logout, and no MFA. Fixes: MFA, throttling, secure session management, and well-tested authentication frameworks instead of custom code.",
  },
  {
    id: "directory-traversal",
    name: "Directory traversal",
    objectives: { "SY0-701": "2.4", "SY0-801": "2.5" },
    topic: "Web application attacks",
    summary: "An attacker uses ../ sequences in a file path to read files outside the folder the application intended.",
    example: "GET /download?file=../../../../etc/passwd returns the Linux password file instead of a report.",
    contrasts: [
      { conceptId: "idor", distinction: "Directory traversal escapes the intended folder with path manipulation. IDOR changes an object identifier (such as an invoice number) to reach another user's record." },
      { conceptId: "command-injection", distinction: "Traversal reads files through path manipulation. Command injection runs operating-system commands." },
    ],
    more:
      "Look for ../, ..\\, or URL-encoded forms like %2e%2e%2f in logs. Defenses: canonicalize the path and confirm it stays within an allowed base directory, use allow-lists of file IDs instead of raw names, and run the app with minimal file permissions.",
  },
  {
    id: "rce",
    name: "Remote code execution (RCE)",
    objectives: { "SY0-701": "2.3", "SY0-801": "2.4" },
    topic: "Application vulnerabilities",
    summary: "A vulnerability that lets an attacker run their own code on a target system over the network.",
    example:
      "An unpatched deserialization flaw in an internet-facing Java app lets an attacker send a crafted request that launches a reverse shell.",
    contrasts: [
      { conceptId: "command-injection", distinction: "Command injection is one way to achieve code execution. RCE is the broader outcome: buffer overflows, deserialization and memory injection can also cause it." },
    ],
    more:
      "RCE is usually rated critical because it gives the attacker a foothold. Causes include buffer overflows, unsafe deserialization, memory injection, and injection flaws. Priorities: patch quickly, reduce the exposed attack surface, and use least privilege so the compromised process can do little.",
  },
  {
    id: "race-condition",
    name: "Race condition (TOC/TOU)",
    objectives: { "SY0-701": "2.3", "SY0-801": "2.4" },
    topic: "Application vulnerabilities",
    summary: "The outcome depends on the timing of events, so an attacker acts in the gap between a check and the use of its result.",
    example:
      "A gift card app checks the balance and then deducts it. Twenty simultaneous requests all pass the check before any deduction runs, so the card is spent twenty times.",
    contrasts: [
      { conceptId: "rce", distinction: "A race condition abuses timing between steps. RCE is about running arbitrary code." },
    ],
    more:
      "Time-of-check to time-of-use (TOCTOU) is the classic form: the system checks a condition, and something changes before it acts on it. Fixes: atomic operations, locking, database transactions, and re-validating at the moment of use.",
  },
  {
    id: "on-path",
    name: "On-path attack",
    objectives: { "SY0-701": "2.4", "SY0-801": "2.5" },
    topic: "Network attacks",
    summary: "The attacker secretly sits between two communicating parties and can read or change traffic as it passes.",
    example:
      "On a coffee shop network, an attacker uses ARP poisoning so the victim's traffic flows through the attacker's laptop before reaching the router.",
    contrasts: [
      { conceptId: "session-hijacking", distinction: "On-path describes where the attacker sits. From there they might steal session tokens, but they can also alter or relay any traffic." },
      { conceptId: "spoofing", distinction: "Spoofing fakes an identity (IP, MAC, email sender). On-path attacks often use spoofing, such as ARP spoofing, to get into the traffic path." },
    ],
    more:
      "Formerly called man-in-the-middle. Techniques: ARP poisoning, rogue access points, DNS poisoning, and SSL stripping. Defenses: TLS with certificate validation, HSTS, dynamic ARP inspection, 802.1X, and VPNs on untrusted networks.",
  },
  {
    id: "command-injection",
    name: "Command injection",
    objectives: { "SY0-701": "2.4", "SY0-801": "2.5" },
    topic: "Web application attacks",
    summary: "Unsanitized input is passed to an operating-system shell, so the attacker's commands run on the server.",
    example: "A ping tool runs `ping <input>`. Entering 8.8.8.8; cat /etc/shadow runs a second command.",
    contrasts: [
      { conceptId: "sqli", distinction: "Command injection targets the OS shell. SQL injection targets the database query." },
    ],
  },
  {
    id: "idor",
    name: "Insecure direct object reference (IDOR)",
    objectives: { "SY0-701": "2.4", "SY0-801": "2.5" },
    topic: "Web application attacks",
    summary: "The app trusts an object ID from the user without checking that the user is allowed to access that object.",
    example: "Changing /invoice?id=1001 to id=1002 shows another customer's invoice.",
    contrasts: [
      { conceptId: "directory-traversal", distinction: "IDOR changes an identifier. Traversal manipulates a file path." },
    ],
  },

  // ---------------- Domain 2: other review topics ----------------
  {
    id: "credential-stuffing",
    name: "Credential stuffing",
    objectives: { "SY0-701": "2.4", "SY0-801": "2.5" },
    topic: "Password attacks",
    summary: "Attackers try username/password pairs leaked from one breach against other sites, betting that people reuse passwords.",
    example:
      "After a shopping site breach, bots try the leaked email/password pairs against a bank's login. Many succeed on the first try because of password reuse.",
    contrasts: [
      { conceptId: "password-spraying", distinction: "Stuffing uses known, specific pairs (one try per account, already-correct passwords). Spraying tries a few common passwords against many accounts." },
    ],
    more:
      "Signs: logins from many IPs, high success rate per attempt compared with brute force, and many distinct usernames. Defenses: MFA, breached-password checks, rate limiting, bot detection, and user education about password reuse.",
  },
  {
    id: "password-spraying",
    name: "Password spraying",
    objectives: { "SY0-701": "2.4", "SY0-801": "2.5" },
    topic: "Password attacks",
    summary: "One or a few common passwords are tried against many accounts, staying under lockout thresholds.",
    example: "An attacker tries 'Spring2026!' once against every account in the directory, then waits before the next password.",
    contrasts: [
      { conceptId: "credential-stuffing", distinction: "Spraying guesses common passwords. Stuffing replays real leaked credentials." },
    ],
  },
  {
    id: "fuzzing",
    name: "Fuzzing",
    objectives: { "SY0-701": "4.3", "SY0-801": "4.3" },
    topic: "Application security testing",
    summary: "Automated testing that sends large volumes of malformed or random input to a program to find crashes and unexpected behavior.",
    example:
      "A fuzzer sends millions of mutated image files to a parser and finds one that crashes it — a sign of a possible buffer overflow.",
    contrasts: [
      { conceptId: "vulnerability-scanning", distinction: "A vulnerability scanner checks for known issues (missing patches, known CVEs). Fuzzing discovers unknown bugs by feeding unexpected input." },
    ],
    more:
      "Fuzzing is dynamic analysis: the program is running. Static analysis reviews source code without running it. Fuzzing is especially good at finding input-handling flaws such as buffer overflows.",
  },
  {
    id: "keylogger",
    name: "Keylogger",
    objectives: { "SY0-701": "2.4", "SY0-801": "2.5" },
    topic: "Malware",
    summary: "Malware or hardware that records keystrokes to capture passwords and other typed data.",
    example: "A small USB device between a keyboard and a desktop records everything typed, including domain passwords.",
    contrasts: [
      { conceptId: "rootkit", distinction: "A keylogger's job is collecting keystrokes. A rootkit's job is hiding and keeping privileged access. A rootkit can hide a keylogger, but they are different functions." },
    ],
  },
  {
    id: "rootkit",
    name: "Rootkit",
    objectives: { "SY0-701": "2.4", "SY0-801": "2.5" },
    topic: "Malware",
    summary: "Malware that gains privileged (often kernel-level) access and hides itself and other malware from the operating system and security tools.",
    example:
      "Antivirus scans come back clean, but an offline scan from boot media finds a modified kernel driver hiding processes and files.",
    contrasts: [
      { conceptId: "keylogger", distinction: "A rootkit is about stealth and persistence at high privilege. A keylogger is about capturing input." },
    ],
    more:
      "Because a rootkit can lie to the running OS, detection often needs an offline scan, integrity measurement (Secure Boot, measured boot), or memory forensics. Remediation is often a full reimage.",
  },
  {
    id: "supply-chain",
    name: "Supply chain attack",
    objectives: { "SY0-701": "2.2", "SY0-801": "2.3" },
    topic: "Threat vectors",
    summary: "Attackers compromise a trusted vendor, software update, or component so the attack reaches many downstream customers.",
    example:
      "Attackers break into a software vendor's build server and insert a backdoor into a signed update, which thousands of customers install automatically.",
    more:
      "Vectors include managed service providers (MSPs), hardware and software vendors, open-source dependencies, and update mechanisms. Mitigations: vendor due diligence, software bills of materials (SBOMs), verifying signatures and hashes, and limiting third-party access.",
  },
  {
    id: "pharming",
    name: "Pharming",
    objectives: { "SY0-701": "2.4", "SY0-801": "2.5" },
    topic: "Social engineering and DNS",
    summary: "Users are silently redirected to a fake website even though they typed the correct address, usually through DNS or hosts-file manipulation.",
    example:
      "Malware edits a PC's hosts file so the bank's real domain resolves to the attacker's IP. The user types the correct URL and still lands on a fake login page.",
    contrasts: [
      { conceptId: "spoofing", distinction: "Pharming redirects legitimate traffic to a fake site through name resolution. Spoofing is the general act of faking an identity (email sender, IP, MAC, caller ID)." },
      { conceptId: "phishing", distinction: "Phishing needs the victim to click a malicious link. Pharming works even when the victim types the correct address." },
    ],
  },
  {
    id: "spoofing",
    name: "Spoofing",
    objectives: { "SY0-701": "2.4", "SY0-801": "2.5" },
    topic: "Network attacks",
    summary: "Faking an identifier — an IP address, MAC address, email sender, or caller ID — to look like a trusted source.",
    example: "An email shows 'From: ceo@company.com', but the headers show it came from an unrelated mail server that failed SPF.",
    contrasts: [
      { conceptId: "pharming", distinction: "Spoofing fakes who a message or packet is from. Pharming changes where a correctly-typed name resolves to." },
    ],
  },
  {
    id: "phishing",
    name: "Phishing",
    objectives: { "SY0-701": "2.2", "SY0-801": "2.5" },
    topic: "Social engineering",
    summary: "Fraudulent messages that trick people into revealing credentials, opening attachments, or clicking malicious links.",
    example: "An email claiming to be from IT asks staff to 'revalidate' their mailbox on a look-alike login page.",
  },
  {
    id: "smishing",
    name: "Smishing",
    objectives: { "SY0-701": "2.2", "SY0-801": "2.5" },
    topic: "Social engineering",
    summary: "Phishing delivered by SMS text message.",
    example: "A text claims a package is held and links to a fake shipping site that asks for card details.",
    contrasts: [{ conceptId: "vishing", distinction: "Smishing uses text messages. Vishing uses voice calls." }],
  },
  {
    id: "vishing",
    name: "Vishing",
    objectives: { "SY0-701": "2.2", "SY0-801": "2.5" },
    topic: "Social engineering",
    summary: "Phishing by voice call, often impersonating IT support, a bank, or an executive.",
    example: "A caller posing as the help desk asks an employee to read back the MFA code that was just sent to their phone.",
    contrasts: [{ conceptId: "smishing", distinction: "Vishing is a voice call. Smishing is SMS." }],
  },
  {
    id: "watering-hole",
    name: "Watering-hole attack",
    objectives: { "SY0-701": "2.2", "SY0-801": "2.3" },
    topic: "Threat vectors",
    summary: "Attackers compromise a website that a target group is known to visit, then infect those visitors.",
    example: "Attackers compromise an industry association's site that engineers at a target company visit every week.",
  },
  {
    id: "ransomware",
    name: "Ransomware",
    objectives: { "SY0-701": "2.4", "SY0-801": "2.5" },
    topic: "Malware",
    summary: "Malware that encrypts data (and often steals it) and demands payment for the key.",
    example: "File shares fill with files renamed to .locked and a ransom note appears in every folder.",
  },
  {
    id: "trojan",
    name: "Trojan",
    objectives: { "SY0-701": "2.4", "SY0-801": "2.5" },
    topic: "Malware",
    summary: "Malware disguised as legitimate software that the user installs willingly.",
    example: "A 'free PDF converter' installs a remote access tool alongside the converter.",
    contrasts: [{ conceptId: "worm", distinction: "A Trojan needs the user to install it. A worm spreads by itself across the network." }],
  },
  {
    id: "worm",
    name: "Worm",
    objectives: { "SY0-701": "2.4", "SY0-801": "2.5" },
    topic: "Malware",
    summary: "Self-replicating malware that spreads across networks without user interaction, usually by exploiting a vulnerability.",
    example: "Malware exploiting an unpatched SMB flaw spreads from one PC to hundreds overnight with no one clicking anything.",
  },
  {
    id: "logic-bomb",
    name: "Logic bomb",
    objectives: { "SY0-701": "2.4", "SY0-801": "2.5" },
    topic: "Malware",
    summary: "Malicious code that stays dormant until a specific condition or date triggers it.",
    example: "A script deletes payroll records if the administrator's account is ever disabled.",
  },
  {
    id: "adware",
    name: "Adware",
    objectives: { "SY0-701": "2.4", "SY0-801": "2.5" },
    topic: "Malware",
    summary: "Unwanted software that displays advertising, often changing browser settings or tracking browsing.",
    example: "After installing a free game, a user's browser home page changes and pop-up ads appear constantly.",
  },

  // ---------------- Domain 1 ----------------
  {
    id: "control-types",
    name: "Security control types",
    objectives: { "SY0-701": "1.1", "SY0-801": "1.1" },
    topic: "Security controls",
    summary: "Controls are classified by function: preventive, deterrent, detective, corrective, compensating, and directive.",
    example: "A firewall rule is preventive, a CCTV camera is detective (and deterrent), and restoring from backup is corrective.",
    more:
      "Categories (technical, managerial, operational, physical) describe how a control is implemented. Types describe what it does. A compensating control is an alternative used when the primary control is not feasible.",
  },
  {
    id: "zero-trust",
    name: "Zero trust",
    objectives: { "SY0-701": "1.2", "SY0-801": "1.1" },
    topic: "Fundamental concepts",
    summary: "No user or device is trusted based on network location. Every request is authenticated, authorized, and continuously evaluated.",
    example: "An employee in the office still has to pass MFA and a device-health check before reaching the HR application.",
  },
  {
    id: "non-repudiation",
    name: "Non-repudiation",
    objectives: { "SY0-701": "1.2", "SY0-801": "1.1" },
    topic: "Fundamental concepts",
    summary: "Proof that a specific party performed an action, so they cannot credibly deny it later.",
    example: "A contract signed with the sender's private key proves the sender approved it.",
    contrasts: [{ conceptId: "hashing", distinction: "A hash alone proves integrity, not who created the data. A digital signature (hash + private key) gives non-repudiation." }],
  },
  {
    id: "change-management",
    name: "Change management",
    objectives: { "SY0-701": "1.3", "SY0-801": "1.2" },
    topic: "Change management",
    summary: "A formal process to request, assess, approve, test, schedule, and document changes, including a backout plan.",
    example: "A firewall change gets a ticket, an impact analysis, CAB approval, a maintenance window, and a documented rollback step.",
  },
  {
    id: "hashing",
    name: "Hashing",
    objectives: { "SY0-701": "1.4", "SY0-801": "1.3" },
    topic: "Cryptography",
    summary: "A one-way function that produces a fixed-length digest. Used to verify integrity and to store passwords (with salts).",
    example: "A download page publishes a SHA-256 value. Matching it confirms the file wasn't altered.",
    contrasts: [{ conceptId: "symmetric-asymmetric", distinction: "Encryption is reversible with a key. Hashing is designed to be irreversible." }],
  },
  {
    id: "symmetric-asymmetric",
    name: "Symmetric vs. asymmetric encryption",
    objectives: { "SY0-701": "1.4", "SY0-801": "1.3" },
    topic: "Cryptography",
    summary: "Symmetric uses one shared key and is fast. Asymmetric uses a public/private key pair and solves key exchange and signatures.",
    example: "TLS uses asymmetric cryptography to agree on a session key, then AES (symmetric) to encrypt the bulk data.",
  },

  // ---------------- Domain 3 ----------------
  {
    id: "air-gap",
    name: "Air gap",
    objectives: { "SY0-701": "3.1", "SY0-801": "3.1" },
    topic: "Architecture models",
    summary: "A system is physically isolated from untrusted networks, with no network connection at all.",
    example: "A plant's safety controller has no network link. Updates are applied from verified removable media.",
  },
  {
    id: "segmentation",
    name: "Network segmentation",
    objectives: { "SY0-701": "3.2", "SY0-801": "3.2" },
    topic: "Secure infrastructure",
    summary: "Splitting a network into zones (VLANs, subnets, DMZ) with controls between them, to limit lateral movement.",
    example: "Payment terminals sit on their own VLAN, and a firewall only allows them to reach the payment processor.",
  },
  {
    id: "data-states",
    name: "Data states",
    objectives: { "SY0-701": "3.3", "SY0-801": "3.3" },
    topic: "Data protection",
    summary: "Data is protected differently at rest (stored), in transit (moving), and in use (being processed).",
    example: "Full-disk encryption protects a laptop at rest. TLS protects data in transit. Secure enclaves protect data in use.",
  },

  // ---------------- Domain 4 ----------------
  {
    id: "nac",
    name: "Network Access Control (NAC)",
    objectives: { "SY0-701": "4.5", "SY0-801": "4.1" },
    topic: "Enterprise security capabilities",
    summary: "Checks a device's identity and health before letting it join the network, and can quarantine non-compliant devices.",
    example: "A laptop without current antivirus definitions is placed on a remediation VLAN until it updates.",
    contrasts: [
      { conceptId: "siem", distinction: "NAC decides at connection time whether a device may join the network (preventive). SIEM collects and correlates logs to detect and investigate events (detective)." },
    ],
    more: "NAC often uses 802.1X with a RADIUS server, plus posture checks via a persistent or dissolvable agent, or agentless checks.",
  },
  {
    id: "siem",
    name: "SIEM",
    objectives: { "SY0-701": "4.4", "SY0-801": "4.4" },
    topic: "Alerting and monitoring",
    summary: "Security Information and Event Management collects logs from many sources, correlates them, and alerts on suspicious patterns.",
    example: "The SIEM links a VPN login from abroad with a badge swipe in the office for the same user five minutes later, and raises an alert.",
    contrasts: [
      { conceptId: "nac", distinction: "SIEM sees and correlates events after they happen. NAC controls who gets on the network." },
    ],
  },
  {
    id: "edr",
    name: "Endpoint detection and response (EDR)",
    objectives: { "SY0-701": "4.5", "SY0-801": "4.1" },
    topic: "Enterprise security capabilities",
    summary: "Endpoint agents that record behavior, detect threats, and let responders isolate or remediate a host.",
    example: "EDR flags a Word process spawning PowerShell and lets the analyst isolate the laptop from the network with one click.",
  },
  {
    id: "dlp",
    name: "Data loss prevention (DLP)",
    objectives: { "SY0-701": "4.5", "SY0-801": "4.1" },
    topic: "Enterprise security capabilities",
    summary: "Detects and blocks sensitive data leaving through email, uploads, or removable media.",
    example: "An outbound email containing 40 credit card numbers is blocked and the user is notified.",
  },
  {
    id: "vulnerability-scanning",
    name: "Vulnerability scanning",
    objectives: { "SY0-701": "4.3", "SY0-801": "4.3" },
    topic: "Vulnerability management",
    summary: "Automated tools check systems for known vulnerabilities, missing patches, and misconfigurations.",
    example: "A credentialed scan finds 12 servers missing a critical OpenSSL patch.",
    contrasts: [{ conceptId: "fuzzing", distinction: "Scanning finds known issues. Fuzzing hunts for unknown input-handling bugs." }],
    more: "Credentialed scans log in and see more accurately than non-credentialed scans. CVSS scores rate severity, but prioritization should also consider exposure and asset value.",
  },
  {
    id: "mfa",
    name: "Multifactor authentication (MFA)",
    objectives: { "SY0-701": "4.6", "SY0-801": "4.5" },
    topic: "Identity and access management",
    summary: "Requires factors from two or more different categories: something you know, have, or are (plus somewhere you are).",
    example: "A password plus a hardware security key is MFA. A password plus a security question is not — both are 'something you know'.",
  },
  {
    id: "least-privilege",
    name: "Least privilege",
    objectives: { "SY0-701": "4.6", "SY0-801": "4.5" },
    topic: "Identity and access management",
    summary: "Users and services get only the access they need to do their job, and nothing more.",
    example: "A reporting service account gets read-only access to one database, not db_owner on the whole server.",
  },
  {
    id: "jit-permissions",
    name: "Just-in-time permissions",
    objectives: { "SY0-701": "4.6", "SY0-801": "4.5" },
    topic: "Identity and access management",
    summary: "Elevated access is granted only when needed, for a limited time, and then removed automatically.",
    example: "An admin requests domain admin rights for a 2-hour change window. Privileged access management (PAM) revokes them afterward.",
  },
  {
    id: "incident-response-process",
    name: "Incident response process",
    objectives: { "SY0-701": "4.8", "SY0-801": "4.7" },
    topic: "Incident response",
    summary: "Preparation, detection, analysis, containment, eradication, recovery, and lessons learned.",
    example: "After confirming an infected host, the team isolates it (containment) before reimaging it (eradication/recovery).",
    more: "Containment comes before eradication so the threat stops spreading while evidence is preserved. Lessons learned closes the loop by improving preparation.",
  },
  {
    id: "threat-hunting",
    name: "Threat hunting",
    objectives: { "SY0-701": "4.8", "SY0-801": "4.7" },
    topic: "Incident response",
    summary: "Proactively searching for hidden threats based on a hypothesis, instead of waiting for alerts.",
    example: "Based on a new threat report, an analyst searches all endpoints for a specific scheduled task name even though no alert fired.",
  },
  {
    id: "chain-of-custody",
    name: "Chain of custody",
    objectives: { "SY0-701": "4.8", "SY0-801": "4.7" },
    topic: "Digital forensics",
    summary: "A documented record of who collected, handled, transferred, and stored evidence, and when, so it stays admissible.",
    example: "A seized drive is bagged, labeled, hashed, and every hand-off is signed and timestamped on a custody form.",
    contrasts: [
      { conceptId: "data-ownership", distinction: "Chain of custody tracks evidence handling during an investigation. Data ownership assigns accountability for a data set during normal business." },
    ],
  },
  {
    id: "log-analysis",
    name: "Log analysis",
    objectives: { "SY0-701": "4.9", "SY0-801": "4.8" },
    topic: "Investigation data sources",
    summary: "Using firewall, OS, application, and authentication logs to reconstruct what happened.",
    example: "Authentication logs show 300 failures for one account, then a success from the same foreign IP.",
  },

  // ---------------- Domain 5 ----------------
  {
    id: "data-ownership",
    name: "Data roles (owner, custodian, controller, processor)",
    objectives: { "SY0-701": "5.1", "SY0-801": "3.3" },
    topic: "Governance",
    summary: "The data owner is accountable for a data set and decides its classification and who may access it. Custodians and stewards handle it day to day.",
    example: "The VP of HR owns employee records and approves access. The IT team, as custodian, runs the backups and enforces the permissions.",
    contrasts: [
      { conceptId: "chain-of-custody", distinction: "Ownership is about business accountability for data. Chain of custody is about evidence integrity in an investigation." },
    ],
  },
  {
    id: "risk-register",
    name: "Risk register",
    objectives: { "SY0-701": "5.2", "SY0-801": "5.2" },
    topic: "Risk management",
    summary: "A document listing identified risks with their likelihood, impact, owner, and treatment.",
    example: "A row records 'Ransomware on file servers — likelihood high — impact high — owner: IT director — treatment: mitigate with immutable backups'.",
  },
  {
    id: "risk-treatment",
    name: "Risk treatment strategies",
    objectives: { "SY0-701": "5.2", "SY0-801": "5.2" },
    topic: "Risk management",
    summary: "Mitigate (reduce), transfer (insure or outsource), avoid (stop the activity), or accept (document and live with it).",
    example: "Buying cyber insurance transfers financial risk. Decommissioning a legacy FTP server avoids it.",
  },
  {
    id: "rto-rpo",
    name: "RTO and RPO",
    objectives: { "SY0-701": "5.2", "SY0-801": "3.4" },
    topic: "Business impact analysis",
    summary: "RTO is how long a system can be down. RPO is how much data (measured in time) can be lost.",
    example: "An RPO of 1 hour means backups or replication must happen at least hourly. An RTO of 4 hours means service must be restored within 4 hours.",
  },
  {
    id: "vendor-assessment",
    name: "Third-party risk assessment",
    objectives: { "SY0-701": "5.3", "SY0-801": "5.3" },
    topic: "Third-party risk",
    summary: "Evaluating vendors before and during a relationship: due diligence, questionnaires, right-to-audit clauses, and agreements such as SLAs.",
    example: "Before signing, a company reviews a SaaS vendor's SOC 2 Type II report and adds a right-to-audit clause to the contract.",
  },
  {
    id: "penetration-testing",
    name: "Penetration testing",
    objectives: { "SY0-701": "5.5", "SY0-801": "5.5" },
    topic: "Audits and assessments",
    summary: "Authorized simulated attacks to find and exploit weaknesses. Known, partially known, or unknown environment tests differ by how much the testers are told.",
    example: "Testers given no information except the company name perform an unknown-environment (black-box) test.",
  },
  {
    id: "security-awareness",
    name: "Security awareness practices",
    objectives: { "SY0-701": "5.6", "SY0-801": "5.6" },
    topic: "Security awareness",
    summary: "Training, phishing simulations, and clear reporting processes that help users recognize and report threats.",
    example: "After a simulated phishing campaign, users who clicked get short targeted training, and the report-phish button usage is tracked.",
  },
];
