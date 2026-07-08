// ============================================================
// Safe practical labs — 100% synthetic, local, analysis-only.
// No real targets, credentials, or exploits. See docs/SAFETY_BOUNDARIES.md
// IPs use RFC 5737 documentation ranges; domains are fictional.
// ============================================================
import type { Difficulty, Severity } from '../types'

export interface LabFinding {
  title: string
  severity: Severity
  impact: string
  remediation: string
}

export interface Lab {
  id: string
  title: string
  category: string
  glyph: string
  color: string
  difficulty: Difficulty
  brief: string
  scope: { allowed: string[]; forbidden: string[] }
  evidenceTitle: string
  evidence: string
  objectives: string[]
  guiding: { q: string; a: string }[]
  modelFindings: LabFinding[]
}

export const LABS: Lab[] = [
  {
    id: 'soc-bruteforce',
    title: 'SOC Triage: Suspicious Logins',
    category: 'SOC',
    glyph: '☰',
    color: '#48cae4',
    difficulty: 'easy',
    brief:
      'You are a SOC analyst reviewing an authentication log from a synthetic internal app. Build a short timeline, decide whether this is an attack, and recommend containment. Analysis only — you never touch a real system.',
    scope: {
      allowed: ['The provided synthetic log below', 'Local note-taking and the report builder'],
      forbidden: ['Any real host or account', 'Any external lookup of the fake IPs/users', 'Generating traffic'],
    },
    evidenceTitle: 'auth.log (synthetic)',
    evidence: `2026-07-08T01:12:03Z user=alice src=198.51.100.24 result=SUCCESS mfa=yes
2026-07-08T02:40:11Z user=bob   src=203.0.113.77 result=FAIL reason=bad_password
2026-07-08T02:40:14Z user=bob   src=203.0.113.77 result=FAIL reason=bad_password
2026-07-08T02:40:19Z user=bob   src=203.0.113.77 result=FAIL reason=bad_password
2026-07-08T02:41:02Z user=carol src=203.0.113.77 result=FAIL reason=bad_password
2026-07-08T02:41:05Z user=dave  src=203.0.113.77 result=FAIL reason=bad_password
... (417 similar FAIL events across 60 usernames in 9 minutes) ...
2026-07-08T02:49:58Z user=erin  src=203.0.113.77 result=SUCCESS mfa=no
2026-07-08T02:50:31Z user=erin  src=203.0.113.77 action=export_all_records`,
    objectives: [
      'Classify the activity (single-account brute force vs password spraying vs credential stuffing)',
      'Identify the pivot event where the attacker likely succeeded',
      'List two indicators you would alert on',
      'Recommend an immediate containment action',
    ],
    guiding: [
      {
        q: 'Is this brute force against one account or spraying across many?',
        a: 'Password spraying — a single source tries a few passwords against many usernames (60 users) rather than many passwords against one, which evades per-account lockout.',
      },
      {
        q: 'What is the most important event in the log?',
        a: "The SUCCESS for user=erin with mfa=no from the same attacking IP, immediately followed by a bulk export — that is the compromise and the impact.",
      },
      {
        q: 'Why did MFA matter here?',
        a: 'Every earlier success had mfa=yes; the compromised account had mfa=no. Enforcing MFA universally would likely have blocked the takeover.',
      },
    ],
    modelFindings: [
      {
        title: 'Account takeover via password spraying against MFA-less account',
        severity: 'high',
        impact: 'One account with MFA disabled was accessed from the attacking source and used to export all records.',
        remediation: 'Enforce MFA for all users, add source-based rate limiting and spray detection (many users / one IP), and force-reset the affected account.',
      },
      {
        title: 'No lockout / alerting on high-volume authentication failures',
        severity: 'medium',
        impact: '417 failures in 9 minutes went unblocked and (implicitly) unalerted.',
        remediation: 'Add velocity-based detection and temporary source throttling; alert the SOC on failure spikes per source IP.',
      },
    ],
  },
  {
    id: 'cloud-iam',
    title: 'Cloud Config Review: Over-Permissive IAM',
    category: 'Cloud',
    glyph: '⛁',
    color: '#00b4d8',
    difficulty: 'medium',
    brief:
      'Review a synthetic cloud IAM policy and a storage bucket setting. Identify least-privilege and exposure problems and propose safe fixes. Config review only.',
    scope: {
      allowed: ['The synthetic policy JSON below', 'The report builder'],
      forbidden: ['Any real cloud account', 'Applying changes anywhere', 'Credential use'],
    },
    evidenceTitle: 'role-policy.json + bucket (synthetic)',
    evidence: `// IAM policy attached to role: app-runtime
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": "*", "Resource": "*" }
  ]
}

// storage bucket: neoncorp-reports
{
  "public_access": true,
  "encryption_at_rest": false,
  "access_logging": false
}`,
    objectives: [
      'Explain what is wrong with the IAM statement',
      'Identify the three risky bucket settings',
      'Rewrite the policy intent using least privilege (in words)',
      'Prioritise the fixes',
    ],
    guiding: [
      {
        q: 'Why is Action:"*" / Resource:"*" dangerous for a runtime role?',
        a: 'It grants every action on every resource. If the app is compromised, the blast radius is the entire account. Runtime roles should have only the specific actions on the specific resources they need.',
      },
      {
        q: 'Which bucket setting is the most urgent?',
        a: 'public_access:true — it may expose report data to anyone. Disable public access first, then add encryption at rest and access logging.',
      },
    ],
    modelFindings: [
      {
        title: 'Wildcard IAM permissions on runtime role',
        severity: 'critical',
        impact: 'Full account compromise is possible if the application is breached.',
        remediation: 'Replace with least-privilege statements scoped to required actions and specific resource ARNs; review with an access analyzer.',
      },
      {
        title: 'Publicly accessible, unencrypted, unlogged storage bucket',
        severity: 'high',
        impact: 'Potential data exposure with no encryption and no audit trail of access.',
        remediation: 'Block public access, enable encryption at rest, and turn on access logging/monitoring.',
      },
    ],
  },
  {
    id: 'web-idor',
    title: 'Web AppSec: Broken Access Control',
    category: 'Web',
    glyph: '⧉',
    color: '#39ff14',
    difficulty: 'medium',
    brief:
      'Read a captured request/response pair from a synthetic toy app. Decide whether authorization is enforced correctly and describe the secure fix. Static review only — no live app.',
    scope: {
      allowed: ['The static request/response below', 'The report builder'],
      forbidden: ['Sending any request anywhere', 'Any real application', 'Payload crafting against real targets'],
    },
    evidenceTitle: 'request / response (synthetic)',
    evidence: `# Logged in as user id=1002 (session cookie for user 1002)
GET /api/invoices/5581 HTTP/1.1
Host: shop.example.internal
Cookie: session=<user-1002-session>

HTTP/1.1 200 OK
Content-Type: application/json

{ "invoice_id": 5581, "owner_user_id": 1007, "total": "412.00",
  "billing_name": "Synthetic Customer 1007" }`,
    objectives: [
      'Name the vulnerability class',
      'Explain how you know authorization failed',
      'Describe the correct server-side check',
      'State the impact in one sentence',
    ],
    guiding: [
      {
        q: 'What class of flaw is this?',
        a: 'Insecure Direct Object Reference (IDOR), a form of Broken Access Control — user 1002 successfully read invoice 5581 that belongs to user 1007.',
      },
      {
        q: 'What is the correct fix?',
        a: 'Enforce object-level authorization on the server for every request: verify the invoice’s owner_user_id matches the authenticated session before returning it. Never rely on unguessable IDs.',
      },
    ],
    modelFindings: [
      {
        title: 'Missing server-side object-level authorization (IDOR)',
        severity: 'high',
        impact: 'Any authenticated user can read other users’ invoice data by changing the ID.',
        remediation: 'Enforce ownership checks on every object access server-side; add automated authorization tests.',
      },
    ],
  },
  {
    id: 'net-cleartext',
    title: 'Network Review: Cleartext Credentials',
    category: 'Network',
    glyph: '⊟',
    color: '#9d4edd',
    difficulty: 'easy',
    brief:
      'A synthetic packet summary from a training capture is provided. Identify protocols exposing sensitive data and recommend hardening. You review a static summary — no capturing or sniffing.',
    scope: {
      allowed: ['The static packet summary below', 'The report builder'],
      forbidden: ['Running a sniffer', 'Any real network or traffic', 'Any credential use'],
    },
    evidenceTitle: 'capture-summary.txt (synthetic)',
    evidence: `No.  Time     Source          Dest            Proto  Info
12   0.48     192.0.2.10 -> 192.0.2.50   FTP    USER svc_backup
13   0.51     192.0.2.10 -> 192.0.2.50   FTP    PASS  (cleartext) ******
44   3.02     192.0.2.11 -> 192.0.2.60   HTTP   POST /login  (form, no TLS)
45   3.03     192.0.2.60 -> 192.0.2.11   HTTP   200 OK  Set-Cookie: sid=... (no Secure flag)
88   9.14     192.0.2.12 -> 192.0.2.70   TELNET login: admin`,
    objectives: [
      'List every protocol here that exposes credentials or sessions in cleartext',
      'Explain the risk of the missing cookie Secure flag',
      'Recommend a secure replacement for each protocol',
    ],
    guiding: [
      {
        q: 'Which protocols are the problem?',
        a: 'FTP (cleartext USER/PASS), HTTP login without TLS, and Telnet — all transmit credentials or sessions unencrypted and are trivially readable by anyone on-path.',
      },
      {
        q: 'What does a missing Secure flag on the session cookie allow?',
        a: 'The cookie can be sent over plain HTTP and captured on-path, enabling session hijacking. Set Secure + HttpOnly and serve only over TLS.',
      },
    ],
    modelFindings: [
      {
        title: 'Credentials and sessions transmitted in cleartext',
        severity: 'high',
        impact: 'On-path observers can capture service, web, and admin credentials.',
        remediation: 'Replace FTP with SFTP/FTPS, enforce HTTPS for login, replace Telnet with SSH, and set Secure/HttpOnly on cookies.',
      },
    ],
  },
  {
    id: 'phish-headers',
    title: 'Phishing Analysis: Email Headers',
    category: 'Awareness',
    glyph: '✉',
    color: '#ffcc00',
    difficulty: 'easy',
    brief:
      'Analyse the headers of a synthetic suspicious email. Decide if it is likely phishing and justify with the authentication results. Header analysis only — you never open links or reply.',
    scope: {
      allowed: ['The header block below', 'The report builder'],
      forbidden: ['Opening any link', 'Replying or forwarding', 'Any real inbox or sender'],
    },
    evidenceTitle: 'message headers (synthetic)',
    evidence: `From: "IT Helpdesk" <support@neoncorp-it.example>
Reply-To: helpdesk@secure-neoncorp.example
To: employee@neoncorp.example
Subject: [URGENT] Your password expires in 2 hours — verify now

Authentication-Results: mx.neoncorp.example;
  spf=fail (sender IP not permitted) smtp.mailfrom=neoncorp-it.example;
  dkim=none;
  dmarc=fail action=quarantine
X-Sender-IP: 203.0.113.200`,
    objectives: [
      'State whether SPF, DKIM, and DMARC passed or failed',
      'Identify the two social-engineering pressure tactics',
      'Spot the lookalike domain trick',
      'Recommend the correct user + org response',
    ],
    guiding: [
      {
        q: 'What do the authentication results tell you?',
        a: 'spf=fail, dkim=none, dmarc=fail — the message is not authenticated and DMARC says quarantine. Combined with the lookalike domains, this is almost certainly phishing.',
      },
      {
        q: 'What is the domain trick?',
        a: 'The From/Reply-To use lookalike domains (neoncorp-it.example, secure-neoncorp.example) rather than the real neoncorp.example — classic display-name and cousin-domain spoofing.',
      },
    ],
    modelFindings: [
      {
        title: 'Credential-harvesting phishing with failed email authentication',
        severity: 'medium',
        impact: 'Recipients could be tricked into surrendering credentials via a lookalike domain.',
        remediation: 'Report/quarantine per DMARC, block the cousin domains, and reinforce awareness: verify via known channels, never via urgent email links.',
      },
    ],
  },
  {
    id: 'threat-model',
    title: 'Threat Modeling: STRIDE Pass',
    category: 'Threat Model',
    glyph: '❖',
    color: '#ff3366',
    difficulty: 'hard',
    brief:
      'Given a small synthetic architecture, identify assets, trust boundaries, and one threat per relevant STRIDE category, then prioritise mitigations. A pure design exercise.',
    scope: {
      allowed: ['The architecture description below', 'The report builder'],
      forbidden: ['Any real system or diagram tool integration', 'Any scanning or testing'],
    },
    evidenceTitle: 'architecture.md (synthetic)',
    evidence: `NeonNotes — a fictional note app
- Browser SPA  ──HTTPS──>  API (Node)  ──>  Postgres DB
- API also calls a third-party "AI summary" service over the internet
- JWTs signed with a shared secret; secret stored in an env var in the repo's .env (committed)
- File uploads stored in a public object bucket
Trust boundaries: browser<->API (internet), API<->AI service (internet), API<->DB (internal)`,
    objectives: [
      'List the key assets and the trust boundaries',
      'Give one concrete threat for Spoofing, Tampering, Info Disclosure, and Elevation',
      'Identify the single most urgent issue',
      'Rank the top three mitigations',
    ],
    guiding: [
      {
        q: 'What is the most urgent issue?',
        a: 'The JWT signing secret is committed to the repo in .env. Anyone with repo access can forge tokens (Spoofing + Elevation). Rotate the secret, remove it from the repo, and load it from a secrets manager.',
      },
      {
        q: 'Where is Information Disclosure most likely?',
        a: 'The public object bucket for uploads (anyone can read files) and the outbound call to the third-party AI service (note contents leave your boundary) — both need review.',
      },
    ],
    modelFindings: [
      {
        title: 'Signing secret committed to source control',
        severity: 'critical',
        impact: 'Token forgery and account impersonation by anyone with repo access.',
        remediation: 'Rotate immediately, purge from history, and load from a secrets manager; scan for secrets in CI.',
      },
      {
        title: 'Public upload bucket and unbounded third-party data egress',
        severity: 'high',
        impact: 'User content may be exposed publicly or sent to an external service without controls.',
        remediation: 'Make the bucket private with scoped access, and gate/redact data sent to the AI service with a data-handling agreement.',
      },
    ],
  },
]

export function labById(id: string): Lab | undefined {
  return LABS.find((l) => l.id === id)
}
