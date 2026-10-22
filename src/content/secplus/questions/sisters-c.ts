import { q } from "./helpers";

// Sister questions: each concept has three differently-worded questions on the same idea.
export const sisterQuestionsC = [
  // ---------- Air gap ----------
  q({
    id: "sis-air-gap-1",
    conceptIds: ["air-gap"],
    difficulty: "exam",
    scenario:
      "A defense contractor keeps its weapons-design workstations on a network with no physical or wireless link to any other network. Engineers move approved files in using a dedicated, scanned USB drive.",
    stem: "Which threat remains the MOST significant for this environment?",
    options: [
      "Malware carried in on removable media",
      "Remote exploitation of an internet-facing service",
      "A distributed denial-of-service attack from a botnet",
      "Interception of traffic on the corporate WAN",
    ],
    correct: ["a"],
    explanation:
      "An isolated network can't be reached remotely, so removable media becomes the main path for malware to cross the gap. That is why the USB process is tightly controlled.",
    why: {
      b: "There is no internet connection, so there is no internet-facing service to exploit.",
      c: "A botnet can't send traffic to a network it has no connection to.",
      d: "The isolated network never carries traffic over the corporate WAN.",
    },
  }),
  q({
    id: "sis-air-gap-2",
    conceptIds: ["air-gap"],
    difficulty: "intermediate",
    stem: "Which statement BEST distinguishes an air-gapped system from a system on an isolated VLAN?",
    options: [
      "The air-gapped system has no network path at all, while a VLAN is a logical separation on shared switching hardware",
      "The air-gapped system uses stronger encryption than the VLAN",
      "The VLAN has no physical connection, while the air-gapped system is separated by firewall rules",
      "Both provide identical isolation; the terms are interchangeable",
    ],
    correct: ["a"],
    explanation:
      "An air gap is physical isolation with no connection to other networks. A VLAN only separates traffic logically, so misconfiguration or VLAN hopping can still bridge it.",
    why: {
      b: "Isolation is about connectivity, not encryption strength.",
      c: "This reverses the two; VLANs share physical gear and air gaps are not built from firewall rules.",
      d: "A VLAN still shares infrastructure with other networks, so it is weaker than true physical isolation.",
    },
  }),

  // ---------- Data states ----------
  q({
    id: "sis-data-states-1",
    conceptIds: ["data-states"],
    difficulty: "exam",
    scenario:
      "A payment application decrypts card numbers into memory so it can run fraud checks. The security team worries that malware could scrape the plaintext from RAM while the checks run.",
    stem: "Which data state is at risk, and which control BEST addresses it?",
    options: [
      "Data in use, protected with a secure enclave or trusted execution environment",
      "Data at rest, protected with full-disk encryption",
      "Data in transit, protected with TLS 1.3",
      "Data at rest, protected with database column encryption",
    ],
    correct: ["a"],
    explanation:
      "Data being processed in memory is data in use. A secure enclave keeps it protected even while the CPU works on it.",
    why: {
      b: "Full-disk encryption protects stored data, not plaintext sitting in RAM during processing.",
      c: "TLS protects data moving across a network, not data being processed.",
      d: "Column encryption protects stored values; the risk here is after they are decrypted into memory.",
    },
  }),

  // ---------- Shared responsibility ----------
  q({
    id: "sis-shared-responsibility-1",
    conceptIds: ["shared-responsibility"],
    difficulty: "intermediate",
    scenario:
      "A company uses a SaaS customer-relationship app. Its users have MFA and its sharing settings are correct, but attackers exploit an unpatched flaw in the vendor's web application software and read several customers' records.",
    stem: "Under the shared responsibility model, whose responsibility was the missed patch?",
    options: [
      "The customer's, because it chose this vendor",
      "The customer's, because SaaS customers patch the application servers",
      "The SaaS provider's, because it runs and maintains the application and the infrastructure under it",
      "Nobody's, because patching duties aren't covered by the model",
    ],
    correct: ["c"],
    explanation:
      "In SaaS the provider manages the application, the operating systems and the infrastructure, so patching its own software is the provider's job. The customer still handles its users, data and access settings.",
    why: {
      a: "Choosing a vendor is a customer decision, but it doesn't move the vendor's patching duty to the customer.",
      b: "SaaS customers have no access to the application servers; that layer belongs to the provider.",
      d: "Patching is a core part of the model; it is assigned to whoever controls that layer.",
    },
  }),

  // ---------- IaC ----------
  q({
    id: "sis-iac-1",
    conceptIds: ["iac"],
    difficulty: "exam",
    scenario:
      "A cloud team defines its networks and servers in Terraform templates stored in Git. An audit finds that one template opens SSH to 0.0.0.0/0, and every environment built from it has the same hole.",
    stem: "Which control would BEST catch this problem before deployment?",
    options: [
      "Automated scanning of templates for misconfigurations in the CI/CD pipeline",
      "Running a vulnerability scan against production every quarter",
      "Enabling full-disk encryption on every server",
      "Requiring administrators to change SSH ports manually after each build",
    ],
    correct: ["a"],
    explanation:
      "Because IaC templates are code, they can be reviewed and scanned before anything is built. Catching the rule in the pipeline stops the flaw from spreading to every environment.",
    why: {
      b: "A quarterly scan finds the hole after it is already live, not before deployment.",
      c: "Disk encryption doesn't change which ports are exposed to the internet.",
      d: "Manual post-build fixes cause configuration drift, which IaC is meant to prevent.",
    },
  }),
  q({
    id: "sis-iac-2",
    conceptIds: ["iac"],
    difficulty: "intermediate",
    scenario:
      "An engineer logs into a production server built from an IaC template and changes a firewall setting by hand to fix an urgent issue. Weeks later, the server no longer matches the template.",
    stem: "What is this situation called?",
    options: ["Configuration drift", "Privilege escalation", "Version control", "Horizontal scaling"],
    correct: ["a"],
    explanation:
      "When a running system is changed outside the template, it drifts from the defined baseline. The fix is to make the change in the code and redeploy.",
    why: {
      b: "Privilege escalation is gaining higher rights than granted; the engineer used rights they already had.",
      c: "Version control is the practice of tracking template changes, which was bypassed here.",
      d: "Horizontal scaling adds more instances to handle load; it has nothing to do with mismatched settings.",
    },
  }),

  // ---------- Serverless and microservices ----------
  q({
    id: "sis-serverless-microservices-1",
    conceptIds: ["serverless-microservices"],
    difficulty: "exam",
    scenario:
      "A startup runs its image-resizing logic as cloud functions that start only when a file is uploaded. It has no servers of its own to patch.",
    stem: "Which security task does the startup STILL own in this serverless model?",
    options: [
      "Granting each function only the permissions it needs",
      "Patching the operating system the functions run on",
      "Securing the physical hosts in the provider's data center",
      "Maintaining the hypervisor that isolates function runtimes",
    ],
    correct: ["a"],
    explanation:
      "In serverless, the provider manages the servers and runtime, but the customer still controls the function code, its configuration and the identity permissions it uses.",
    why: {
      b: "The provider patches the underlying OS in a serverless platform.",
      c: "Physical security of data centers is always the provider's responsibility.",
      d: "The hypervisor and isolation layer are managed by the provider.",
    },
  }),
  q({
    id: "sis-serverless-microservices-2",
    conceptIds: ["serverless-microservices"],
    difficulty: "intermediate",
    scenario:
      "An e-commerce site is rebuilt as separate services for cart, payment, search and shipping. A bug in the search service crashes it, but customers can still check out.",
    stem: "Which characteristic of microservices does this BEST illustrate?",
    options: [
      "Fault isolation between independently running services",
      "Shared kernel between containers",
      "Single sign-on across services",
      "Centralized monolithic deployment",
    ],
    correct: ["a"],
    explanation:
      "Microservices run independently, so one failing service doesn't take down the others. That limits the impact of both bugs and compromises.",
    why: {
      b: "A shared kernel describes how containers run, not why one service's failure stayed contained.",
      c: "SSO is an authentication approach and doesn't explain why checkout kept working.",
      d: "A monolith is the opposite; in a monolith one crash could take down the whole site.",
    },
  }),

  // ---------- Containers and virtualization ----------
  q({
    id: "sis-containers-virtualization-1",
    conceptIds: ["containers-virtualization"],
    difficulty: "exam",
    scenario:
      "Monitoring shows a process inside a VM interacting directly with the hypervisor and reading memory belonging to a different tenant's VM on the same host.",
    stem: "Which attack is MOST likely occurring?",
    options: ["VM escape", "VM sprawl", "Container image poisoning", "ARP poisoning"],
    correct: ["a"],
    explanation:
      "Breaking out of a guest VM to reach the hypervisor or other guests is a VM escape. It defeats the isolation that virtualization is supposed to provide.",
    why: {
      b: "VM sprawl is uncontrolled growth of unmanaged VMs, not an attack that breaks isolation.",
      c: "A poisoned image plants malicious code before deployment; it doesn't describe crossing into another tenant's VM.",
      d: "ARP poisoning redirects local network traffic, not memory access through the hypervisor.",
    },
  }),
  q({
    id: "sis-containers-virtualization-2",
    conceptIds: ["containers-virtualization"],
    difficulty: "intermediate",
    scenario:
      "A team needs to run a Windows legacy app and a Linux web app on the same physical server, and each must have its own fully separate operating system.",
    stem: "Which technology fits BEST?",
    options: [
      "Virtual machines on a type 1 hypervisor",
      "Containers on a single Linux host",
      "A serverless function platform",
      "A network-attached storage appliance",
    ],
    correct: ["a"],
    explanation:
      "Each VM runs its own complete OS on the hypervisor, so different operating systems can run side by side with strong separation.",
    why: {
      b: "Containers share the host kernel, so a Linux host can't give each workload its own separate OS.",
      c: "Serverless runs short functions on the provider's platform, not full legacy operating systems.",
      d: "NAS provides file storage, not separate operating environments.",
    },
  }),

  // ---------- ICS/SCADA/IoT ----------
  q({
    id: "sis-ics-scada-iot-1",
    conceptIds: ["ics-scada-iot"],
    difficulty: "exam",
    scenario:
      "A security analyst proposes running an aggressive vulnerability scan across a factory's control network during production hours.",
    stem: "Why would the plant engineers MOST likely object?",
    options: [
      "Older controllers may crash under the scan, stopping physical processes and risking safety",
      "Control systems always encrypt traffic, so scans return no results",
      "Industrial networks never contain vulnerabilities worth scanning for",
      "Scanning would violate the controllers' cloud licensing terms",
    ],
    correct: ["a"],
    explanation:
      "OT systems put availability and safety first, and fragile embedded devices can fail when probed. Scans are usually passive or done during planned downtime.",
    why: {
      b: "Many industrial protocols are unencrypted, and encryption wouldn't stop a scanner from finding hosts.",
      c: "ICS devices often have many unpatched flaws; the concern is disruption, not lack of findings.",
      d: "Controllers usually aren't cloud licensed, and licensing isn't the safety issue here.",
    },
  }),
  q({
    id: "sis-ics-scada-iot-2",
    conceptIds: ["ics-scada-iot"],
    difficulty: "intermediate",
    scenario:
      "An office installs dozens of smart cameras and thermostats. A review finds they all still use the manufacturer's default admin password and sit on the same network as employee laptops.",
    stem: "Which action BEST reduces the risk from these IoT devices?",
    options: [
      "Change default credentials and move the devices to a separate network segment",
      "Install endpoint antivirus agents on each camera and thermostat",
      "Disable logging on the devices to reduce their attack surface",
      "Connect the devices directly to the internet so the vendor can update them",
    ],
    correct: ["a"],
    explanation:
      "Default passwords and flat networks are the classic IoT weaknesses. Fixing the credentials and segmenting the devices limits both takeover and lateral movement.",
    why: {
      b: "Most IoT devices can't run standard antivirus agents.",
      c: "Disabling logging removes visibility without fixing the weak passwords or flat network.",
      d: "Direct internet exposure increases the attack surface instead of reducing it.",
    },
  }),

  // ---------- Security zones / DMZ ----------
  q({
    id: "sis-security-zones-dmz-1",
    conceptIds: ["security-zones-dmz"],
    difficulty: "exam",
    scenario:
      "A company hosts a public mail relay in its screened subnet. A firewall review shows a rule allowing the relay to open connections to any host on the internal LAN.",
    stem: "Why is this rule a problem?",
    options: [
      "If the relay is compromised, the attacker can pivot freely into the internal network",
      "It prevents internet users from reaching the mail relay",
      "It forces all internal email to be sent unencrypted",
      "It moves the mail relay out of the screened subnet and onto the LAN",
    ],
    correct: ["a"],
    explanation:
      "The point of a DMZ is that public servers can't freely reach inside. Broad DMZ-to-LAN access lets an attacker who owns the relay move straight into the internal zone.",
    why: {
      b: "The rule controls traffic from the relay inward; it doesn't block inbound internet mail.",
      c: "A firewall allow rule doesn't change whether mail is encrypted.",
      d: "The server's location doesn't change; the problem is the trust the rule grants it.",
    },
  }),

  // ---------- Failure modes ----------
  q({
    id: "sis-failure-modes-1",
    conceptIds: ["failure-modes"],
    difficulty: "exam",
    scenario:
      "A hospital places an inline IPS in front of the network that carries patient monitoring data, and wants it to keep blocking attacks while it is healthy. Clinical staff insist that monitoring must never stop, even if the IPS hardware fails.",
    stem: "Which configuration BEST meets the clinical requirement?",
    options: [
      "Fail-open, so traffic continues to flow if the IPS fails",
      "Fail-closed, so all traffic stops if the IPS fails",
      "Passive mode on a SPAN port with no inline path",
      "Fail-closed with a longer power-on self-test",
    ],
    correct: ["a"],
    explanation:
      "Fail-open keeps traffic moving when the device fails, which puts availability ahead of inspection. For patient monitoring, staying available is the stated priority.",
    why: {
      b: "Fail-closed would cut off patient monitoring during a failure, which the requirement forbids.",
      c: "Passive mode removes blocking entirely, giving up IPS protection even when the device is healthy.",
      d: "A longer self-test doesn't change the fact that fail-closed blocks traffic during a failure.",
    },
  }),
  q({
    id: "sis-failure-modes-2",
    conceptIds: ["failure-modes"],
    difficulty: "intermediate",
    stem: "Which security principle does a fail-closed configuration favor over availability?",
    options: ["Confidentiality and integrity", "Non-repudiation only", "Scalability", "Elasticity"],
    correct: ["a"],
    explanation:
      "Fail-closed blocks everything when a control breaks, so nothing unchecked gets through. It protects data and systems at the cost of uptime.",
    why: {
      b: "Non-repudiation is about proving who did something, not how a device behaves when it fails.",
      c: "Scalability is about handling growth in load, not failure behavior.",
      d: "Elasticity is adding and removing resources on demand, unrelated to failure modes.",
    },
  }),

  // ---------- Device placement ----------
  q({
    id: "sis-device-placement-1",
    conceptIds: ["device-placement"],
    difficulty: "exam",
    scenario:
      "A sensor is connected to a switch's mirror port. It detects a known exploit in progress and raises a high-severity alert, but the malicious packets still reach the target server.",
    stem: "Why couldn't the sensor stop the attack?",
    options: [
      "It only receives a copy of the traffic and is not in the path to block it",
      "Its signatures were out of date",
      "It was configured to fail-closed",
      "Mirror ports only carry encrypted traffic",
    ],
    correct: ["a"],
    explanation:
      "A device on a mirror port is passive: it sees copies of packets, so it can detect and alert but can't drop the originals.",
    why: {
      b: "The sensor did recognize the exploit, so its signatures were working.",
      c: "Fail-closed only matters for inline devices; a passive sensor isn't in the traffic path at all.",
      d: "Mirror ports copy whatever traffic crosses the switch, encrypted or not.",
    },
  }),
  q({
    id: "sis-device-placement-2",
    conceptIds: ["device-placement"],
    difficulty: "intermediate",
    stem: "Which is a drawback of placing a security device inline rather than passively?",
    options: [
      "If it fails or is overloaded, it can disrupt or slow production traffic",
      "It can only alert and can never block malicious traffic",
      "It receives only a copy of packets and may miss some under load",
      "It can't inspect traffic at all",
    ],
    correct: ["a"],
    explanation:
      "An inline device sits in the traffic path, so its failures and delays affect real traffic. That is the trade-off for being able to block.",
    why: {
      b: "Blocking is the main advantage of inline placement; alert-only describes passive devices.",
      c: "Receiving copies and dropping some under load is a weakness of taps or SPAN ports.",
      d: "Inline devices inspect every packet that passes through them.",
    },
  }),

  // ---------- Jump server and proxy ----------
  q({
    id: "sis-jump-server-proxy-1",
    conceptIds: ["jump-server-proxy"],
    difficulty: "exam",
    scenario:
      "A company wants every employee web request to pass through one system that blocks malicious sites, caches common content and logs which user visited which URL.",
    stem: "Which solution BEST fits this requirement?",
    options: ["A forward proxy", "A jump server", "A reverse proxy in front of the company website", "A site-to-site VPN"],
    correct: ["a"],
    explanation:
      "A forward proxy makes outbound requests on behalf of internal clients, so it can filter, cache and log their browsing.",
    why: {
      b: "A jump server is for admins reaching secured systems, not for filtering user web browsing.",
      c: "A reverse proxy handles inbound requests to the company's own servers, not employees' outbound browsing.",
      d: "A site-to-site VPN links networks but doesn't filter or log web requests by itself.",
    },
  }),
  q({
    id: "sis-jump-server-proxy-2",
    conceptIds: ["jump-server-proxy"],
    difficulty: "intermediate",
    scenario:
      "All administrator access to a company's production zone now passes through a single jump host. A new security architect says this host needs even stricter hardening and monitoring than the servers behind it.",
    stem: "Why is the architect right?",
    options: [
      "The jump host caches web content, so it stores sensitive browsing data",
      "It is the one path with admin access to many secured systems, so compromising it would give an attacker that same reach",
      "Jump hosts must be placed directly on the internet",
      "Jump hosts replace the need for MFA on production servers",
    ],
    correct: ["b"],
    explanation:
      "Funneling admin access through one host shrinks the attack surface, but it also concentrates risk. That host must be locked down, patched, protected with MFA and closely logged.",
    why: {
      a: "Caching web content is what a forward proxy does, not a jump host.",
      c: "A jump host sits at the edge of the secure zone and should be reachable only by authorized admins, not the open internet.",
      d: "A jump host adds a control point; it doesn't remove the need for strong authentication.",
    },
  }),

  // ---------- IDS vs IPS ----------
  q({
    id: "sis-ids-ips-1",
    conceptIds: ["ids-ips"],
    difficulty: "exam",
    scenario:
      "After a new IPS goes live, several legitimate payroll transfers are blocked because their traffic pattern resembles a known attack signature.",
    stem: "What is the MOST accurate description of this outcome?",
    options: [
      "False positives, which cause more harm with an IPS because it blocks instead of only alerting",
      "False negatives caused by outdated signatures",
      "True positives showing the payroll system is compromised",
      "A fail-open event caused by IPS overload",
    ],
    correct: ["a"],
    explanation:
      "Legitimate traffic flagged as malicious is a false positive. An IDS would only alert, but an IPS acts on the match, so false positives interrupt real business.",
    why: {
      b: "A false negative is missed malicious traffic; here legitimate traffic was wrongly caught.",
      c: "The transfers were legitimate, so these were not true positives.",
      d: "Fail-open would let traffic pass, not block it.",
    },
  }),

  // ---------- Firewall types ----------
  q({
    id: "sis-firewall-types-1",
    conceptIds: ["firewall-types"],
    difficulty: "intermediate",
    scenario:
      "A security manager wants to allow general web browsing on port 443 but block the use of a specific file-sharing application that also runs over port 443.",
    stem: "Which firewall capability is required?",
    options: [
      "Layer 7 application awareness, as found in an NGFW",
      "A layer 4 rule that denies TCP port 443",
      "A stateless packet filter based on source IP",
      "Network address translation on the perimeter router",
    ],
    correct: ["a"],
    explanation:
      "Because both apps use the same port, only a firewall that identifies the application itself can tell them apart. That is layer 7 inspection.",
    why: {
      b: "Blocking port 443 would block all HTTPS browsing, not just the one app.",
      c: "Filtering by source IP can't tell which application a user is running.",
      d: "NAT translates addresses and doesn't identify or block applications.",
    },
  }),

  // ---------- VPN ----------
  q({
    id: "sis-vpn-ipsec-tls-1",
    conceptIds: ["vpn-ipsec-tls"],
    difficulty: "exam",
    scenario:
      "Remote staff use a VPN configured so that only traffic for corporate subnets goes through the tunnel, while their other internet traffic goes directly out their home connection.",
    stem: "What is the MAIN security drawback of this configuration?",
    options: [
      "Internet traffic bypasses corporate web filtering and monitoring",
      "All traffic is routed through headquarters, causing latency",
      "Corporate traffic is sent without encryption",
      "Users can't reach internal applications",
    ],
    correct: ["a"],
    explanation:
      "This is a split tunnel. It saves bandwidth, but users' general browsing never passes through company security controls.",
    why: {
      b: "Sending everything through headquarters describes a full tunnel, not this setup.",
      c: "Corporate traffic still goes through the encrypted tunnel.",
      d: "Corporate subnets are routed through the tunnel, so internal apps are reachable.",
    },
  }),
  q({
    id: "sis-vpn-ipsec-tls-2",
    conceptIds: ["vpn-ipsec-tls"],
    difficulty: "intermediate",
    stem: "An IPsec VPN must encrypt the payload and also hide the original IP headers of packets between two gateways. Which mode and protocol should be used?",
    options: [
      "Tunnel mode with ESP",
      "Transport mode with AH",
      "Transport mode with ESP",
      "Tunnel mode with AH only",
    ],
    correct: ["a"],
    explanation:
      "ESP provides encryption, and tunnel mode wraps the whole original packet, including its IP header, inside a new one. This is the usual gateway-to-gateway setup.",
    why: {
      b: "AH authenticates but doesn't encrypt, and transport mode leaves the original header visible.",
      c: "Transport mode encrypts the payload but keeps the original IP header exposed.",
      d: "AH provides integrity and authentication only, with no encryption.",
    },
  }),

  // ---------- SASE / SD-WAN ----------
  q({
    id: "sis-sase-sdwan-1",
    conceptIds: ["sase-sdwan"],
    difficulty: "intermediate",
    scenario:
      "A retailer with 200 stores wants each store to send traffic over whichever of its broadband, LTE and MPLS links performs best, managed centrally, instead of relying on MPLS alone.",
    stem: "Which technology BEST meets this need?",
    options: ["SD-WAN", "Security service edge (SSE)", "A screened subnet", "Network access control"],
    correct: ["a"],
    explanation:
      "SD-WAN centrally manages several WAN links and steers traffic across them based on performance and policy.",
    why: {
      b: "SSE delivers cloud security services; it doesn't choose between a site's WAN links.",
      c: "A screened subnet is a zone for public servers, not a WAN routing approach.",
      d: "NAC checks devices before they join a LAN; it doesn't route traffic between sites.",
    },
  }),
  q({
    id: "sis-sase-sdwan-2",
    conceptIds: ["sase-sdwan"],
    difficulty: "exam",
    scenario:
      "A company already has an SD-WAN it is happy with. It now wants to add cloud-delivered secure web gateway, CASB and zero-trust network access, without replacing its networking.",
    stem: "Which offering BEST describes what it should buy?",
    options: [
      "Security service edge (SSE)",
      "A second SD-WAN vendor",
      "An on-premises UTM appliance at headquarters",
      "A site-to-site IPsec VPN mesh",
    ],
    correct: ["a"],
    explanation:
      "SSE is the security half of SASE: cloud-delivered SWG, CASB and ZTNA without the networking part. Combined with the existing SD-WAN, it forms a full SASE design.",
    why: {
      b: "Another SD-WAN adds networking, which the company already has, not cloud security services.",
      c: "An on-premises UTM isn't cloud-delivered and would require backhauling traffic.",
      d: "A VPN mesh provides encrypted links, not SWG, CASB or ZTNA.",
    },
  }),

  // ---------- Data classification ----------
  q({
    id: "sis-data-classification-1",
    conceptIds: ["data-classification"],
    difficulty: "exam",
    scenario:
      "A beverage company's secret recipe gives it a competitive edge. It is not patented and is not covered by any privacy or financial regulation.",
    stem: "Which data type BEST describes the recipe?",
    options: ["Trade secret", "Regulated data", "Public data", "Personally identifiable information"],
    correct: ["a"],
    explanation:
      "Valuable business information kept confidential to stay ahead of competitors is a trade secret. Its protection depends on keeping it secret.",
    why: {
      b: "Regulated data is governed by laws such as privacy or financial rules, which don't apply here.",
      c: "The recipe is deliberately kept secret, so it is the opposite of public.",
      d: "A recipe doesn't identify a person, so it isn't PII.",
    },
  }),
  q({
    id: "sis-data-classification-2",
    conceptIds: ["data-classification"],
    difficulty: "intermediate",
    stem: "What is the MAIN reason an organization labels data with classification levels?",
    options: [
      "So each data set gets protection controls that match its sensitivity",
      "So all data can be encrypted with the same key",
      "So data can be deleted automatically after 30 days",
      "So users can choose which security policies apply to them",
    ],
    correct: ["a"],
    explanation:
      "Classification tells everyone how sensitive data is, which decides handling, access and protection. It avoids both overprotecting public data and underprotecting secrets.",
    why: {
      b: "Using one key for everything ignores sensitivity, which is the point of classifying.",
      c: "Retention periods come from retention policy, not from classification labels alone.",
      d: "Policies are set by the organization based on the label, not chosen by users.",
    },
  }),

  // ---------- Data sovereignty ----------
  q({
    id: "sis-data-sovereignty-1",
    conceptIds: ["data-sovereignty"],
    difficulty: "exam",
    scenario:
      "A healthcare provider's contract requires patient records to stay inside its own country. Its cloud provider offers automatic replication to a region in another country for disaster recovery.",
    stem: "What should the provider do FIRST?",
    options: [
      "Make sure replication targets only regions within the required country",
      "Enable replication everywhere to maximize availability",
      "Encrypt the records and replicate them abroad, since encryption removes legal obligations",
      "Disable all backups to avoid moving data",
    ],
    correct: ["a"],
    explanation:
      "Data sovereignty means data falls under the laws of where it is stored. Keeping replicas in-country meets the requirement while still allowing disaster recovery.",
    why: {
      b: "Replicating abroad would break the in-country storage requirement.",
      c: "Encryption protects data but doesn't change which country's laws apply to where it sits.",
      d: "Dropping backups trades a legal problem for a serious availability risk; in-country replicas solve both.",
    },
  }),
  q({
    id: "sis-data-sovereignty-2",
    conceptIds: ["data-sovereignty"],
    difficulty: "intermediate",
    scenario:
      "A company only operates in two countries. Its security team blocks sign-ins to the HR system from IP addresses located anywhere else.",
    stem: "Which concept is being applied?",
    options: ["Geolocation-based access restriction", "Data masking", "Tokenization", "Impossible travel detection"],
    correct: ["a"],
    explanation:
      "Restricting access based on where a request comes from is a geolocation control. It supports keeping data use within approved locations.",
    why: {
      b: "Masking hides parts of data values; it doesn't restrict where users connect from.",
      c: "Tokenization replaces sensitive values with tokens, not location rules.",
      d: "Impossible travel flags logins from far-apart places in too short a time; this is a fixed location allowlist.",
    },
  }),

  // ---------- Site resilience ----------
  q({
    id: "sis-site-resilience-1",
    conceptIds: ["site-resilience"],
    difficulty: "exam",
    scenario:
      "A small nonprofit can tolerate being offline for several weeks after a disaster and has very little budget. It only needs a place with power, cooling and network hookups where equipment can be installed later.",
    stem: "Which recovery site BEST fits?",
    options: ["Cold site", "Hot site", "Warm site", "Active-active cloud region"],
    correct: ["a"],
    explanation:
      "A cold site provides only space and utilities. It is the cheapest option and suits organizations that can accept a long recovery time.",
    why: {
      b: "A hot site is fully equipped and current, far more than this budget or timeline needs.",
      c: "A warm site already has hardware, costing more than the nonprofit requires.",
      d: "Active-active replication is the most expensive approach, designed for near-zero downtime.",
    },
  }),

  // ---------- Backups ----------
  q({
    id: "sis-backups-1",
    conceptIds: ["backups"],
    difficulty: "intermediate",
    scenario:
      "A company has backed up its file servers nightly for two years. During a real outage, the team discovers the backup files are corrupted and can't be restored.",
    stem: "Which practice would MOST likely have revealed this problem earlier?",
    options: [
      "Regularly performing test restores",
      "Switching from full to incremental backups",
      "Encrypting the backup files",
      "Increasing backup frequency to hourly",
    ],
    correct: ["a"],
    explanation:
      "A backup is only proven good when it is restored. Scheduled restore tests catch corruption before it matters.",
    why: {
      b: "Changing backup type doesn't check whether the backups can actually be restored.",
      c: "Encryption protects confidentiality but doesn't verify the data is usable.",
      d: "More frequent backups would just create more untested, possibly corrupt copies.",
    },
  }),

  // ---------- Resilience testing ----------
  q({
    id: "sis-resilience-testing-1",
    conceptIds: ["resilience-testing"],
    difficulty: "exam",
    scenario:
      "A bank processes the same day's transactions at both its primary data center and its recovery site, then compares the results. Production is never switched off.",
    stem: "Which type of test is this?",
    options: ["Parallel processing", "Failover test", "Tabletop exercise", "Simulation"],
    correct: ["a"],
    explanation:
      "Running the recovery site alongside production with the same workload is parallel processing. It proves the backup site works without risking live operations.",
    why: {
      b: "A failover test actually moves production to the backup site, which didn't happen here.",
      c: "A tabletop is a discussion with no systems run at all.",
      d: "A simulation acts out a scenario but doesn't run real transactions at both sites.",
    },
  }),
  q({
    id: "sis-resilience-testing-2",
    conceptIds: ["resilience-testing"],
    difficulty: "intermediate",
    scenario:
      "A company wants the strongest proof that its secondary data center can really take over. It is willing to accept some risk of disruption during the test.",
    stem: "Which test should it run?",
    options: ["A failover test", "A tabletop exercise", "A walkthrough of the BCP document", "A parallel processing test"],
    correct: ["a"],
    explanation:
      "A failover test actually switches production to the secondary site, which is the most realistic proof and also carries the most risk.",
    why: {
      b: "A tabletop only talks through the plan, so it can't prove the site works.",
      c: "A document walkthrough checks the plan's content, not the infrastructure.",
      d: "Parallel processing keeps production on the primary site, so it never proves the secondary can carry the load alone.",
    },
  }),
];
