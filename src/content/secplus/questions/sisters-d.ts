import { q } from "./helpers";

// Sister questions: each concept has three differently-worded questions on the same idea.
export const sisterQuestionsD = [
  // ---------- EDR ----------
  q({
    id: "sis-edr-1",
    conceptIds: ["edr"],
    difficulty: "intermediate",
    scenario:
      "Traditional antivirus on a company's laptops only matches known malware signatures. The security team also wants a recorded timeline of process, file and network activity on each laptop, and the ability to cut a laptop off the network remotely during an incident.",
    stem: "Which solution BEST meets these needs?",
    options: [
      "Endpoint detection and response (EDR)",
      "Network-based intrusion detection system (NIDS)",
      "Host-based firewall",
      "Full-disk encryption",
    ],
    correct: ["a"],
    explanation:
      "EDR agents continuously record endpoint behavior for investigation and let responders isolate or remediate a host remotely.",
    why: {
      b: "A NIDS watches network traffic, not process and file activity inside each laptop, and cannot isolate a host.",
      c: "A host firewall filters connections but does not record a behavioral timeline or support investigation.",
      d: "Full-disk encryption protects data on a lost device; it does not detect or respond to threats.",
    },
  }),

  // ---------- DLP ----------
  q({
    id: "sis-dlp-1",
    conceptIds: ["dlp"],
    difficulty: "exam",
    scenario:
      "A hospital tags files that contain patient records. Staff sometimes copy those files to personal USB drives to work from home, which policy forbids.",
    stem: "Which control would MOST directly block the copy while still allowing other files to be saved to USB?",
    options: [
      "An endpoint DLP policy that inspects content and blocks protected data from going to removable media",
      "Disabling all USB ports through Group Policy",
      "File integrity monitoring on the patient record share",
      "Full-disk encryption on every workstation",
    ],
    correct: ["a"],
    explanation:
      "Endpoint DLP recognizes sensitive content and can block it from leaving through a specific channel like USB, without stopping all USB use.",
    why: {
      b: "Disabling USB entirely stops all files, not just the sensitive ones, which goes beyond the requirement.",
      c: "FIM alerts when files change; it does not stop files from being copied out.",
      d: "Disk encryption protects the workstation's own drive, not data copied to an external device.",
    },
  }),

  // ---------- Just-in-time permissions ----------
  q({
    id: "sis-jit-permissions-1",
    conceptIds: ["jit-permissions"],
    difficulty: "intermediate",
    scenario:
      "After a breach review, auditors note that 40 engineers hold standing domain admin rights, although each uses them only a few times a month.",
    stem: "Which change would MOST reduce the window in which a stolen engineer account could be abused for admin actions?",
    options: [
      "Grant admin rights on request for a short, time-limited period that expires automatically",
      "Require engineers to change their passwords every 30 days",
      "Move the admin accounts into a separate organizational unit",
      "Increase logging on domain controllers",
    ],
    correct: ["a"],
    explanation:
      "Just-in-time access removes standing privilege, so admin rights exist only briefly when needed and a stolen account usually has none.",
    why: {
      b: "Frequent password changes don't remove the standing privilege an attacker would inherit.",
      c: "Moving accounts to another OU changes where policies apply but leaves the rights in place.",
      d: "Logging helps detect abuse afterward; it doesn't shrink the time the rights are available.",
    },
  }),
  q({
    id: "sis-jit-permissions-2",
    conceptIds: ["jit-permissions"],
    difficulty: "exam",
    scenario:
      "A company's new access portal requires MFA and manager approval before an engineer gets admin rights, and it logs every request. Six months later, an audit finds 30 engineers still holding admin rights they requested once for a single task.",
    stem: "Which element of just-in-time access is MISSING?",
    options: [
      "Grants that expire and are removed automatically after a set time",
      "An approval step before rights are granted",
      "Multifactor authentication on the access portal",
      "A log of who requested elevated rights",
    ],
    correct: ["a"],
    explanation:
      "Just-in-time access means rights exist only while needed. Without automatic expiry, every approved request turns back into standing privilege.",
    why: {
      b: "The portal already requires manager approval.",
      c: "The portal already requires MFA.",
      d: "The portal already logs every request; logging doesn't remove leftover rights.",
    },
  }),

  // ---------- Threat hunting ----------
  q({
    id: "sis-threat-hunting-1",
    conceptIds: ["threat-hunting"],
    difficulty: "intermediate",
    stem: "Which statement BEST describes how threat hunting differs from normal SOC alert triage?",
    options: [
      "Hunters start from a hypothesis and actively search for threats that have not triggered any alert",
      "Hunters only respond after the SIEM raises a high-severity alert",
      "Hunters run authenticated vulnerability scans against every server",
      "Hunters are external testers hired to break in under a signed scope",
    ],
    correct: ["a"],
    explanation:
      "Threat hunting is proactive: it assumes something may already be hidden and looks for it without waiting for an alert.",
    why: {
      b: "Responding to alerts is reactive triage, which is exactly what hunting goes beyond.",
      c: "Vulnerability scanning finds weaknesses, not attackers already present.",
      d: "That describes penetration testing, which simulates an attack instead of searching for a real one.",
    },
  }),
  q({
    id: "sis-threat-hunting-2",
    conceptIds: ["threat-hunting"],
    difficulty: "exam",
    scenario:
      "An analyst suspects attackers may be using legitimate remote admin tools to move laterally. She queries a month of endpoint logs for remote admin tool executions on workstations where IT staff never log in, and finds two unexplained hosts.",
    stem: "What should the analyst do NEXT with these findings?",
    options: [
      "Investigate the two hosts and, if malicious, hand them to incident response and turn the query into a detection rule",
      "Close the hunt because no alert was generated for those hosts",
      "Uninstall the remote admin tool from every device in the company",
      "Publish the hostnames to an ISAC before confirming anything",
    ],
    correct: ["a"],
    explanation:
      "A hunt that finds suspicious activity leads to investigation and, if confirmed, incident response; useful hunt logic should become a new detection.",
    why: {
      b: "The lack of an alert is the reason hunting exists; unexplained findings must be checked.",
      c: "Removing the tool everywhere is a drastic step taken before anything is confirmed and would disrupt IT.",
      d: "Sharing unconfirmed internal findings externally is premature and may expose sensitive data.",
    },
  }),

  // ---------- Chain of custody ----------
  q({
    id: "sis-chain-of-custody-1",
    conceptIds: ["chain-of-custody"],
    difficulty: "exam",
    scenario:
      "During a court case, the defense shows that a seized phone sat on an unlocked desk for a weekend and no one recorded who had access to it.",
    stem: "Which weakness is the defense MOST likely exploiting?",
    options: [
      "A gap in the chain of custody",
      "A missing legal hold notice",
      "An incorrect order of volatility",
      "A lack of non-repudiation in the phone's encryption",
    ],
    correct: ["a"],
    explanation:
      "An undocumented period where anyone could have handled the evidence breaks the chain of custody and lets the defense question whether it was altered.",
    why: {
      b: "A legal hold tells people to preserve data; it doesn't track physical handling of seized evidence.",
      c: "Order of volatility is about which data to collect first, not how the device was stored afterward.",
      d: "Non-repudiation is a cryptographic property and isn't what an unsecured desk undermines.",
    },
  }),

  // ---------- Threat intelligence ----------
  q({
    id: "sis-threat-intel-1",
    conceptIds: ["threat-intel"],
    difficulty: "intermediate",
    scenario:
      "A small company has no budget for paid feeds. Its analyst reads government security advisories, public vendor blogs and free community blocklists to learn about new threats.",
    stem: "Which type of threat intelligence source is the analyst using?",
    options: [
      "Open-source intelligence (OSINT)",
      "Proprietary third-party feed",
      "Information Sharing and Analysis Center (ISAC)",
      "Dark-web monitoring service",
    ],
    correct: ["a"],
    explanation:
      "Publicly available advisories, blogs and free lists are open-source intelligence.",
    why: {
      b: "Proprietary feeds are paid commercial products, which the company cannot afford.",
      c: "An ISAC is a sector membership group sharing among peers, not general public sources.",
      d: "Dark-web monitoring watches criminal forums and markets, not public advisories.",
    },
  }),
  q({
    id: "sis-threat-intel-2",
    conceptIds: ["threat-intel"],
    difficulty: "exam",
    scenario:
      "A retailer wants early warning if its customers' stolen credentials or its own internal documents are offered for sale on criminal marketplaces.",
    stem: "Which intelligence source BEST fits this goal?",
    options: [
      "Dark-web monitoring",
      "Vulnerability scanning",
      "OSINT from vendor security blogs",
      "NetFlow analysis",
    ],
    correct: ["a"],
    explanation:
      "Dark-web monitoring watches criminal forums and marketplaces for the organization's leaked data or credentials.",
    why: {
      b: "Vulnerability scans find weaknesses on your own systems, not data being sold elsewhere.",
      c: "Vendor blogs describe threats in general and won't show your specific stolen data for sale.",
      d: "NetFlow summarizes your own network traffic and can't see criminal marketplaces.",
    },
  }),

  // ---------- CVE / CVSS ----------
  q({
    id: "sis-cvss-cve-1",
    conceptIds: ["cvss-cve"],
    difficulty: "beginner",
    scenario:
      "A vendor advisory states: \"CVE-2026-31337, CVSS 9.8, remote code execution in the web management interface.\"",
    stem: "What does the value 9.8 represent?",
    options: [
      "The vulnerability's severity score on a 0 to 10 scale",
      "The unique identifier assigned to the vulnerability",
      "The probability that the flaw will be exploited this year",
      "The version of the product that fixes the flaw",
    ],
    correct: ["a"],
    explanation:
      "CVSS rates how severe a vulnerability is from 0 to 10; 9.8 is critical.",
    why: {
      b: "The identifier is the CVE number, CVE-2026-31337.",
      c: "CVSS measures severity characteristics, not a predicted likelihood of exploitation.",
      d: "CVSS is not a version number; patch versions come from the vendor's advisory.",
    },
  }),
  q({
    id: "sis-cvss-cve-2",
    conceptIds: ["cvss-cve"],
    difficulty: "intermediate",
    scenario:
      "Three different security tools each report the same OpenSSL flaw, but each tool uses its own internal name for it. The team wants to confirm they are all talking about the same vulnerability.",
    stem: "What should the team compare?",
    options: [
      "The CVE identifier each tool lists for the finding",
      "The CVSS score each tool assigns",
      "The scan start time in each report",
      "The plugin ID from each tool vendor",
    ],
    correct: ["a"],
    explanation:
      "A CVE ID is a common, public identifier for one specific vulnerability, so it links findings across tools.",
    why: {
      b: "Many different vulnerabilities share the same score, so a matching score doesn't prove they are the same flaw.",
      c: "Scan times say nothing about which vulnerability was found.",
      d: "Plugin IDs are vendor-specific and differ between tools, which is the problem here.",
    },
  }),

  // ---------- MFA fatigue ----------
  q({
    id: "sis-mfa-fatigue-1",
    conceptIds: ["mfa-fatigue"],
    difficulty: "intermediate",
    scenario:
      "The identity provider log shows 37 push MFA requests to one user within 20 minutes, all from an unfamiliar country, followed by one approval and a successful sign-in.",
    stem: "Which attack does this log MOST likely show?",
    options: [
      "MFA fatigue (push bombing)",
      "Password spraying",
      "SIM swapping",
      "Pass-the-hash",
    ],
    correct: ["a"],
    explanation:
      "Repeated push requests until the user finally approves one is the MFA fatigue pattern; the attacker already had the password.",
    why: {
      b: "Password spraying tries one password across many accounts; here one account gets many MFA prompts.",
      c: "SIM swapping hijacks a phone number to receive SMS codes, not to trigger push approvals.",
      d: "Pass-the-hash reuses NTLM hashes on a network and doesn't involve push notifications.",
    },
  }),
  q({
    id: "sis-mfa-fatigue-2",
    conceptIds: ["mfa-fatigue"],
    difficulty: "exam",
    stem: "Which TWO measures BEST reduce the success of MFA fatigue attacks? (Select TWO.)",
    options: [
      "Showing the sign-in location and requesting application in each push prompt",
      "Limiting the number of push requests and alerting on repeated denials",
      "Increasing the minimum password length to 16 characters",
      "Letting users approve prompts from a smartwatch with one tap",
      "Extending session timeouts so users are prompted less often",
    ],
    correct: ["a", "b"],
    explanation:
      "Showing where and what a sign-in is for helps users spot a request that isn't theirs, and rate limiting with alerts on repeated prompts blocks the flood and warns the SOC.",
    why: {
      c: "Fatigue attacks already have the password, so a longer password doesn't stop the prompt flood.",
      d: "One-tap approval on a watch makes careless approvals even easier.",
      e: "Longer sessions reduce legitimate prompts but do nothing to stop an attacker's flood of requests.",
    },
  }),

  // ---------- Wireless security ----------
  q({
    id: "sis-wireless-security-1",
    conceptIds: ["wireless-security"],
    difficulty: "intermediate",
    scenario:
      "Before installing access points in a new warehouse, the network team walks the building with a spectrum analyzer to measure signal strength and interference, and produces a heat map.",
    stem: "What is this activity called?",
    options: [
      "Wireless site survey",
      "War driving",
      "Penetration test",
      "Rogue access point sweep only",
    ],
    correct: ["a"],
    explanation:
      "A site survey measures coverage and interference, often shown as a heat map, to plan where access points should go.",
    why: {
      b: "War driving is searching for other people's wireless networks, usually from a vehicle.",
      c: "A penetration test tries to exploit weaknesses; this is planning coverage.",
      d: "Surveys can reveal rogue APs, but planning placement with a heat map is the main purpose here.",
    },
  }),
  q({
    id: "sis-wireless-security-2",
    conceptIds: ["wireless-security"],
    difficulty: "exam",
    scenario:
      "A home-office style router still offers WPA2-Personal. Security wants stronger protection against offline dictionary attacks on the shared passphrase, but the small branch has no RADIUS server.",
    stem: "Which option BEST meets this requirement?",
    options: [
      "WPA3-Personal using SAE",
      "WEP with a 128-bit key",
      "WPA2-Enterprise with 802.1X",
      "Hiding the SSID",
    ],
    correct: ["a"],
    explanation:
      "WPA3-Personal uses SAE, which resists offline guessing of the passphrase and needs no RADIUS server.",
    why: {
      b: "WEP is broken and far weaker than WPA2.",
      c: "Enterprise mode needs a RADIUS server, which the branch doesn't have.",
      d: "A hidden SSID is still easily discovered and does nothing for passphrase strength.",
    },
  }),

  // ---------- Mobile deployment ----------
  q({
    id: "sis-mobile-deployment-1",
    conceptIds: ["mobile-deployment"],
    difficulty: "exam",
    scenario:
      "Employees use their own phones for work email. The company wants to protect corporate data but must not be able to erase personal photos if an employee leaves.",
    stem: "Which approach BEST meets this requirement?",
    options: [
      "Use MDM containerization so only the work profile can be selectively wiped",
      "Switch to a COPE model and perform full device wipes",
      "Ban mobile access to corporate email",
      "Require a 4-digit PIN on all phones",
    ],
    correct: ["a"],
    explanation:
      "On BYOD devices, a separate work container lets the company remove only corporate data with a selective wipe.",
    why: {
      b: "COPE means company-owned devices, and a full wipe would erase personal data.",
      c: "Banning access avoids the problem but doesn't meet the goal of letting staff use their phones.",
      d: "A PIN protects the device but doesn't separate corporate from personal data.",
    },
  }),

  // ---------- Application security ----------
  q({
    id: "sis-app-security-coding-1",
    conceptIds: ["app-security-coding"],
    difficulty: "intermediate",
    scenario:
      "A web form accepts a 'quantity' field. Testers submitted negative numbers, letters and a 5,000-character string, and each caused errors on the server.",
    stem: "Which technique should developers apply FIRST to this field?",
    options: [
      "Server-side input validation that allows only positive integers in an expected range",
      "Client-side JavaScript validation only",
      "Code signing of the web application",
      "Setting the Secure flag on session cookies",
    ],
    correct: ["a"],
    explanation:
      "Validating input on the server against an allow list of expected values rejects bad data before the application processes it.",
    why: {
      b: "Client-side checks are easily bypassed by sending requests directly to the server.",
      c: "Code signing proves where code came from; it doesn't check user input.",
      d: "The Secure flag keeps cookies on HTTPS and has nothing to do with form fields.",
    },
  }),

  // ---------- Sandboxing ----------
  q({
    id: "sis-sandboxing-1",
    conceptIds: ["sandboxing"],
    difficulty: "intermediate",
    scenario:
      "A malware analyst receives an unknown executable from an incident and wants to watch which files it creates and which domains it contacts, without risking the corporate network.",
    stem: "Where should the analyst run the file?",
    options: [
      "In an isolated sandbox environment",
      "On a production server with antivirus disabled",
      "On the analyst's own workstation with a host firewall",
      "On a domain controller to see its full impact",
    ],
    correct: ["a"],
    explanation:
      "A sandbox isolates the file so its behavior can be observed without it reaching real systems or data.",
    why: {
      b: "Running malware on production puts real systems and data at risk.",
      c: "A workstation on the corporate network isn't isolated; the malware could spread.",
      d: "A domain controller is one of the most critical systems and must never host unknown code.",
    },
  }),
  q({
    id: "sis-sandboxing-2",
    conceptIds: ["sandboxing"],
    difficulty: "exam",
    scenario:
      "A new browser vulnerability lets malicious web pages run code in the renderer process. The vendor says the impact is limited because the renderer cannot directly read files or start other programs on the operating system.",
    stem: "Which security feature is MOST likely limiting the impact?",
    options: [
      "Browser process sandboxing",
      "TLS certificate pinning",
      "Content filtering by category",
      "Same-origin policy",
    ],
    correct: ["a"],
    explanation:
      "The browser runs rendering code in a restricted sandbox, so even exploited code can't freely reach the operating system.",
    why: {
      b: "Certificate pinning protects connections from interception, not the OS from renderer code.",
      c: "Category filtering blocks sites; it doesn't restrict code that has already run.",
      d: "The same-origin policy separates websites from each other, not the browser from the OS.",
    },
  }),

  // ---------- Asset management ----------
  q({
    id: "sis-asset-management-1",
    conceptIds: ["asset-management"],
    difficulty: "intermediate",
    scenario:
      "During an incident, responders find a compromised server that no one recognizes. It isn't in any inventory and has no owner, so no one knows what data it holds or who can approve shutting it down.",
    stem: "Which process failure is MOST evident?",
    options: [
      "Asset inventory and ownership assignment",
      "Change advisory board review",
      "Data retention scheduling",
      "Vendor due diligence",
    ],
    correct: ["a"],
    explanation:
      "Every asset should be tracked in an inventory with an assigned owner; an unknown, ownerless server shows that process failed.",
    why: {
      b: "Change review may have been skipped, but the clear gap is that the asset was never tracked or owned.",
      c: "Retention schedules decide how long data is kept, not whether servers are tracked.",
      d: "Vendor due diligence assesses suppliers, not internal hardware.",
    },
  }),
  q({
    id: "sis-asset-management-2",
    conceptIds: ["asset-management"],
    difficulty: "exam",
    scenario:
      "A company will reuse laptops by giving them to new staff in another department. The drives held confidential HR files.",
    stem: "Which sanitization approach is MOST appropriate before the laptops are reissued?",
    options: [
      "Wipe the drives with the drive's built-in sanitize or crypto erase command, then confirm no data remains",
      "Shred the drives and issue a certificate of destruction",
      "Reformat the drives with a quick format",
      "Delete the HR folder and reinstall applications",
    ],
    correct: ["a"],
    explanation:
      "When hardware will be reused, sanitize it with a verified secure or cryptographic erase that makes data unrecoverable but keeps the drive usable.",
    why: {
      b: "Shredding is right for disposal, but it destroys drives the company plans to reuse.",
      c: "A quick format leaves data recoverable with simple tools.",
      d: "Deleting files leaves the data on disk where it can be recovered.",
    },
  }),

  // ---------- Static vs dynamic analysis ----------
  q({
    id: "sis-static-dynamic-analysis-1",
    conceptIds: ["static-dynamic-analysis"],
    difficulty: "intermediate",
    scenario:
      "A security team has only the URL of a deployed web application. It has no access to the source code and wants to find issues such as injection flaws by sending crafted requests.",
    stem: "Which testing approach fits BEST?",
    options: [
      "Dynamic application security testing (DAST)",
      "Static application security testing (SAST)",
      "Manual code review",
      "Software composition analysis of the source repository",
    ],
    correct: ["a"],
    explanation:
      "DAST tests a running application from the outside, so it works without source code.",
    why: {
      b: "SAST needs the source code, which the team doesn't have.",
      c: "Code review also requires the source code.",
      d: "Composition analysis scans dependency files in the repository, which isn't available.",
    },
  }),
  q({
    id: "sis-static-dynamic-analysis-2",
    conceptIds: ["static-dynamic-analysis"],
    difficulty: "exam",
    scenario:
      "A widely used open-source logging library the company depends on has a newly published critical vulnerability. The company wants to be told automatically whenever a library it uses gets a new known vulnerability.",
    stem: "Which practice BEST provides this?",
    options: [
      "Package monitoring of third-party dependencies",
      "Static analysis of the company's own source code",
      "A one-time dynamic scan before release",
      "Code signing of the build output",
    ],
    correct: ["a"],
    explanation:
      "Package monitoring tracks the libraries in use and alerts when new vulnerabilities are published for them.",
    why: {
      b: "SAST looks for flaws in the company's own code, not newly announced flaws in external libraries.",
      c: "A one-time scan won't alert on vulnerabilities disclosed later.",
      d: "Code signing proves who built the software; it doesn't track library vulnerabilities.",
    },
  }),

  // ---------- False positives ----------
  q({
    id: "sis-false-positives-1",
    conceptIds: ["false-positives"],
    difficulty: "intermediate",
    scenario:
      "An IDS fires 300 alerts a day for 'SQL injection' every time an internal reporting tool runs its normal, approved queries. Analysts have started ignoring the rule.",
    stem: "What is the BEST way to handle this?",
    options: [
      "Tune the rule with a narrow exception for the approved tool's known traffic",
      "Disable the SQL injection rule entirely",
      "Raise the alert to critical so analysts pay attention",
      "Leave it as is, because more alerts means better coverage",
    ],
    correct: ["a"],
    explanation:
      "These are false positives; a narrow, documented tuning removes the noise while keeping the rule active for real attacks.",
    why: {
      b: "Disabling the rule would create false negatives for real SQL injection attempts.",
      c: "Raising severity makes noisy alerts worse and increases alert fatigue.",
      d: "Ignored alerts give no real coverage and can hide true attacks.",
    },
  }),
  q({
    id: "sis-false-positives-2",
    conceptIds: ["false-positives"],
    difficulty: "exam",
    scenario:
      "A vulnerability scanner reports that a server is missing a patch. The administrator confirms the vendor's backported fix is installed, but the scanner only checks the version string, which didn't change.",
    stem: "How should this finding be classified?",
    options: [
      "False positive",
      "False negative",
      "True positive",
      "True negative",
    ],
    correct: ["a"],
    explanation:
      "The scanner reported a vulnerability that isn't actually present, which is a false positive.",
    why: {
      b: "A false negative is a real vulnerability the scanner failed to report.",
      c: "A true positive would mean the server really is vulnerable, but the fix is installed.",
      d: "A true negative means no finding was raised and none existed; here a finding was raised.",
    },
  }),

  // ---------- Bug bounty / disclosure ----------
  q({
    id: "sis-bug-bounty-disclosure-1",
    conceptIds: ["bug-bounty-disclosure"],
    difficulty: "intermediate",
    scenario:
      "A researcher found a flaw on a company's website but couldn't find anyone to tell, so she posted it on social media. The company wants future researchers to report privately first.",
    stem: "What should the company publish?",
    options: [
      "A responsible disclosure policy with a reporting contact and safe-harbor terms",
      "A data retention policy",
      "An acceptable use policy for employees",
      "A service level agreement for customers",
    ],
    correct: ["a"],
    explanation:
      "A responsible disclosure policy tells outside researchers how to report flaws privately and safely.",
    why: {
      b: "Retention policy covers how long data is kept, not vulnerability reporting.",
      c: "An AUP governs employee behavior, not outside researchers.",
      d: "An SLA defines service commitments to customers.",
    },
  }),
  q({
    id: "sis-bug-bounty-disclosure-2",
    conceptIds: ["bug-bounty-disclosure"],
    difficulty: "exam",
    stem: "Compared with hiring a single penetration testing firm, which is the MAIN advantage of a public bug bounty program?",
    options: [
      "A large, varied pool of researchers tests over time, with rewards tied to confirmed vulnerabilities",
      "It guarantees that every vulnerability will be found before release",
      "It removes the need for any internal security testing",
      "Researchers can test any system they choose without a defined scope",
    ],
    correct: ["a"],
    explanation:
      "A bug bounty brings many testers with varied skills over time, with payment tied to valid results.",
    why: {
      b: "No program can guarantee that every flaw is found.",
      c: "Bug bounties complement internal testing; they don't replace it.",
      d: "Bounty programs define a scope and rules of engagement; testing outside them isn't permitted.",
    },
  }),

  // ---------- Monitoring tools ----------
  q({
    id: "sis-monitoring-tools-1",
    conceptIds: ["monitoring-tools"],
    difficulty: "intermediate",
    scenario:
      "The network team wants switches and routers to send an immediate notification to the management station when an interface goes down, rather than waiting to be polled.",
    stem: "Which mechanism provides this?",
    options: [
      "SNMP traps",
      "NetFlow records",
      "SCAP benchmarks",
      "Packet capture",
    ],
    correct: ["a"],
    explanation:
      "An SNMP trap is a message a device sends on its own when an event happens, such as an interface going down.",
    why: {
      b: "NetFlow summarizes traffic conversations, not device status events.",
      c: "SCAP checks configurations against benchmarks; it doesn't send event notifications.",
      d: "Packet capture records traffic and doesn't report device status.",
    },
  }),

  // ---------- Web / DNS filtering ----------
  q({
    id: "sis-web-dns-filtering-1",
    conceptIds: ["web-dns-filtering"],
    difficulty: "intermediate",
    scenario:
      "HR asks IT to block gambling and adult websites for all employees, without maintaining a list of every individual site.",
    stem: "Which approach BEST meets this request?",
    options: [
      "Category-based web filtering",
      "Adding each site to the hosts file on every PC",
      "A network ACL blocking port 443",
      "File integrity monitoring on browsers",
    ],
    correct: ["a"],
    explanation:
      "Web filters group sites into categories maintained by the vendor, so whole categories can be blocked at once.",
    why: {
      b: "Editing hosts files means maintaining every site by hand on every PC.",
      c: "Blocking port 443 would break almost all legitimate HTTPS browsing.",
      d: "FIM watches file changes and doesn't control which sites are visited.",
    },
  }),
  q({
    id: "sis-web-dns-filtering-2",
    conceptIds: ["web-dns-filtering"],
    difficulty: "exam",
    scenario:
      "The resolver logs show many internal hosts requesting a newly registered domain that threat intelligence links to malware command-and-control. The resolver is configured to answer these requests with a sinkhole address.",
    stem: "Which control is in use?",
    options: [
      "DNS filtering",
      "DNSSEC",
      "SPF",
      "Port security",
    ],
    correct: ["a"],
    explanation:
      "DNS filtering refuses or redirects lookups for known-bad domains, so infected hosts can't reach their command server.",
    why: {
      b: "DNSSEC proves DNS answers are authentic; it doesn't block malicious domains.",
      c: "SPF lists permitted mail senders and has nothing to do with lookups for web or C2 domains.",
      d: "Port security limits MAC addresses on switch ports, not DNS resolution.",
    },
  }),

  // ---------- Email security ----------
  q({
    id: "sis-email-security-1",
    conceptIds: ["email-security"],
    difficulty: "exam",
    scenario:
      "A company starts using a cloud marketing platform to send newsletters from its own domain. Recipients' mail servers begin flagging the newsletters because the platform's servers aren't authorized to send for the domain.",
    stem: "Which DNS record should the company update?",
    options: [
      "The SPF record, to include the marketing platform's sending servers",
      "The DMARC record, to set the policy to none",
      "The MX record, to point to the marketing platform",
      "The PTR record for the company's mail server",
    ],
    correct: ["a"],
    explanation:
      "SPF lists which servers may send mail for the domain, so the platform's servers need to be added.",
    why: {
      b: "Relaxing DMARC weakens protection for everyone instead of authorizing the legitimate sender.",
      c: "MX records control where inbound mail is delivered, not who may send.",
      d: "The PTR record is for the company's own server's reverse lookup, not the third-party platform.",
    },
  }),

  // ---------- File integrity monitoring ----------
  q({
    id: "sis-file-integrity-monitoring-1",
    conceptIds: ["file-integrity-monitoring"],
    difficulty: "intermediate",
    scenario:
      "An alert reports that the hash of /etc/passwd on a web server no longer matches its stored baseline. No change ticket exists.",
    stem: "Which tool MOST likely generated this alert?",
    options: [
      "File integrity monitoring",
      "Data loss prevention",
      "NetFlow collector",
      "Web application firewall",
    ],
    correct: ["a"],
    explanation:
      "FIM stores baseline hashes of critical files and alerts when a current hash differs.",
    why: {
      b: "DLP watches sensitive data leaving the organization, not system file changes.",
      c: "NetFlow records traffic flows, not file contents.",
      d: "A WAF filters HTTP requests and doesn't hash files on the server.",
    },
  }),
  q({
    id: "sis-file-integrity-monitoring-2",
    conceptIds: ["file-integrity-monitoring"],
    difficulty: "exam",
    scenario:
      "After a monthly patch cycle, the FIM console shows hundreds of changed system files on every server, and analysts can't tell whether any change was malicious.",
    stem: "What is the BEST way to reduce this noise in the future?",
    options: [
      "Tie FIM to change management and update the baseline after approved patches",
      "Turn off FIM on servers that receive monthly patches",
      "Monitor only user documents instead of system files",
      "Stop hashing files and compare file names instead",
    ],
    correct: ["a"],
    explanation:
      "Linking expected changes to approved change windows and refreshing the baseline lets FIM highlight only unexpected changes.",
    why: {
      b: "Disabling FIM leaves a blind spot that an attacker could use.",
      c: "System files are the critical ones FIM is meant to protect.",
      d: "File names don't change when content is tampered with, so this would miss real attacks.",
    },
  }),

  // ---------- OS security: GPO / SELinux ----------
  q({
    id: "sis-os-security-gpo-selinux-1",
    conceptIds: ["os-security-gpo-selinux"],
    difficulty: "intermediate",
    scenario:
      "A web server process on a Linux host was compromised. Although the attacker gained the process's user, the system prevented it from reading files in users' home directories because policy labels didn't allow that process type to access them.",
    stem: "Which feature MOST likely enforced this restriction?",
    options: [
      "SELinux in enforcing mode",
      "Group Policy Objects",
      "Discretionary file permissions set by each user",
      "A host-based firewall",
    ],
    correct: ["a"],
    explanation:
      "SELinux applies mandatory access control based on labels, limiting what a process can access even if it is compromised.",
    why: {
      b: "Group Policy manages Windows domain machines, not Linux hosts.",
      c: "Discretionary permissions are set by owners; the label-based restriction points to mandatory access control.",
      d: "A host firewall controls network traffic, not file access.",
    },
  }),
  q({
    id: "sis-os-security-gpo-selinux-2",
    conceptIds: ["os-security-gpo-selinux"],
    difficulty: "exam",
    scenario:
      "An administrator troubleshooting a Linux application sets SELinux to permissive mode and the application starts working. He plans to leave it that way.",
    stem: "What is the security concern with this plan?",
    options: [
      "Permissive mode only logs policy violations and no longer blocks them",
      "Permissive mode deletes the SELinux policy from the system",
      "Permissive mode blocks all network traffic to the host",
      "Permissive mode forces Group Policy to override local settings",
    ],
    correct: ["a"],
    explanation:
      "In permissive mode SELinux records what it would have denied but allows it, so it gives no protection; the policy should be fixed and enforcing restored.",
    why: {
      b: "The policy stays on the system; it simply isn't enforced.",
      c: "SELinux mode doesn't block network traffic in this way.",
      d: "Group Policy is a Windows feature and is unrelated to SELinux modes.",
    },
  }),

  // ---------- Secure protocols ----------
  q({
    id: "sis-secure-protocols-1",
    conceptIds: ["secure-protocols"],
    difficulty: "exam",
    scenario:
      "A packet capture on the server VLAN shows an application binding to the directory server on TCP 389, with user passwords visible in the capture.",
    stem: "Which change BEST fixes this?",
    options: [
      "Use LDAPS on TCP 636",
      "Move LDAP to UDP 389",
      "Switch the application to SNMPv2c",
      "Use Telnet on TCP 23",
    ],
    correct: ["a"],
    explanation:
      "LDAPS wraps directory traffic in TLS on port 636, so credentials are encrypted in transit.",
    why: {
      b: "Changing the transport doesn't add encryption; credentials are still cleartext.",
      c: "SNMP is a device management protocol, and v2c sends community strings in cleartext.",
      d: "Telnet is a cleartext remote shell and unrelated to directory lookups.",
    },
  }),

  // ---------- Account lifecycle ----------
  q({
    id: "sis-account-lifecycle-1",
    conceptIds: ["account-lifecycle"],
    difficulty: "intermediate",
    scenario:
      "Three weeks after a contractor's engagement ended, logs show his VPN account was used to sign in from an unknown network.",
    stem: "Which process failure MOST likely allowed this?",
    options: [
      "Deprovisioning: the account wasn't disabled when the engagement ended",
      "Provisioning: the account was given too few permissions",
      "Password complexity requirements were too weak",
      "The VPN used split tunneling",
    ],
    correct: ["a"],
    explanation:
      "Accounts must be disabled promptly when a person leaves; an active account for a departed contractor is a deprovisioning failure.",
    why: {
      b: "Too few permissions wouldn't let someone keep using an account after leaving.",
      c: "Password strength matters, but the account shouldn't have existed to log in at all.",
      d: "Split tunneling affects traffic routing, not whether an old account still works.",
    },
  }),
  q({
    id: "sis-account-lifecycle-2",
    conceptIds: ["account-lifecycle"],
    difficulty: "exam",
    scenario:
      "An HR system update triggers a script that creates a new hire's directory account, adds the account to the groups for their job role, and assigns a mailbox before their first day.",
    stem: "Which lifecycle stage does this automate, and what is its main security benefit?",
    options: [
      "Provisioning, giving consistent role-based access instead of copying another user's rights",
      "Deprovisioning, removing access when people leave",
      "Permission creep, adding rights as people change roles",
      "Recertification, reviewing whether existing access is still needed",
    ],
    correct: ["a"],
    explanation:
      "Creating accounts with access based on the job role is provisioning; automating it avoids over-granting from ad hoc copying.",
    why: {
      b: "Deprovisioning removes access at departure, not on a new hire's arrival.",
      c: "Permission creep is a problem to prevent, not a lifecycle stage.",
      d: "Recertification reviews existing access later; this creates new access.",
    },
  }),

  // ---------- Federation / SSO ----------
  q({
    id: "sis-federation-sso-1",
    conceptIds: ["federation-sso"],
    difficulty: "exam",
    scenario:
      "Two partner companies want each other's staff to use a shared project portal. Each company wants its own users to sign in with their home company's credentials, and neither wants to manage accounts for the other's staff.",
    stem: "Which approach BEST meets this requirement?",
    options: [
      "Federation, where the portal trusts each company's identity provider",
      "Creating local portal accounts for every partner employee",
      "Sharing one portal account per company",
      "Synchronizing both companies' LDAP directories into one",
    ],
    correct: ["a"],
    explanation:
      "Federation lets an application trust identities asserted by another organization's identity provider, so each company keeps managing its own users.",
    why: {
      b: "Local accounts mean someone must manage the other company's users, which both want to avoid.",
      c: "Shared accounts remove individual accountability.",
      d: "Merging directories is heavy, exposes internal data, and isn't needed for trust between organizations.",
    },
  }),

  // ---------- Password policy ----------
  q({
    id: "sis-password-policy-1",
    conceptIds: ["password-policy"],
    difficulty: "intermediate",
    stem: "Which password policy change follows current best practice and MOST improves security?",
    options: [
      "Require long passphrases and block passwords found in known breach lists",
      "Force password changes every 30 days",
      "Require exactly eight characters with one symbol",
      "Allow password hints displayed on the login page",
    ],
    correct: ["a"],
    explanation:
      "Length and screening against breached passwords make passwords much harder to guess or reuse from leaks.",
    why: {
      b: "Frequent forced changes lead to predictable patterns and aren't recommended without evidence of compromise.",
      c: "A short fixed length limits strength; length matters more than symbols.",
      d: "Hints help attackers guess the password.",
    },
  }),
  q({
    id: "sis-password-policy-2",
    conceptIds: ["password-policy"],
    difficulty: "exam",
    scenario:
      "A company rolls out passkeys. Users sign in with a fingerprint on their phone or laptop, and the site never receives a reusable secret.",
    stem: "Why is this MORE resistant to credential theft than passwords?",
    options: [
      "A private key stays on the device and signs a challenge only for the site that registered it",
      "The fingerprint image is sent to the website and compared",
      "The password is simply hidden behind the biometric prompt",
      "It uses SMS codes that expire quickly",
    ],
    correct: ["a"],
    explanation:
      "Passkeys use public-key cryptography: the private key never leaves the device and only answers challenges for the correct site, so there is nothing to phish or reuse.",
    why: {
      b: "Biometrics only unlock the key locally; the fingerprint isn't sent to the site.",
      c: "There is no password; the site stores only a public key.",
      d: "Passkeys don't use SMS codes.",
    },
  }),

  // ---------- Automation / orchestration ----------
  q({
    id: "sis-automation-orchestration-1",
    conceptIds: ["automation-orchestration"],
    difficulty: "intermediate",
    scenario:
      "When EDR flags ransomware behavior, a SOAR playbook automatically isolates the host, opens a ticket, collects the alert details and notifies the on-call analyst.",
    stem: "Which benefit does this MOST directly provide?",
    options: [
      "Faster, consistent response across separate tools",
      "Elimination of the need for human analysts",
      "Guaranteed prevention of ransomware infections",
      "Replacement of the organization's backups",
    ],
    correct: ["a"],
    explanation:
      "Orchestration ties tools together so repeatable response steps happen quickly and the same way every time.",
    why: {
      b: "Analysts still investigate and make decisions; automation supports them.",
      c: "The playbook responds after detection; it doesn't guarantee prevention.",
      d: "Automation doesn't replace backups, which are still needed for recovery.",
    },
  }),
  q({
    id: "sis-automation-orchestration-2",
    conceptIds: ["automation-orchestration"],
    difficulty: "exam",
    scenario:
      "A team automates account creation with a script that runs with domain admin rights. The script has no error handling and has not been reviewed.",
    stem: "Which risk of automation does this MOST clearly show?",
    options: [
      "A single flaw can be repeated at scale and becomes a high-value target or point of failure",
      "Automation always increases the number of manual steps",
      "Scripts make account creation slower than doing it by hand",
      "Automated actions cannot be logged",
    ],
    correct: ["a"],
    explanation:
      "Poorly built automation spreads mistakes quickly, and a highly privileged script is an attractive target, so it needs review, least privilege and error handling.",
    why: {
      b: "Automation reduces manual steps; that's its purpose.",
      c: "Scripts are usually faster, not slower.",
      d: "Automated actions can and should be logged.",
    },
  }),

  // ---------- IR exercises ----------
  q({
    id: "sis-ir-exercises-1",
    conceptIds: ["ir-exercises"],
    difficulty: "exam",
    scenario:
      "The security team stages a realistic fake ransomware event: test servers are taken offline, responders follow the playbook in real time, and restore steps are actually performed from backups.",
    stem: "Which type of exercise is this?",
    options: [
      "Simulation",
      "Tabletop exercise",
      "Lessons-learned meeting",
      "Root cause analysis",
    ],
    correct: ["a"],
    explanation:
      "A simulation exercises the response with real actions on systems, unlike a discussion-only tabletop.",
    why: {
      b: "A tabletop is a discussion; no systems are touched.",
      c: "Lessons learned happens after a real incident or exercise, not as the exercise itself.",
      d: "Root cause analysis investigates why an incident happened, not how well staff respond.",
    },
  }),

  // ---------- Investigation data sources ----------
  q({
    id: "sis-investigation-data-sources-1",
    conceptIds: ["investigation-data-sources"],
    difficulty: "intermediate",
    scenario:
      "An analyst needs to know which process on a laptop made a suspicious outbound connection and what user account launched it.",
    stem: "Which data source BEST answers this?",
    options: [
      "Endpoint logs from the laptop, such as EDR or OS process logs",
      "Firewall logs at the perimeter",
      "NetFlow records from the core switch",
      "A recent vulnerability scan report",
    ],
    correct: ["a"],
    explanation:
      "Only the endpoint knows which process and user created a connection; network sources see only addresses and ports.",
    why: {
      b: "Firewall logs show the connection's IPs and ports, not the process or user.",
      c: "NetFlow shows who talked to whom and how much, not which program did it.",
      d: "A vulnerability scan lists weaknesses, not activity that happened.",
    },
  }),
];
