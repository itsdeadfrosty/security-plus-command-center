import { q } from "./helpers";

// Sister questions: each concept has three differently-worded questions on the same idea.
export const sisterQuestionsA = [
  // ---------- Non-repudiation ----------
  q({
    id: "sis-non-repudiation-1",
    conceptIds: ["non-repudiation"],
    difficulty: "exam",
    scenario:
      "A trader claims he never submitted a large stock order. The order system stores a SHA-256 hash of every order, but nothing else ties the order to a person.",
    stem: "What should be added so the company can prove in the future who submitted each order?",
    options: [
      "Encrypting each order with a shared symmetric key",
      "Storing a second hash of each order using a different algorithm",
      "Requiring each order to be digitally signed with the trader's private key",
      "Sending each order over a TLS-protected connection",
    ],
    correct: ["c"],
    explanation:
      "Only the trader holds the private key, so a valid signature binds the order to that person. That gives non-repudiation, which a hash alone cannot.",
    why: {
      a: "A shared key is held by more than one party, so it can't prove which one created the order.",
      b: "Any number of hashes proves the order wasn't altered, not who wrote it.",
      d: "TLS protects data in transit but leaves no lasting proof of who sent the order.",
    },
  }),

  // ---------- Symmetric vs. asymmetric ----------
  q({
    id: "sis-symmetric-asymmetric-1",
    conceptIds: ["symmetric-asymmetric"],
    difficulty: "intermediate",
    scenario:
      "Two branch offices need to encrypt large nightly backups sent between them. They have no secure way to agree on a secret ahead of time.",
    stem: "Which approach BEST combines speed with safe key exchange?",
    options: [
      "Encrypt the backups with RSA directly",
      "Use asymmetric cryptography to exchange a session key, then encrypt the backups with AES",
      "Email a shared AES key to the other office, then encrypt with AES",
      "Hash the backups with SHA-256 before sending them",
    ],
    correct: ["b"],
    explanation:
      "Asymmetric cryptography solves the key exchange problem, and symmetric AES is fast enough for bulk data. This hybrid model is how TLS and most VPNs work.",
    why: {
      a: "RSA is far too slow for bulk data and is limited in how much it can encrypt at once.",
      c: "Emailing the key exposes it to anyone who can read the email.",
      d: "Hashing provides integrity only; the backups would still be readable.",
    },
  }),
  q({
    id: "sis-symmetric-asymmetric-2",
    conceptIds: ["symmetric-asymmetric"],
    difficulty: "exam",
    stem: "A team of 50 people each needs to communicate privately with every other member using only symmetric keys. Which drawback of symmetric encryption does this MOST clearly show?",
    options: [
      "Symmetric algorithms cannot encrypt large files",
      "Symmetric encryption provides non-repudiation that is hard to manage",
      "Symmetric keys must be much longer than asymmetric keys for equal strength",
      "The number of keys to securely distribute grows quickly with the number of users",
    ],
    correct: ["d"],
    explanation:
      "Each pair needs its own shared secret, so 50 people need 1,225 keys, each delivered securely. Asymmetric cryptography avoids this because each person only needs one key pair.",
    why: {
      a: "Symmetric encryption is the preferred choice for large files because it is fast.",
      b: "A shared key can't prove which holder acted, so symmetric encryption gives no non-repudiation.",
      c: "It's the reverse: symmetric keys are shorter than asymmetric keys for similar strength.",
    },
  }),

  // ---------- Risk register ----------
  q({
    id: "sis-risk-register-1",
    conceptIds: ["risk-register"],
    difficulty: "intermediate",
    scenario:
      "Each entry in a company's risk register names a risk owner. The supplier outage risk is assigned to the head of procurement, who isn't a technical specialist.",
    stem: "What is the risk owner's MAIN role for this entry?",
    options: [
      "Personally fixing every technical weakness linked to the risk",
      "Being accountable for monitoring the risk and making sure the chosen treatment is carried out",
      "Setting the organization's overall risk appetite",
      "Approving every change request that touches the supplier's systems",
    ],
    correct: ["b"],
    explanation:
      "A risk owner is the person accountable for a risk: they track it, keep its register entry current and see that the agreed treatment happens, even if others do the hands-on work.",
    why: {
      a: "Owners are accountable for the risk; technical staff usually carry out the fixes.",
      c: "Risk appetite is set by leadership or the board for the whole organization, not by one risk owner.",
      d: "Change approval belongs to the change management process, such as a CAB, not the risk owner.",
    },
  }),

  // ---------- Penetration testing ----------
  q({
    id: "sis-penetration-testing-1",
    conceptIds: ["penetration-testing"],
    difficulty: "exam",
    scenario:
      "A company hires testers to find out how far a real outsider could get. The testers receive only the company's name and a signed scope of allowed targets.",
    stem: "Which type of penetration test is this?",
    options: [
      "Known environment",
      "Unknown environment",
      "Partially known environment",
      "Vulnerability scan",
    ],
    correct: ["b"],
    explanation:
      "Testers who get no internal details work like an outside attacker. That is an unknown environment (black box) test.",
    why: {
      a: "A known environment test gives testers full details such as diagrams and source code.",
      c: "A partially known test gives some inside details, such as credentials or a network map.",
      d: "A vulnerability scan only identifies weaknesses; it doesn't try to exploit them like a pen test.",
    },
  }),

  // ---------- Security awareness ----------
  q({
    id: "sis-security-awareness-1",
    conceptIds: ["security-awareness"],
    difficulty: "intermediate",
    scenario:
      "Employees often notice suspicious emails but delete them without telling anyone, so the SOC learns about campaigns late.",
    stem: "Which awareness improvement would help MOST?",
    options: [
      "Block all external email attachments",
      "Require longer passwords for all users",
      "Publish the SOC analysts' personal phone numbers",
      "Add a simple report-phishing button and teach users to use it",
    ],
    correct: ["d"],
    explanation:
      "A clear, easy reporting process turns users into an early warning system. The SOC hears about campaigns as soon as someone spots one.",
    why: {
      a: "Blocking attachments is a technical control and doesn't fix the reporting gap.",
      b: "Password length has nothing to do with users reporting suspicious messages.",
      c: "Personal phone numbers aren't a sustainable or secure reporting channel.",
    },
  }),
  q({
    id: "sis-security-awareness-2",
    conceptIds: ["security-awareness"],
    difficulty: "exam",
    stem: "Leadership wants to know whether the security awareness program is actually changing behavior. Which measure is MOST useful?",
    options: [
      "The trend in phishing simulation click rates and report rates over time",
      "The number of training slides in the course",
      "The number of firewall rules changed each month",
      "How many employees have administrator rights",
    ],
    correct: ["a"],
    explanation:
      "Falling click rates and rising report rates in repeated simulations show that users are recognizing and reporting threats more often.",
    why: {
      b: "Course length shows effort, not whether users behave differently.",
      c: "Firewall changes measure network administration, not user awareness.",
      d: "Admin rights are an access control issue, not a measure of awareness training.",
    },
  }),

  // ---------- CIA / AAA ----------
  q({
    id: "sis-cia-aaa-1",
    conceptIds: ["cia-aaa"],
    difficulty: "intermediate",
    scenario:
      "A user logs in to the HR portal successfully. When she tries to open the payroll page, she gets 'Access denied' because her role doesn't include payroll.",
    stem: "Which AAA function produced the 'Access denied' result?",
    options: ["Authentication", "Accounting", "Availability", "Authorization"],
    correct: ["d"],
    explanation:
      "Her identity was already confirmed at login. Deciding what she is allowed to do based on her role is authorization.",
    why: {
      a: "Authentication proves who she is, and that already succeeded.",
      b: "Accounting records what she does; it doesn't grant or deny access.",
      c: "Availability is part of the CIA triad, not AAA, and the page was available.",
    },
  }),

  // ---------- Zero Trust architecture ----------
  q({
    id: "sis-zero-trust-architecture-1",
    conceptIds: ["zero-trust-architecture"],
    difficulty: "exam",
    stem: "In a Zero Trust architecture, which component evaluates the request against policy, threat intelligence and device posture to decide whether to grant access?",
    options: [
      "Policy enforcement point",
      "Policy engine",
      "Implicit trust zone",
      "Jump server",
    ],
    correct: ["b"],
    explanation:
      "The policy engine sits in the control plane and makes the allow or deny decision. Other components carry that decision out.",
    why: {
      a: "The PEP is in the data plane and enforces the decision; it doesn't make it.",
      c: "An implicit trust zone is the area behind the PEP, not a decision maker.",
      d: "A jump server is an admin access host, not a Zero Trust policy component.",
    },
  }),
  q({
    id: "sis-zero-trust-architecture-2",
    conceptIds: ["zero-trust-architecture"],
    difficulty: "advanced",
    scenario:
      "An architect is labeling a Zero Trust diagram. One component takes the decision from the policy engine and tells the gateway to open or close the session.",
    stem: "What is this component, and which plane does it belong to?",
    options: [
      "Policy enforcement point, in the data plane",
      "Policy engine, in the data plane",
      "Policy administrator, in the control plane",
      "Subject, in the control plane",
    ],
    correct: ["c"],
    explanation:
      "The policy administrator acts on the policy engine's decision by setting up or tearing down the path at the enforcement point. Both the engine and the administrator are in the control plane.",
    why: {
      a: "The PEP is the gateway that receives the instructions, not the component that sends them.",
      b: "The policy engine makes the decision, and it sits in the control plane, not the data plane.",
      d: "The subject is the user or device requesting access, and it is in the data plane.",
    },
  }),

  // ---------- Gap analysis ----------
  q({
    id: "sis-gap-analysis-1",
    conceptIds: ["gap-analysis"],
    difficulty: "intermediate",
    scenario:
      "A consultant lists every control required by ISO 27001, marks which ones the company already has, and produces a list of the missing ones.",
    stem: "What has the consultant performed?",
    options: [
      "A gap analysis",
      "A penetration test",
      "A business impact analysis",
      "A tabletop exercise",
    ],
    correct: ["a"],
    explanation:
      "Comparing the current state against a target standard and listing what is missing is a gap analysis.",
    why: {
      b: "A pen test exploits technical weaknesses; it doesn't compare controls to a standard.",
      c: "A BIA measures the effect of outages on business functions.",
      d: "A tabletop exercise walks through an incident scenario to test a plan.",
    },
  }),
  q({
    id: "sis-gap-analysis-2",
    conceptIds: ["gap-analysis"],
    difficulty: "exam",
    stem: "Which pair of inputs does a gap analysis need in order to produce useful results?",
    options: [
      "A list of threat actors and their motivations",
      "The current state of controls and a defined target state",
      "The annual budget and the number of employees",
      "Recent incident tickets and their resolution times",
    ],
    correct: ["b"],
    explanation:
      "A gap is the difference between where you are and where you want to be. Without both the current and the target state, there is nothing to compare.",
    why: {
      a: "Threat actor profiles feed threat modeling, not a comparison against a target.",
      c: "Budget and headcount may affect remediation, but they don't define the gaps.",
      d: "Incident metrics measure response performance, not missing controls.",
    },
  }),

  // ---------- Physical security ----------
  q({
    id: "sis-physical-security-1",
    conceptIds: ["physical-security"],
    difficulty: "intermediate",
    scenario:
      "A retail headquarters sits next to a busy road. The security team worries that a vehicle could be driven through the glass lobby entrance.",
    stem: "Which control BEST addresses this risk?",
    options: [
      "Additional CCTV cameras",
      "An access control vestibule",
      "Bollards in front of the entrance",
      "Motion sensors in the lobby",
    ],
    correct: ["c"],
    explanation:
      "Bollards are sturdy posts that physically stop vehicles while still letting people walk through.",
    why: {
      a: "Cameras record the event but don't stop a vehicle.",
      b: "A vestibule controls people entering one at a time; it won't stop a car.",
      d: "Motion sensors detect activity after it happens; they don't block anything.",
    },
  }),

  // ---------- Deception technology ----------
  q({
    id: "sis-deception-technology-1",
    conceptIds: ["deception-technology"],
    difficulty: "intermediate",
    scenario:
      "A research team builds a separate group of decoy servers, workstations and a fake file share, all linked together and filled with realistic traffic. The goal is to watch how intruders move from one system to the next.",
    stem: "What has the team built?",
    options: [
      "A honeytoken",
      "A screened subnet",
      "A honeynet",
      "A sinkhole",
    ],
    correct: ["c"],
    explanation:
      "A honeynet is a network of connected decoy systems. Because it has several hosts, defenders can study lateral movement, not just a single break-in.",
    why: {
      a: "A honeytoken is a single piece of fake data, such as a credential or record, not a set of systems.",
      b: "A screened subnet hosts real public-facing servers, not decoys.",
      d: "A sinkhole redirects malicious DNS or traffic to a controlled destination; it isn't a set of decoy hosts.",
    },
  }),
  q({
    id: "sis-deception-technology-2",
    conceptIds: ["deception-technology"],
    difficulty: "exam",
    stem: "Why is an alert from a honeypot generally considered high-confidence?",
    options: [
      "Honeypots run antivirus that is more accurate than normal servers",
      "No legitimate user or system has a reason to connect to it",
      "Honeypots only log traffic that matches known signatures",
      "Honeypots are placed directly on the internet without a firewall",
    ],
    correct: ["b"],
    explanation:
      "A honeypot provides no real service, so any interaction with it is suspicious by default. That keeps false positives low.",
    why: {
      a: "Honeypots don't depend on better antivirus; their value is that nobody should use them.",
      c: "Honeypots record all interaction, including unknown techniques, not just signature matches.",
      d: "Placement varies, and many honeypots sit inside the network to catch lateral movement.",
    },
  }),

  // ---------- Change impacts ----------
  q({
    id: "sis-change-impacts-1",
    conceptIds: ["change-impacts"],
    difficulty: "intermediate",
    scenario:
      "A web server is moved to a new IP address during a planned change. Afterward, the security team can't connect to it from their jump host, and the network diagram still shows the old address.",
    stem: "Which change step was MOST likely missed?",
    options: [
      "Updating allow lists and documentation to reflect the new address",
      "Getting approval from the change advisory board",
      "Scheduling the change in a maintenance window",
      "Running a vulnerability scan before the change",
    ],
    correct: ["a"],
    explanation:
      "Changes often require firewall allow lists and diagrams to be updated. Skipping that breaks access and leaves records out of date.",
    why: {
      b: "Approval doesn't by itself update rules or diagrams.",
      c: "Timing the change wouldn't fix stale allow lists and documentation.",
      d: "A vulnerability scan wouldn't have updated the address in rules or diagrams.",
    },
  }),
  q({
    id: "sis-change-impacts-2",
    conceptIds: ["change-impacts"],
    difficulty: "exam",
    scenario:
      "A patch for a database engine requires the database service to restart. Several business apps use that database all day.",
    stem: "Which is the BEST way to handle this technical impact?",
    options: [
      "Apply the patch immediately during business hours to close the gap fast",
      "Skip the patch because restarts cause downtime",
      "Apply the patch without telling application owners",
      "Schedule the restart in an approved maintenance window and notify dependent app owners",
    ],
    correct: ["d"],
    explanation:
      "A required restart means planned downtime. Scheduling it in a maintenance window and warning owners of dependent apps limits the business impact.",
    why: {
      a: "Restarting during business hours causes unplanned outages for users.",
      b: "Skipping the patch leaves the vulnerability open; restarts can be planned for.",
      c: "Owners of dependent apps need to know so they can prepare and test afterward.",
    },
  }),

  // ---------- Encryption levels ----------
  q({
    id: "sis-encryption-levels-1",
    conceptIds: ["encryption-levels"],
    difficulty: "intermediate",
    scenario:
      "Field staff carry laptops that are sometimes stolen from cars. The company wants every file on the drive, including temp and swap files, protected if a laptop is taken.",
    stem: "Which encryption level fits BEST?",
    options: [
      "File-level encryption of the Documents folder",
      "Full-disk encryption",
      "Transport encryption with TLS",
      "Record-level database encryption",
    ],
    correct: ["b"],
    explanation:
      "Full-disk encryption protects everything stored on the drive, including temp and swap files, when the device is powered off and stolen.",
    why: {
      a: "Encrypting one folder leaves temp files, caches and other folders exposed.",
      c: "TLS protects data moving over the network, not data sitting on a stolen disk.",
      d: "Record-level encryption protects database fields, not every file on a laptop.",
    },
  }),
  q({
    id: "sis-encryption-levels-2",
    conceptIds: ["encryption-levels"],
    difficulty: "exam",
    scenario:
      "A server uses full-disk encryption. While it is running, an attacker exploits a web app and copies customer files from the mounted drive.",
    stem: "Why didn't full-disk encryption protect these files?",
    options: [
      "Full-disk encryption only protects data in transit",
      "The attacker must have cracked the AES key",
      "Full-disk encryption doesn't cover files on the system drive",
      "Once the system is booted and the disk is unlocked, files are readable to running processes",
    ],
    correct: ["d"],
    explanation:
      "Full-disk encryption protects data at rest when the device is off or locked. While the system runs, the OS decrypts data for anyone with access, so file-level or database encryption is needed for that case.",
    why: {
      a: "Full-disk encryption protects data at rest, not data in transit.",
      b: "No cracking was needed; the disk was already unlocked.",
      c: "Full-disk encryption does cover the system drive; that's the point of it.",
    },
  }),

  // ---------- Cryptographic hardware ----------
  q({
    id: "sis-crypto-hardware-1",
    conceptIds: ["crypto-hardware"],
    difficulty: "intermediate",
    scenario:
      "An IT team wants each company laptop to store its disk encryption key in hardware and check that the boot process hasn't been tampered with.",
    stem: "Which component should they rely on?",
    options: [
      "A hardware security module in the data center",
      "A Trusted Platform Module in each laptop",
      "A key escrow service",
      "A USB token shared by the IT team",
    ],
    correct: ["b"],
    explanation:
      "A TPM is a chip on the device itself that stores keys and records boot measurements, supporting features like BitLocker and measured boot.",
    why: {
      a: "An HSM is a central appliance for many keys, not a chip inside each laptop.",
      c: "Key escrow keeps a backup copy of keys; it doesn't check boot integrity.",
      d: "A shared token isn't tied to each device and can't measure the boot process.",
    },
  }),
  q({
    id: "sis-crypto-hardware-2",
    conceptIds: ["crypto-hardware"],
    difficulty: "exam",
    stem: "A mobile app needs to process fingerprint data so that even the device's main operating system can't read it. Which feature provides this?",
    options: [
      "A hardware security module",
      "Full-disk encryption",
      "A secure enclave",
      "A key management system",
    ],
    correct: ["c"],
    explanation:
      "A secure enclave is an isolated area of the processor that handles sensitive data, such as biometrics, separately from the main OS.",
    why: {
      a: "An HSM is a separate network or server appliance, not part of a phone's processor.",
      b: "Disk encryption protects stored data, but the running OS can still read it.",
      d: "A KMS manages keys centrally; it doesn't isolate processing on the device.",
    },
  }),

  // ---------- Salting and key stretching ----------
  q({
    id: "sis-salting-key-stretching-1",
    conceptIds: ["salting-key-stretching"],
    difficulty: "intermediate",
    scenario:
      "Attackers stole a password database. Each hash has its own random salt, but the passwords were hashed once with a fast algorithm, and attackers are testing billions of guesses per second on GPUs.",
    stem: "Which control would MOST slow down this attack?",
    options: [
      "Adding a second salt to each password",
      "Using a key stretching function such as bcrypt or PBKDF2",
      "Encoding the hashes in Base64",
      "Storing the salts in a separate column",
    ],
    correct: ["b"],
    explanation:
      "Key stretching runs the hash many times, so each guess costs far more time. That cuts the attacker's guessing rate dramatically.",
    why: {
      a: "Salts already stop precomputed tables; another salt doesn't make each guess slower.",
      c: "Base64 is encoding, which is trivially reversible and adds no work for the attacker.",
      d: "Where the salt is stored doesn't change how fast each guess can be checked.",
    },
  }),
  q({
    id: "sis-salting-key-stretching-2",
    conceptIds: ["salting-key-stretching"],
    difficulty: "exam",
    stem: "What is the main purpose of adding a unique salt to each password before hashing?",
    options: [
      "To make the hash reversible for password recovery",
      "To encrypt the password so only the server can read it",
      "To shorten the hash so it uses less storage",
      "To defeat precomputed rainbow tables and hide users who share the same password",
    ],
    correct: ["d"],
    explanation:
      "A unique salt makes every stored hash different, even for identical passwords, so precomputed tables are useless and matching hashes don't reveal shared passwords.",
    why: {
      a: "Hashing stays one-way; a salt doesn't make it reversible.",
      b: "A salt isn't a key and doesn't encrypt anything.",
      c: "Salting doesn't change hash length, and the salt itself adds storage.",
    },
  }),

  // ---------- Obfuscation / masking ----------
  q({
    id: "sis-obfuscation-masking-1",
    conceptIds: ["obfuscation-masking"],
    difficulty: "intermediate",
    scenario:
      "Call center agents need to confirm a caller's identity using the last four digits of their Social Security number. They should never see the full number.",
    stem: "Which technique BEST meets this need?",
    options: [
      "Tokenization",
      "Steganography",
      "Data masking",
      "Hashing",
    ],
    correct: ["c"],
    explanation:
      "Masking shows only part of the value, such as ***-**-6789, so agents can verify the caller without seeing the full number.",
    why: {
      a: "Tokenization swaps the value for a substitute used in place of the real number; showing part of the real value is masking.",
      b: "Steganography hides data inside other files; it doesn't partially display a value.",
      d: "A hash looks nothing like the original, so agents couldn't read any digits.",
    },
  }),

  // ---------- Blockchain ----------
  q({
    id: "sis-blockchain-1",
    conceptIds: ["blockchain"],
    difficulty: "intermediate",
    scenario:
      "A shipping consortium wants a shared record of cargo handoffs. No single company should control it, and nobody should be able to quietly edit past entries.",
    stem: "Which technology fits BEST?",
    options: [
      "A blockchain-based distributed ledger",
      "A central SQL database run by the largest member",
      "A shared spreadsheet on a file server",
      "A certificate revocation list",
    ],
    correct: ["a"],
    explanation:
      "A blockchain is copied across many participants and each block links to the previous block's hash, so past records can't be changed without detection.",
    why: {
      b: "A central database gives one company control and lets its admins edit history.",
      c: "A shared spreadsheet can be edited by anyone with access and keeps no tamper-evident chain.",
      d: "A CRL lists revoked certificates; it isn't a general shared record.",
    },
  }),
  q({
    id: "sis-blockchain-2",
    conceptIds: ["blockchain"],
    difficulty: "exam",
    stem: "Which feature of a blockchain is MOST responsible for making tampering with old records detectable?",
    options: [
      "Each block is encrypted with the next participant's public key",
      "Each block contains the hash of the previous block",
      "Blocks are stored only on a single trusted server",
      "Each block is compressed before it is added",
    ],
    correct: ["b"],
    explanation:
      "Because every block includes the previous block's hash, changing an old block changes its hash and breaks the chain after it.",
    why: {
      a: "Blockchain integrity comes from hash links, not from encrypting blocks to participants.",
      c: "A public ledger is distributed across many nodes, not stored on one server.",
      d: "Compression saves space but does nothing to reveal tampering.",
    },
  }),

  // ---------- Governance documents ----------
  q({
    id: "sis-governance-documents-1",
    conceptIds: ["governance-documents"],
    difficulty: "intermediate",
    scenario:
      "The security team publishes a document suggesting that staff lock their screens when stepping away and use a password manager. The document states that these are recommendations.",
    stem: "Which type of governance document is this?",
    options: ["Policy", "Standard", "Procedure", "Guideline"],
    correct: ["d"],
    explanation:
      "Guidelines are recommended practices, not mandatory requirements. The document says these steps are recommendations, which makes it a guideline.",
    why: {
      a: "A policy is mandatory and states high-level rules and intent.",
      b: "A standard sets specific required values, such as a minimum key length.",
      c: "A procedure gives mandatory step-by-step instructions for a task.",
    },
  }),

  // ---------- Quantitative risk analysis ----------
  q({
    id: "sis-risk-analysis-quantitative-1",
    conceptIds: ["risk-analysis-quantitative"],
    difficulty: "exam",
    scenario:
      "Stolen laptops cost the company $2,000 each, including the device and recovery work. About 15 laptops are stolen each year.",
    stem: "What are the SLE and the ALE for this risk?",
    options: [
      "SLE $15,000; ALE $2,000",
      "SLE $2,000; ALE $30,000",
      "SLE $30,000; ALE $2,000",
      "SLE $2,000; ALE $133",
    ],
    correct: ["b"],
    explanation:
      "The single loss expectancy is the cost of one theft, $2,000. With an ARO of 15, the ALE is $2,000 x 15 = $30,000 a year.",
    why: {
      a: "This mixes up the values; $15,000 isn't the loss from one event.",
      c: "This reverses SLE and ALE.",
      d: "Dividing $2,000 by 15 is wrong; ALE multiplies SLE by ARO.",
    },
  }),

  // ---------- Risk appetite / tolerance ----------
  q({
    id: "sis-risk-appetite-tolerance-1",
    conceptIds: ["risk-appetite-tolerance"],
    difficulty: "intermediate",
    scenario:
      "A fast-growing startup's board says it is willing to accept higher security risk in exchange for launching new products quickly.",
    stem: "How would you describe the board's risk appetite?",
    options: ["Conservative", "Neutral", "Expansionary", "Residual"],
    correct: ["c"],
    explanation:
      "Accepting more risk to pursue growth is an expansionary risk appetite.",
    why: {
      a: "A conservative appetite avoids risk, even if it slows growth.",
      b: "A neutral appetite balances risk and reward without leaning either way.",
      d: "Residual risk is what remains after controls, not an appetite level.",
    },
  }),
  q({
    id: "sis-risk-appetite-tolerance-2",
    conceptIds: ["risk-appetite-tolerance"],
    difficulty: "exam",
    scenario:
      "Management states that the online store may be unavailable for at most 4 hours per month. Last month it was down for 6 hours.",
    stem: "Which concept did the outage exceed?",
    options: [
      "Risk tolerance",
      "Risk appetite",
      "Inherent risk",
      "Risk transference",
    ],
    correct: ["a"],
    explanation:
      "Risk tolerance is the acceptable level of variation for a specific risk, such as 4 hours of downtime a month. Six hours went beyond it.",
    why: {
      b: "Risk appetite is the organization's overall willingness to take risk, not a specific limit for one risk.",
      c: "Inherent risk is the risk before any controls are applied.",
      d: "Transference shifts risk to another party, such as an insurer.",
    },
  }),

  // ---------- BIA ----------
  q({
    id: "sis-bia-1",
    conceptIds: ["bia"],
    difficulty: "intermediate",
    scenario:
      "Before writing a disaster recovery plan, a hospital interviews department heads to learn which systems they depend on and how much harm each hour of outage would cause.",
    stem: "Which activity is the hospital performing?",
    options: [
      "Business impact analysis",
      "Vulnerability assessment",
      "Tabletop exercise",
      "Change advisory board review",
    ],
    correct: ["a"],
    explanation:
      "A BIA identifies critical functions and the cost of their downtime. Its results drive recovery targets and the DR plan.",
    why: {
      b: "A vulnerability assessment looks for technical weaknesses, not outage impact.",
      c: "A tabletop exercise tests an existing plan by walking through a scenario.",
      d: "A CAB reviews proposed changes, not business dependencies.",
    },
  }),
  q({
    id: "sis-bia-2",
    conceptIds: ["bia"],
    difficulty: "exam",
    scenario:
      "A BIA finds that the order system can lose no more than 15 minutes of data, but nightly backups are the only protection in place today.",
    stem: "What should the company do based on this finding?",
    options: [
      "Accept the risk, because a BIA is only advisory",
      "Increase the RTO to 24 hours to match the backups",
      "Delete older backups to save storage",
      "Add a protection method, such as replication, that meets the 15-minute RPO",
    ],
    correct: ["d"],
    explanation:
      "The BIA set an RPO of 15 minutes, and nightly backups could lose up to a day of data. The recovery solution must be upgraded to meet the target.",
    why: {
      a: "BIA results set recovery requirements; ignoring a clear gap defeats the purpose.",
      b: "The problem is data loss (RPO), not recovery time, and targets come from the business need.",
      c: "Deleting backups makes data loss worse, not better.",
    },
  }),

  // ---------- Agreement types ----------
  q({
    id: "sis-agreement-types-1",
    conceptIds: ["agreement-types"],
    difficulty: "intermediate",
    scenario:
      "A company already has an overall contract with a consulting firm. For a new project, they write a document listing the deliverables, timeline and acceptance criteria for a firewall migration.",
    stem: "Which agreement is the new document?",
    options: [
      "Master service agreement (MSA)",
      "Memorandum of understanding (MOU)",
      "Statement of work (SOW)",
      "Non-disclosure agreement (NDA)",
    ],
    correct: ["c"],
    explanation:
      "A SOW defines the specific deliverables and schedule for one piece of work under the broader terms already set by an MSA.",
    why: {
      a: "The MSA is the existing overall contract; it doesn't list one project's deliverables.",
      b: "An MOU states non-binding intent to cooperate, not project deliverables.",
      d: "An NDA covers confidentiality, not the scope of work.",
    },
  }),

  // ---------- Compliance consequences ----------
  q({
    id: "sis-compliance-consequences-1",
    conceptIds: ["compliance-consequences"],
    difficulty: "exam",
    scenario:
      "A payment processor repeatedly fails its PCI DSS assessments and ignores the remediation deadlines given by the card brands.",
    stem: "Which consequence is MOST likely?",
    options: [
      "A lower risk appetite for the company",
      "An automatic reduction in its ALE",
      "A new SOC 2 Type II report",
      "Fines and possible loss of the ability to process card payments",
    ],
    correct: ["d"],
    explanation:
      "Ongoing non-compliance can lead to fines, sanctions and loss of the right or license to operate, here the ability to process cards.",
    why: {
      a: "Risk appetite is set by leadership; it isn't a penalty for non-compliance.",
      b: "Non-compliance tends to raise expected losses, not lower them.",
      c: "A SOC 2 report is an audit outcome, not a penalty for failing PCI DSS.",
    },
  }),

  // ---------- Audits and attestation ----------
  q({
    id: "sis-audits-attestation-1",
    conceptIds: ["audits-attestation"],
    difficulty: "intermediate",
    scenario:
      "A SaaS customer asks whether the provider's security controls actually worked over the past year, not just whether they were designed well.",
    stem: "Which report BEST answers this question?",
    options: [
      "SOC 2 Type I",
      "SOC 2 Type II",
      "An internal self-assessment",
      "A vulnerability scan report",
    ],
    correct: ["b"],
    explanation:
      "A SOC 2 Type II report has an independent auditor test how well controls operated over a period of time, usually 6 to 12 months.",
    why: {
      a: "Type I covers control design at a single point in time, not operation over a year.",
      c: "A self-assessment isn't independent, so it gives less assurance to customers.",
      d: "A scan shows technical weaknesses on one day, not whether controls worked all year.",
    },
  }),
  q({
    id: "sis-audits-attestation-2",
    conceptIds: ["audits-attestation"],
    difficulty: "exam",
    stem: "A company's internal audit team checks access reviews each quarter and reports to the audit committee. What is the main limitation of relying ONLY on this for assurance to regulators?",
    options: [
      "Internal audits can't review access controls",
      "Internal audits are always less detailed than external audits",
      "Internal auditors are not independent of the organization being audited",
      "Internal audits are forbidden by most regulations",
    ],
    correct: ["c"],
    explanation:
      "Internal audit is valuable, but outside parties often need independent assurance. That's why external audits and regulatory examinations exist.",
    why: {
      a: "Internal audits commonly review access controls.",
      b: "Internal audits can be very detailed; the issue is independence, not depth.",
      d: "Regulations generally encourage internal audits; they just may not be sufficient alone.",
    },
  }),

  // ---------- Reconnaissance ----------
  q({
    id: "sis-reconnaissance-1",
    conceptIds: ["reconnaissance"],
    difficulty: "intermediate",
    scenario:
      "During an authorized test, a tester connects to port 25 on the company's mail server and records the software name and version it returns.",
    stem: "What kind of reconnaissance is this?",
    options: [
      "Passive reconnaissance using OSINT",
      "Active reconnaissance through banner grabbing",
      "Passive reconnaissance through DNS lookups",
      "Social engineering",
    ],
    correct: ["b"],
    explanation:
      "The tester connected directly to the target system to read its banner. Any direct interaction with the target makes it active reconnaissance.",
    why: {
      a: "OSINT uses public sources without touching the target; here the tester connected to it.",
      c: "No DNS lookup was done; the tester connected to the mail server itself.",
      d: "No person was manipulated; this was a direct technical connection.",
    },
  }),
  q({
    id: "sis-reconnaissance-2",
    conceptIds: ["reconnaissance"],
    difficulty: "exam",
    stem: "A red team wants to learn as much as possible about a target without creating any entries in the target's firewall or IDS logs. Which activity fits this goal?",
    options: [
      "Running an Nmap SYN scan against the public IP range",
      "Searching certificate transparency logs and job postings for system names",
      "Sending crafted packets to fingerprint the operating system",
      "Brute-forcing subdomains directly against the target's DNS server",
    ],
    correct: ["b"],
    explanation:
      "Certificate transparency logs and job postings are public sources that don't touch the target, so this is passive reconnaissance that leaves no trace in its logs.",
    why: {
      a: "Port scanning sends traffic to the target and can be logged.",
      c: "OS fingerprinting probes the target directly, which is active reconnaissance.",
      d: "Querying the target's own DNS server with many guesses interacts with it directly.",
    },
  }),

  // ---------- AI in security operations ----------
  q({
    id: "sis-ai-security-ops-1",
    conceptIds: ["ai-security-ops"],
    difficulty: "intermediate",
    scenario:
      "A SOC deploys an AI tool that learns each user's normal login times, locations and data volumes, then flags activity that differs sharply from that pattern.",
    stem: "Which use of AI is this?",
    options: [
      "User and entity behavior analytics (UEBA)",
      "A chatbot that answers analyst questions",
      "Signature-based detection",
      "Data poisoning",
    ],
    correct: ["a"],
    explanation:
      "UEBA uses machine learning to build a baseline of each user's normal behavior and alert on sharp deviations, a common AI use in security operations.",
    why: {
      b: "A chatbot helps analysts with questions; it doesn't learn user behavior patterns.",
      c: "Signature detection matches known bad patterns, not deviations from normal behavior.",
      d: "Data poisoning is an attack on a model's training data, not a defensive use.",
    },
  }),
  q({
    id: "sis-ai-security-ops-2",
    conceptIds: ["ai-security-ops"],
    difficulty: "exam",
    scenario:
      "An analyst asks the SOC's AI assistant to summarize a suspicious script. The summary looks confident but names a malware family that doesn't appear anywhere in the evidence.",
    stem: "What is the BEST practice for using this kind of AI output?",
    options: [
      "Trust the summary because the model was trained on threat data",
      "Stop using AI tools in the SOC entirely",
      "Treat the output as a lead and have the analyst verify it against the evidence",
      "Let the AI close the alert automatically to save time",
    ],
    correct: ["c"],
    explanation:
      "AI assistants can produce confident but wrong answers. A human should check them against real evidence before acting.",
    why: {
      a: "Training data doesn't prevent wrong claims; this answer already shows one.",
      b: "AI still saves time when its output is checked; banning it throws away that value.",
      d: "Closing alerts on unverified AI output could let a real threat through.",
    },
  }),

  // ---------- Attack frameworks ----------
  q({
    id: "sis-attack-frameworks-1",
    conceptIds: ["attack-frameworks"],
    difficulty: "intermediate",
    scenario:
      "An intelligence report describes an intrusion by linking four elements: the group responsible, the malware used, the command-and-control servers, and the targeted company.",
    stem: "Which framework is the report using?",
    options: [
      "Cyber Kill Chain",
      "MITRE ATT&CK",
      "NIST Cybersecurity Framework",
      "Diamond Model of Intrusion Analysis",
    ],
    correct: ["d"],
    explanation:
      "The Diamond Model connects adversary, capability, infrastructure and victim. The report uses exactly those four elements.",
    why: {
      a: "The Kill Chain describes attack stages in order, not these four linked elements.",
      b: "ATT&CK catalogs tactics and techniques, not this four-part relationship.",
      c: "The NIST CSF organizes defensive program activities, not intrusion analysis.",
    },
  }),
  q({
    id: "sis-attack-frameworks-2",
    conceptIds: ["attack-frameworks"],
    difficulty: "exam",
    stem: "A defender wants to stop an attack as early as possible, ideally before malware is ever sent to the target. According to the Cyber Kill Chain, which stage comes BEFORE delivery?",
    options: [
      "Weaponization",
      "Exploitation",
      "Installation",
      "Command and control",
    ],
    correct: ["a"],
    explanation:
      "The Kill Chain runs reconnaissance, weaponization, delivery, exploitation, installation, command and control, then actions on objectives. Weaponization is just before delivery.",
    why: {
      b: "Exploitation happens after the payload has been delivered.",
      c: "Installation follows exploitation, later in the chain.",
      d: "Command and control comes after installation, near the end.",
    },
  }),

  // ---------- Data poisoning ----------
  q({
    id: "sis-data-poisoning-1",
    conceptIds: ["data-poisoning"],
    difficulty: "exam",
    scenario:
      "A bank trains its fraud-detection model on a free transaction dataset downloaded from a public repository. Later, one pattern of fraudulent transfers is always scored as safe. The dataset turns out to contain planted records labeling that pattern as legitimate.",
    stem: "Which control would BEST have prevented this?",
    options: [
      "Encrypting the model file at rest",
      "Vetting the source and validating the contents of training data before use",
      "Adding a system prompt telling the model to ignore phishing",
      "Increasing the size of the model",
    ],
    correct: ["b"],
    explanation:
      "This is data poisoning through an untrusted dataset. Checking where training data comes from and validating its contents keeps planted records out of the model.",
    why: {
      a: "Encryption at rest protects the model file, not the quality of the data it learns from.",
      c: "A fraud-scoring model doesn't use prompts; prompt instructions target prompt injection, not poisoned training data.",
      d: "A bigger model trained on poisoned data still learns the poisoned labels.",
    },
  }),

  // ---------- Hardcoded secrets ----------
  q({
    id: "sis-hardcoded-secrets-1",
    conceptIds: ["hardcoded-secrets"],
    difficulty: "intermediate",
    scenario:
      "A code review finds this line in a mobile app: const dbPassword = \"Summer2024!\";",
    stem: "What is the BEST way to fix this issue?",
    options: [
      "Change the password to a longer, more complex one in the same line",
      "Obfuscate the app so the string is harder to find",
      "Move the password into a config file bundled inside the app package",
      "Remove the secret from the code and retrieve it at runtime from a secrets manager or secure backend",
    ],
    correct: ["d"],
    explanation:
      "Secrets in code can be read by anyone who has the code or the app package. Keeping them in a secrets manager, or behind a backend, removes them from the code.",
    why: {
      a: "A stronger password is still readable in the code.",
      b: "Obfuscation slows attackers but the secret can still be extracted.",
      c: "A bundled config file ships with the app, so anyone can still extract the password from the package.",
    },
  }),
  q({
    id: "sis-hardcoded-secrets-2",
    conceptIds: ["hardcoded-secrets"],
    difficulty: "exam",
    scenario:
      "A developer accidentally pushed a commit containing a live API token, then pushed a second commit deleting the token from the file.",
    stem: "What should the security team do FIRST?",
    options: [
      "Nothing, because the token was removed in the next commit",
      "Revoke and replace the token",
      "Make the repository private",
      "Add the file to .gitignore",
    ],
    correct: ["b"],
    explanation:
      "The token is still in the repository history and may already have been copied. It must be treated as compromised and revoked right away.",
    why: {
      a: "Git keeps history, so the token is still retrievable from the earlier commit.",
      c: "Making it private doesn't help if the token was already copied.",
      d: ".gitignore only stops future commits of the file; it doesn't remove the exposed token.",
    },
  }),

  // ---------- Fileless / living off the land ----------
  q({
    id: "sis-lotl-fileless-1",
    conceptIds: ["lotl-fileless"],
    difficulty: "intermediate",
    stem: "Why do living-off-the-land attacks often evade traditional signature-based antivirus?",
    options: [
      "They use trusted built-in tools such as PowerShell, WMI and certutil instead of new malware files",
      "They always encrypt the entire hard drive first",
      "They only target systems without network access",
      "They rely on zero-day exploits in the antivirus engine",
    ],
    correct: ["a"],
    explanation:
      "The tools are legitimate, signed parts of the OS, so there's no malicious file for a signature to match. Behavior-based detection is needed instead.",
    why: {
      b: "Encrypting the drive describes ransomware, not the core idea of living off the land.",
      c: "These attacks often use networked systems to move laterally.",
      d: "They don't need antivirus zero-days; they avoid detection by using normal tools.",
    },
  }),
  q({
    id: "sis-lotl-fileless-2",
    conceptIds: ["lotl-fileless"],
    difficulty: "exam",
    scenario:
      "Logs show certutil.exe downloading a file from an unknown website on a workstation, and wmic.exe being used to run commands on other hosts. No new executables were found on disk.",
    stem: "Which control would BEST help detect and limit this activity?",
    options: [
      "Updating antivirus signatures more often",
      "Blocking all HTTPS traffic at the firewall",
      "EDR with behavioral rules plus application control limiting who can run admin tools",
      "Enabling full-disk encryption on workstations",
    ],
    correct: ["c"],
    explanation:
      "Behavioral EDR can flag unusual use of built-in tools, and application control can stop regular users from running them.",
    why: {
      a: "There are no malicious files to match, so more signatures don't help much.",
      b: "Blocking all HTTPS would break normal business and doesn't address the tool abuse.",
      d: "Disk encryption protects data at rest and doesn't detect running attacks.",
    },
  }),

  // ---------- Pharming ----------
  q({
    id: "sis-pharming-1",
    conceptIds: ["pharming"],
    difficulty: "exam",
    scenario:
      "Only users on one floor are being sent to a fake intranet login page. Their PCs resolve the intranet name to an external IP address, while other floors resolve it correctly.",
    stem: "What should the technician check FIRST?",
    options: [
      "The web server's TLS certificate expiry date",
      "The local hosts file and the DNS server settings on the affected PCs",
      "The email gateway's spam filter rules",
      "The users' password history",
    ],
    correct: ["b"],
    explanation:
      "Pharming redirects users through tampered name resolution. A changed hosts file or rogue DNS setting on those PCs would explain why only they resolve the wrong address.",
    why: {
      a: "An expired certificate wouldn't send users to a different IP address.",
      c: "The problem is how specific PCs resolve a name, not email delivery.",
      d: "Password history doesn't affect where a hostname resolves.",
    },
  }),
];
