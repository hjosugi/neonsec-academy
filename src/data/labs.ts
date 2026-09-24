// ============================================================
// Safe practical labs — 100% synthetic, local, analysis-only.
// No real targets, credentials, or exploits. See docs/SAFETY_BOUNDARIES.md
// IPs use RFC 5737 documentation ranges; domains are fictional.
// ============================================================
import type { Difficulty, Severity } from '../types'

export type LabKind = 'local' | 'dataset' | 'simulated' | 'writeup'

/** Dataset-analysis challenge families (P4-004). */
export type AnalysisChallengeType = 'pcap' | 'web-log' | 'auth-log' | 'cloud-config' | 'firewall-rule' | 'email-headers'

export interface LabAnalysis {
  type: AnalysisChallengeType
  /** How a defender would detect this pattern in their own telemetry. */
  detection: string
  /** Preventive control that removes or reduces the risk. */
  prevention: string
}

export interface LabFinding {
  title: string
  severity: Severity
  impact: string
  remediation: string
}

export type FlagChallengeAssetKind = 'log' | 'config' | 'request-response' | 'capture' | 'headers' | 'architecture'

/** Web security concepts covered by static request/response concept labs (P4-005). */
export type WebConceptKey = 'access-control' | 'input-validation' | 'session' | 'security-headers'

export interface WebConceptLab {
  concept: WebConceptKey
  /** Shown above the artifact: why the learner must not test real targets. */
  unsafeTargetWarning: string
}

export interface FlagChallengeAsset {
  id: string
  label: string
  kind: FlagChallengeAssetKind
  description: string
}

export interface FlagChallengeDefinition {
  prompt: string
  assets: FlagChallengeAsset[]
  expectedFlag: string
  hints: string[]
  explanation: string
  remediation: string
  reportPrompt: string
}

export type LabScoreComponentKey = 'flag' | 'evidence' | 'explanation' | 'remediation' | 'safety'

export interface LabRubricComponent {
  key: LabScoreComponentKey
  label: string
  points: number
  description: string
  objectiveIndexes?: number[]
  reportPoints?: number
  requiresSafetyAck?: boolean
}

export interface LabRubric {
  challengeType: string
  passingScore: number
  hintPenalty: number
  scopeWarningPenalty: number
  components: LabRubricComponent[]
}

export interface Lab {
  id: string
  title: string
  category: string
  kind: LabKind
  glyph: string
  color: string
  difficulty: Difficulty
  brief: string
  scope: { allowed: string[]; forbidden: string[] }
  evidenceTitle: string
  evidence: string
  flagChallenge: FlagChallengeDefinition
  /** Present on dataset-analysis challenges; drives the analysis debrief. */
  analysis?: LabAnalysis
  /** Present on web concept labs; enables the finding worksheet and unsafe-target warning. */
  webConcept?: WebConceptLab
  objectives: string[]
  rubric: LabRubric
  guiding: { q: string; a: string }[]
  modelFindings: LabFinding[]
}

type RubricObjectiveMap = Partial<Record<Exclude<LabScoreComponentKey, 'safety'>, number[]>>

function rubric(challengeType: string, objectives: RubricObjectiveMap): LabRubric {
  return {
    challengeType,
    passingScore: 80,
    hintPenalty: 2,
    scopeWarningPenalty: 5,
    components: [
      {
        key: 'flag',
        label: 'Flag / diagnosis',
        points: 20,
        objectiveIndexes: objectives.flag ?? [],
        description: 'Names the primary finding, attack pattern, or vulnerability class.',
      },
      {
        key: 'evidence',
        label: 'Evidence',
        points: 25,
        objectiveIndexes: objectives.evidence ?? [],
        reportPoints: 5,
        description: 'Ties the conclusion to the supplied synthetic artifacts and report evidence.',
      },
      {
        key: 'explanation',
        label: 'Explanation',
        points: 20,
        objectiveIndexes: objectives.explanation ?? [],
        description: 'Explains why the evidence supports the finding and its impact.',
      },
      {
        key: 'remediation',
        label: 'Remediation',
        points: 25,
        objectiveIndexes: objectives.remediation ?? [],
        reportPoints: 5,
        description: 'Recommends practical containment, hardening, or prioritised fixes.',
      },
      {
        key: 'safety',
        label: 'Safety',
        points: 10,
        requiresSafetyAck: true,
        description: 'Requires acknowledgement of the synthetic, read-only scope contract.',
      },
    ],
  }
}

export const LABS: Lab[] = [
  {
    id: 'soc-bruteforce',
    title: 'SOC Triage: Suspicious Logins',
    category: 'SOC',
    kind: 'dataset',
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
    flagChallenge: {
      prompt:
        'Classify the primary authentication attack pattern shown by the prepared timeline. Submit the pattern as a flag.',
      assets: [
        {
          id: 'auth-log',
          label: 'auth.log (synthetic)',
          kind: 'log',
          description: 'Prepared authentication events across fictional users and documentation-range sources.',
        },
      ],
      expectedFlag: 'FLAG{PASSWORD_SPRAY}',
      hints: [
        'Count how many distinct usernames are targeted by the same source.',
        'The source makes a small number of guesses across many accounts rather than many guesses against one account.',
      ],
      explanation:
        'One source produces failures across many usernames before a successful login, which is the defining pattern of password spraying.',
      remediation:
        'Enforce MFA for every account, detect one-source-to-many-user failure velocity, throttle the source, and reset the affected fictional account.',
      reportPrompt:
        'Write a finding that cites the multi-user failure sequence and successful non-MFA login, then explains impact and prioritized containment.',
    },
    analysis: {
      type: 'auth-log',
      detection:
        'Alert when one source produces failures across many distinct usernames in a short window, and escalate any success from that source, especially without MFA.',
      prevention:
        'Enforce MFA for every account, add source-based throttling alongside per-account lockout, and block legacy sign-in paths that bypass MFA.',
    },
    objectives: [
      'Classify the activity (single-account brute force vs password spraying vs credential stuffing)',
      'Identify the pivot event where the attacker likely succeeded',
      'List two indicators you would alert on',
      'Recommend an immediate containment action',
    ],
    rubric: rubric('soc-triage', {
      flag: [0],
      evidence: [1, 2],
      explanation: [0, 1],
      remediation: [3],
    }),
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
    kind: 'simulated',
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
    flagChallenge: {
      prompt:
        'Identify the highest-impact authorization design flaw in the prepared runtime-role policy and submit it as a flag.',
      assets: [
        {
          id: 'runtime-policy',
          label: 'role-policy.json (synthetic)',
          kind: 'config',
          description: 'Prepared IAM statement for a fictional application runtime role.',
        },
        {
          id: 'bucket-settings',
          label: 'bucket-settings.json (synthetic)',
          kind: 'config',
          description: 'Prepared public-access, encryption, and logging settings for a fictional bucket.',
        },
      ],
      expectedFlag: 'FLAG{WILDCARD_IAM}',
      hints: [
        'Compare the actions and resources granted with what a runtime role actually needs.',
        'Both fields use the broadest possible wildcard.',
      ],
      explanation:
        'Allowing every action on every resource violates least privilege and gives a compromised application an account-wide blast radius.',
      remediation:
        'Replace the wildcard statement with only required actions on named resources, then review access with a policy analyzer.',
      reportPrompt:
        'Document the wildcard authorization risk separately from the bucket exposure and prioritize least-privilege remediation.',
    },
    analysis: {
      type: 'cloud-config',
      detection:
        'Run policy-as-code checks that flag wildcard actions or resources and public storage settings before deployment, and alert on configuration drift afterwards.',
      prevention:
        'Grant runtime roles only the actions and named resources they need, block public storage access by default, and require encryption and access logging in baseline templates.',
    },
    objectives: [
      'Explain what is wrong with the IAM statement',
      'Identify the three risky bucket settings',
      'Rewrite the policy intent using least privilege (in words)',
      'Prioritise the fixes',
    ],
    rubric: rubric('cloud-config-review', {
      flag: [0],
      evidence: [1],
      explanation: [0, 3],
      remediation: [2, 3],
    }),
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
    kind: 'simulated',
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
    flagChallenge: {
      prompt:
        'Name the authorization vulnerability demonstrated by the prepared request and response, then submit the class as a flag.',
      assets: [
        {
          id: 'invoice-exchange',
          label: 'request-response.txt (synthetic)',
          kind: 'request-response',
          description: 'Static exchange from a fictional toy application with mismatched session and resource owners.',
        },
      ],
      expectedFlag: 'FLAG{BROKEN_ACCESS_CONTROL}',
      hints: [
        'Compare the authenticated user ID with the owner ID in the returned object.',
        'The server returns an object owned by another user without an object-level authorization check.',
      ],
      explanation:
        'User 1002 receives invoice data owned by user 1007, demonstrating missing server-side object-level authorization.',
      remediation:
        'Authorize every object access against the authenticated identity on the server and cover cross-user requests with negative tests.',
      reportPrompt:
        'Write a broken-access-control finding using the owner mismatch as evidence and describe the required server-side authorization rule.',
    },
    webConcept: {
      concept: 'access-control',
      unsafeTargetWarning:
        'Changing object ids in requests to applications you do not own is unauthorized testing. Review only this static exchange from a fictional toy app.',
    },
    objectives: [
      'Name the vulnerability class',
      'Explain how you know authorization failed',
      'Write the remediation: the correct server-side authorization check',
      'State the impact in one sentence',
    ],
    rubric: rubric('web-access-control-review', {
      flag: [0],
      evidence: [1],
      explanation: [3],
      remediation: [2],
    }),
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
    id: 'web-input-validation',
    title: 'Web AppSec: Query Built From Input',
    category: 'Web',
    kind: 'simulated',
    glyph: '⌁',
    color: '#80ffdb',
    difficulty: 'medium',
    brief:
      'A support agent searched a fictional CRM toy app for a customer surname containing an apostrophe and received a database error. Read the captured exchange and the server snippet, explain the input-handling flaw, and describe the secure fix. Static review only — no live app.',
    scope: {
      allowed: ['The static request/response and toy server snippet below', 'The report builder and Evidence Vault'],
      forbidden: ['Sending any request to any application', 'Crafting or testing injection strings', 'Any real database or customer data'],
    },
    evidenceTitle: 'crm-search exchange (synthetic)',
    evidence: `# Legitimate search by a support agent for the surname O'Hara
GET /api/customers?surname=O'Hara HTTP/1.1
Host: crm.neoncorp.example
Cookie: session=<agent-session>

HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{ "error": "syntax error at or near \\"Hara\\"",
  "query": "SELECT id, name, phone FROM customers WHERE surname = 'O'Hara'",
  "driver": "neon-sql-driver 4.2" }

# Toy server handler (excerpt)
const sql = "SELECT id, name, phone FROM customers WHERE surname = '" + surnameParam + "'"
const rows = await runQuery(sql)`,
    flagChallenge: {
      prompt:
        'Name the root-cause coding flaw that lets an ordinary apostrophe change the structure of the database query, and submit it as a flag.',
      assets: [
        {
          id: 'crm-exchange',
          label: 'crm-search exchange (synthetic)',
          kind: 'request-response',
          description: 'Static request, error response, and handler excerpt from a fictional CRM toy app.',
        },
      ],
      expectedFlag: 'FLAG{UNPARAMETERIZED_QUERY}',
      hints: [
        'Look at how the handler combines the surname value with the SQL text.',
        'The input is concatenated into the statement instead of being passed as a bound parameter.',
      ],
      explanation:
        'The handler concatenates the surname into the SQL string, so the apostrophe in a legitimate name ends the string literal early and breaks the statement. Input that can change query structure is the root cause of SQL injection, and the verbose error discloses the query text to the client.',
      remediation:
        'Use parameterized queries or prepared statements for every value, validate input against expected formats, return generic errors to clients, and log details server-side.',
      reportPrompt:
        'Write a finding that cites the concatenation line and the leaked query text, explains the injection and information-disclosure impact, and recommends parameterization and error handling.',
    },
    webConcept: {
      concept: 'input-validation',
      unsafeTargetWarning:
        'Do not paste the captured request into a browser or tool, and never test inputs against applications you do not own. This exercise is a static reading of a fictional toy app.',
    },
    objectives: [
      'Identify the line where user input becomes part of the SQL statement',
      'Write the finding: name the flaw and cite the evidence',
      'Write the impact in business terms, including the leaked error details',
      'Write the remediation: parameterization, validation, and safe error handling',
    ],
    rubric: rubric('web-input-validation-review', {
      flag: [0],
      evidence: [1],
      explanation: [2],
      remediation: [3],
    }),
    guiding: [
      {
        q: 'Why did an apostrophe break the query?',
        a: 'The value is placed inside a quoted SQL string by concatenation. The apostrophe in O\'Hara closes the literal early, so the rest of the name is parsed as SQL. Any input that can change query structure is an injection flaw.',
      },
      {
        q: 'Is escaping apostrophes a sufficient fix?',
        a: 'No. Manual escaping is error-prone and context-dependent. Bound parameters keep data separate from code for every value and every database driver.',
      },
      {
        q: 'What else is wrong with the response?',
        a: 'It returns the raw query, database error, and driver version to the client. Those details help an attacker and should stay in server-side logs.',
      },
    ],
    modelFindings: [
      {
        title: 'SQL statement built by concatenating user input',
        severity: 'high',
        impact: 'User-controlled input can alter query structure, enabling unauthorized reads or changes to customer records.',
        remediation: 'Replace concatenation with parameterized queries throughout the data layer and add tests with apostrophes and other special characters.',
      },
      {
        title: 'Verbose database errors returned to clients',
        severity: 'medium',
        impact: 'The response discloses query text, schema names, and driver version that help an attacker refine attempts.',
        remediation: 'Return a generic error with a correlation id; log the detailed error server-side only.',
      },
    ],
  },
  {
    id: 'web-session-rotation',
    title: 'Web AppSec: Session Not Rotated at Login',
    category: 'Web',
    kind: 'simulated',
    glyph: '⎔',
    color: '#b5e48c',
    difficulty: 'medium',
    brief:
      'Three captured exchanges from a fictional toy portal show the session cookie before login, during login, and after login. Decide what the session handling gets wrong and describe the secure design. Static review only — no live app.',
    scope: {
      allowed: ['The three static exchanges below', 'The report builder and Evidence Vault'],
      forbidden: ['Sending any request to any application', 'Using or replaying any session value', 'Any real account or browser profile'],
    },
    evidenceTitle: 'portal-session exchanges (synthetic)',
    evidence: `# 1) Anonymous visit to the login page
GET /login HTTP/1.1
Host: portal.neoncorp.example

HTTP/1.1 200 OK
Set-Cookie: sid=SID-DEMO-7F3A; Path=/

# 2) Credentials submitted with the pre-login session id
POST /login HTTP/1.1
Host: portal.neoncorp.example
Cookie: sid=SID-DEMO-7F3A
Content-Type: application/x-www-form-urlencoded

username=aiko&password=<redacted>

HTTP/1.1 302 Found
Location: /dashboard

# 3) Authenticated request after login
GET /dashboard HTTP/1.1
Host: portal.neoncorp.example
Cookie: sid=SID-DEMO-7F3A

HTTP/1.1 200 OK`,
    flagChallenge: {
      prompt:
        'Name the session-management vulnerability demonstrated when the same identifier issued before login stays valid after authentication, and submit it as a flag.',
      assets: [
        {
          id: 'portal-exchanges',
          label: 'portal-session exchanges (synthetic)',
          kind: 'request-response',
          description: 'Static pre-login, login, and post-login exchanges from a fictional toy portal.',
        },
      ],
      expectedFlag: 'FLAG{SESSION_FIXATION}',
      hints: [
        'Compare the session identifier in exchange 1 with the one used in exchange 3.',
        'The login response never issues a new identifier, so a value known before login is still valid afterwards.',
      ],
      explanation:
        'The portal keeps the anonymous session identifier after a successful login. Anyone who planted or learned that pre-login value would share the authenticated session. The cookie also lacks Secure, HttpOnly, and SameSite attributes.',
      remediation:
        'Issue a new session identifier on login and privilege change, invalidate the old one server-side, and set Secure, HttpOnly, and SameSite on the session cookie with idle and absolute timeouts.',
      reportPrompt:
        'Write a finding that cites the unchanged identifier across the three exchanges and the missing cookie attributes, then describe the rotation and cookie-hardening fix.',
    },
    webConcept: {
      concept: 'session',
      unsafeTargetWarning:
        'Never reuse, share, or replay a real session cookie. The identifiers here are placeholders from a fictional toy portal and must not be tried anywhere.',
    },
    objectives: [
      'Name the session flaw shown across the three exchanges',
      'Write the finding with evidence: which identifier persists and which response should have changed it',
      'Write the impact, including the risk from missing cookie attributes',
      'Write the remediation: rotation, invalidation, cookie attributes, and timeouts',
    ],
    rubric: rubric('web-session-review', {
      flag: [0],
      evidence: [1],
      explanation: [2],
      remediation: [3],
    }),
    guiding: [
      {
        q: 'Where should the identifier have changed?',
        a: 'In the login response (exchange 2). A successful authentication must issue a fresh session identifier and invalidate the anonymous one.',
      },
      {
        q: 'What do the missing cookie attributes add to the risk?',
        a: 'Without Secure the cookie can travel over plain HTTP; without HttpOnly script can read it; without SameSite it is sent on cross-site requests. Each widens the ways a session can be exposed or misused.',
      },
    ],
    modelFindings: [
      {
        title: 'Session identifier not rotated after authentication (session fixation)',
        severity: 'high',
        impact: 'A session identifier known before login grants the authenticated session afterwards, enabling account takeover.',
        remediation: 'Regenerate the session identifier on login and privilege changes and invalidate the previous identifier server-side.',
      },
      {
        title: 'Session cookie missing Secure, HttpOnly, and SameSite',
        severity: 'medium',
        impact: 'The session cookie may be exposed over cleartext, read by injected script, or sent on cross-site requests.',
        remediation: 'Set Secure, HttpOnly, and SameSite=Lax or Strict, and enforce idle and absolute session timeouts.',
      },
    ],
  },
  {
    id: 'web-security-headers',
    title: 'Web AppSec: Missing Security Headers',
    category: 'Web',
    kind: 'simulated',
    glyph: '⌸',
    color: '#ffd6a5',
    difficulty: 'easy',
    brief:
      'Review the response headers of a fictional toy banking login page and decide which browser-enforced protections are missing. Explain the risk of each gap and write a header baseline. Static review only — no live app.',
    scope: {
      allowed: ['The static response headers below', 'The report builder and Evidence Vault'],
      forbidden: ['Requesting any real or fictional site', 'Building framing or overlay pages', 'Any real browser session or account'],
    },
    evidenceTitle: 'login-response-headers.txt (synthetic)',
    evidence: `# Response for GET /login on bank-portal.neoncorp.example (synthetic)
HTTP/1.1 200 OK
Server: neon-httpd/2.4.1
Content-Type: text/html
Set-Cookie: sid=SID-DEMO-51C0; Path=/; HttpOnly
Cache-Control: no-store
# Not present: Content-Security-Policy
# Not present: Strict-Transport-Security
# Not present: X-Frame-Options or CSP frame-ancestors
# Not present: X-Content-Type-Options
# Not present: Referrer-Policy`,
    flagChallenge: {
      prompt:
        'The login page can be embedded inside a frame on any other site. Name the UI-redress attack this enables and submit it as a flag.',
      assets: [
        {
          id: 'login-headers',
          label: 'login-response-headers.txt (synthetic)',
          kind: 'headers',
          description: 'Prepared response headers for a fictional toy login page with protections absent.',
        },
      ],
      expectedFlag: 'FLAG{CLICKJACKING}',
      hints: [
        'Which missing header or directive controls whether other sites may frame this page?',
        'A framed, visually hidden login page can trick a user into clicking controls they cannot see.',
      ],
      explanation:
        'Without X-Frame-Options or a CSP frame-ancestors directive, any site can frame the login page and overlay it to trick users into unintended clicks. The missing CSP, HSTS, nosniff, and referrer policy remove further browser-enforced defenses.',
      remediation:
        'Send CSP with frame-ancestors none or self, HSTS with a long max-age, X-Content-Type-Options nosniff, a strict Referrer-Policy, and remove the server version banner.',
      reportPrompt:
        'Write one finding for the framing risk and one for the remaining header baseline gaps, citing the absent headers and giving a prioritized header baseline.',
    },
    webConcept: {
      concept: 'security-headers',
      unsafeTargetWarning:
        'Checking headers on sites you do not own is out of scope. Review only this synthetic header capture from a fictional toy app.',
    },
    objectives: [
      'Name the attack enabled by the missing framing control',
      'Write the finding with evidence: list every absent header and the version banner',
      'Write the impact of each missing protection',
      'Write the remediation as a prioritized header baseline',
    ],
    rubric: rubric('web-security-header-review', {
      flag: [0],
      evidence: [1],
      explanation: [2],
      remediation: [3],
    }),
    guiding: [
      {
        q: 'Which gap matters most for a login page?',
        a: 'Framing. Without frame-ancestors or X-Frame-Options the login form can be embedded and disguised, so users may submit or click without realising.',
      },
      {
        q: 'What does HSTS add if the site already redirects to HTTPS?',
        a: 'HSTS tells the browser to use HTTPS for every future request, removing the first cleartext request that a redirect-only setup leaves exposed.',
      },
    ],
    modelFindings: [
      {
        title: 'Login page can be framed by any site (clickjacking)',
        severity: 'medium',
        impact: 'Users can be tricked into interacting with a hidden, framed login page.',
        remediation: 'Send Content-Security-Policy frame-ancestors none (or self) and X-Frame-Options DENY for older browsers.',
      },
      {
        title: 'Security header baseline missing and server version disclosed',
        severity: 'low',
        impact: 'No CSP, HSTS, nosniff, or referrer policy; the version banner eases vulnerability matching.',
        remediation: 'Adopt a header baseline (CSP, HSTS, nosniff, Referrer-Policy) in the shared server config and remove version banners.',
      },
    ],
  },
  {
    id: 'net-cleartext',
    title: 'Network Review: Cleartext Credentials',
    category: 'Network',
    kind: 'dataset',
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
    flagChallenge: {
      prompt:
        'Identify the shared security failure across the prepared FTP, HTTP, and Telnet observations and submit it as a flag.',
      assets: [
        {
          id: 'capture-summary',
          label: 'capture-summary.txt (synthetic)',
          kind: 'capture',
          description: 'Static packet-summary rows from a deliberately prepared training capture.',
        },
      ],
      expectedFlag: 'FLAG{CLEARTEXT_CREDENTIALS}',
      hints: [
        'Focus on what an on-path observer could read without decrypting anything.',
        'FTP, the non-TLS login, and Telnet all expose authentication or session material in plaintext.',
      ],
      explanation:
        'The prepared protocols transmit credentials or session material without transport encryption, making them readable on path.',
      remediation:
        'Replace FTP and Telnet with encrypted alternatives, require HTTPS, and set Secure and HttpOnly cookie attributes.',
      reportPrompt:
        'Summarize every cleartext protocol observation, its impact, and the secure replacement without including any real credential value.',
    },
    analysis: {
      type: 'pcap',
      detection:
        'Flag authentication exchanges on cleartext protocols in network monitoring and alert on session cookies issued without the Secure attribute.',
      prevention:
        'Retire FTP and Telnet in favour of encrypted protocols, redirect every login to HTTPS with HSTS, and set Secure and HttpOnly on session cookies.',
    },
    objectives: [
      'List every protocol here that exposes credentials or sessions in cleartext',
      'Explain the risk of the missing cookie Secure flag',
      'Recommend a secure replacement for each protocol',
    ],
    rubric: rubric('network-traffic-review', {
      flag: [0],
      evidence: [0],
      explanation: [1],
      remediation: [2],
    }),
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
    kind: 'dataset',
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
    flagChallenge: {
      prompt:
        'Identify the sender-domain deception technique that reinforces the failed authentication results and submit it as a flag.',
      assets: [
        {
          id: 'message-headers',
          label: 'message-headers.txt (synthetic)',
          kind: 'headers',
          description: 'Prepared headers using fictional example domains and a documentation-range sender address.',
        },
      ],
      expectedFlag: 'FLAG{LOOKALIKE_DOMAIN}',
      hints: [
        'Compare the From and Reply-To domains with the intended organization domain.',
        'The message uses related-looking cousin domains rather than the fictional organization domain.',
      ],
      explanation:
        'The display name and cousin domains imitate the fictional organization while SPF and DMARC fail and no DKIM signature exists.',
      remediation:
        'Quarantine the message, block the fictional cousin domains, and verify urgent requests through a known internal channel.',
      reportPrompt:
        'Write a phishing finding that cites the domain mismatch and authentication failures, then recommends user and mail-control actions.',
    },
    analysis: {
      type: 'email-headers',
      detection:
        'Quarantine or banner messages that fail SPF and DMARC, and alert on cousin domains that closely resemble the organization domain.',
      prevention:
        'Publish an enforcing DMARC policy, register or block obvious lookalike domains, and train staff to verify urgent requests through a known channel.',
    },
    objectives: [
      'State whether SPF, DKIM, and DMARC passed or failed',
      'Identify the two social-engineering pressure tactics',
      'Spot the lookalike domain trick',
      'Recommend the correct user + org response',
    ],
    rubric: rubric('phishing-header-analysis', {
      flag: [2],
      evidence: [0],
      explanation: [1, 2],
      remediation: [3],
    }),
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
    id: 'web-log-forced-browsing',
    title: 'Web Log Analysis: Forced Browsing Burst',
    category: 'Web Log',
    kind: 'dataset',
    glyph: '≣',
    color: '#72efdd',
    difficulty: 'medium',
    brief:
      'A synthetic web access log from a fictional storefront shows a burst of requests from one source. Decide what the source was doing, find the request that turned reconnaissance into exposure, and recommend detection and prevention. Log review only.',
    scope: {
      allowed: ['The synthetic access log below', 'Local note-taking, the Evidence Vault, and the report builder'],
      forbidden: ['Requesting any path on any real or fictional site', 'Any external lookup of the fake addresses', 'Generating traffic'],
    },
    evidenceTitle: 'access.log (synthetic)',
    evidence: `2026-07-12T03:14:02Z 198.51.100.23 GET /products/lamp-07 200 5120 ua="Mozilla/5.0 (browser)"
2026-07-12T03:20:11Z 203.0.113.45 GET /admin 404 162 ua="content-discovery-bot/0.9"
2026-07-12T03:20:11Z 203.0.113.45 GET /administrator 404 162 ua="content-discovery-bot/0.9"
2026-07-12T03:20:12Z 203.0.113.45 GET /old 404 162 ua="content-discovery-bot/0.9"
2026-07-12T03:20:12Z 203.0.113.45 GET /backup 301 0 ua="content-discovery-bot/0.9"
2026-07-12T03:20:12Z 203.0.113.45 GET /backup/ 403 199 ua="content-discovery-bot/0.9"
... (1,240 similar 404 responses from 203.0.113.45 across wordlist-style paths in 6 minutes) ...
2026-07-12T03:26:40Z 203.0.113.45 GET /backup/customers-export.json 200 4194304 ua="content-discovery-bot/0.9"
2026-07-12T03:26:52Z 203.0.113.45 GET /backup/orders-export.json 200 2097152 ua="content-discovery-bot/0.9"
2026-07-12T03:31:09Z 198.51.100.23 GET /cart 200 2048 ua="Mozilla/5.0 (browser)"`,
    flagChallenge: {
      prompt:
        'Name the reconnaissance technique shown by the rapid 404 burst that preceded the successful backup downloads, and submit it as a flag.',
      assets: [
        {
          id: 'access-log',
          label: 'access.log (synthetic)',
          kind: 'log',
          description: 'Prepared web access events from a fictional storefront using documentation-range sources.',
        },
      ],
      expectedFlag: 'FLAG{FORCED_BROWSING}',
      hints: [
        'Compare the status codes and path names requested by 203.0.113.45 with normal shopper traffic.',
        'The source guesses unlinked paths from a wordlist until an unprotected directory responds.',
      ],
      explanation:
        'One source requested more than a thousand unlinked, wordlist-style paths in minutes, receiving mostly 404s, until it found an unprotected backup directory and downloaded two large exports. That is forced browsing (content discovery) turning into data exposure.',
      remediation:
        'Remove backups and exports from the web root, deny directory access by default, rate-limit or block sources with abnormal 404 ratios, and review which records the exports contained.',
      reportPrompt:
        'Write a finding that cites the 404 burst and the two 200 responses for export files, states the data exposure impact, and orders removal, access control, and detection actions.',
    },
    analysis: {
      type: 'web-log',
      detection:
        'Alert on sources whose 404 ratio or distinct-path count spikes within a short window, and alert on any successful response for backup, archive, or export paths.',
      prevention:
        'Keep backups outside the served directory, serve only an allow-list of static paths, and apply per-source rate limits at the edge.',
    },
    objectives: [
      'Name the technique used by 203.0.113.45 before the downloads',
      'Identify the two requests that exposed data and their response sizes',
      'Explain why the user agent and 404 ratio are useful indicators',
      'Recommend one detection rule and two preventive fixes',
    ],
    rubric: rubric('web-log-analysis', {
      flag: [0],
      evidence: [1],
      explanation: [2],
      remediation: [3],
    }),
    guiding: [
      {
        q: 'What distinguishes this source from the shopper at 198.51.100.23?',
        a: 'It requests unlinked administrative and backup paths at machine speed, almost all returning 404, with a self-identified automation user agent. The shopper only requests linked product and cart pages.',
      },
      {
        q: 'Which events matter most for impact?',
        a: 'The two 200 responses for customers-export.json and orders-export.json, 4 MB and 2 MB. Those are the moment reconnaissance became data exposure.',
      },
      {
        q: 'Why is the 403 on the backup directory not enough protection?',
        a: 'Blocking the directory listing hides file names, but files inside remain directly downloadable once guessed. Sensitive exports must not be served at all.',
      },
    ],
    modelFindings: [
      {
        title: 'Customer and order exports downloadable from the web root',
        severity: 'high',
        impact: 'An unauthenticated source downloaded customer and order exports after guessing the backup directory.',
        remediation: 'Remove the exports from the served directory, rotate any secrets they contained, and assess notification obligations for the fictional records.',
      },
      {
        title: 'No detection or throttling of forced-browsing bursts',
        severity: 'medium',
        impact: 'More than a thousand 404 responses from one source went unthrottled and unalerted.',
        remediation: 'Add 404-ratio and distinct-path alerts per source and enforce edge rate limits for abnormal request bursts.',
      },
    ],
  },
  {
    id: 'fw-rule-shadowing',
    title: 'Firewall Rule Review: Shadowed Deny',
    category: 'Firewall',
    kind: 'dataset',
    glyph: '⛨',
    color: '#f77f00',
    difficulty: 'medium',
    brief:
      'Review an ordered, synthetic edge firewall rule set where the first matching rule wins. Find the rule ordering problem that silently disables an intended control, then propose a safe rule order. Config review only.',
    scope: {
      allowed: ['The synthetic rule export below', 'Local note-taking, the Evidence Vault, and the report builder'],
      forbidden: ['Any real firewall, router, or cloud security group', 'Probing or connecting to the listed addresses', 'Applying changes anywhere'],
    },
    evidenceTitle: 'edge-fw-rules.txt (synthetic)',
    evidence: `# edge-fw ruleset export (synthetic) — evaluated top-down, first match wins
# id  action  proto  source           destination          port   log  comment
  10  allow   tcp    any              192.0.2.20/32        443    on   public storefront
  20  allow   tcp    any              192.0.2.0/24         any    off  temp vendor access 2024 (ticket CHG-1182)
  30  deny    tcp    any              192.0.2.30/32        3389   on   block remote desktop to jump host
  40  allow   tcp    10.20.0.0/16     192.0.2.40/32        22     on   admin SSH from corporate range
  50  deny    ip     any              any                  any    on   default deny
# hit counters (last 30 days): rule10=1,204,332  rule20=88,410  rule30=0  rule40=5,120  rule50=611,044`,
    flagChallenge: {
      prompt:
        'Identify the rule-ordering flaw that makes rule 30 ineffective and submit its name as a flag.',
      assets: [
        {
          id: 'rule-export',
          label: 'edge-fw-rules.txt (synthetic)',
          kind: 'config',
          description: 'Prepared ordered rule export with hit counters for a fictional edge firewall.',
        },
      ],
      expectedFlag: 'FLAG{RULE_SHADOWING}',
      hints: [
        'Evaluate a remote desktop connection to 192.0.2.30 from any source, top-down, and stop at the first match.',
        'A broader allow rule above a specific deny means the deny is never reached; the zero hit counter confirms it.',
      ],
      explanation:
        'Rule 20 allows any TCP port from anywhere to the whole 192.0.2.0/24 range, so traffic that rule 30 was meant to deny matches rule 20 first. Rule 30 is shadowed, as its zero hit counter shows, and rule 20 does not log.',
      remediation:
        'Remove or narrow the expired vendor rule to named sources, hosts, and ports with an expiry date, place specific denies above broad allows, enable logging, and review rules with zero hits or no owner.',
      reportPrompt:
        'Write a finding explaining how the temporary vendor rule shadows the remote desktop deny, cite the hit counters, and prioritize rule cleanup and review controls.',
    },
    analysis: {
      type: 'firewall-rule',
      detection:
        'Run rule-set analysis that reports shadowed, redundant, and overly broad rules, and alert on rules with zero hits, logging disabled, or expired change tickets.',
      prevention:
        'Require an owner, justification, scope, and expiry for every allow rule, order specific denies before broad allows, and review the rule base on a fixed schedule.',
    },
    objectives: [
      'Name the rule-ordering flaw affecting rule 30',
      'Cite the evidence in the rule table and hit counters that proves it',
      'Explain the exposure created by rule 20 beyond remote desktop',
      'Propose a corrected rule order and a rule-governance control',
    ],
    rubric: rubric('firewall-rule-review', {
      flag: [0],
      evidence: [1],
      explanation: [2],
      remediation: [3],
    }),
    guiding: [
      {
        q: 'Why does rule 30 have zero hits?',
        a: 'Every packet that would match rule 30 also matches rule 20, which sits above it and allows any port to the whole 192.0.2.0/24 range. First match wins, so rule 30 is never evaluated.',
      },
      {
        q: 'What else does rule 20 expose?',
        a: 'Every port on every host in the range, from any source, without logging. Management services such as SSH on 192.0.2.40 are reachable from anywhere, bypassing the corporate-only intent of rule 40.',
      },
    ],
    modelFindings: [
      {
        title: 'Temporary any-port vendor rule shadows the remote desktop deny',
        severity: 'high',
        impact: 'Remote desktop and every other service in the range are reachable from any source, without logging, despite an explicit deny.',
        remediation: 'Remove or scope rule 20 to named vendor sources, hosts, and ports with an expiry; move specific denies above broad allows.',
      },
      {
        title: 'Rule governance gaps: no expiry, no logging, zero-hit rules unreviewed',
        severity: 'medium',
        impact: 'A 2024 temporary rule persisted unnoticed and a critical deny silently stopped working.',
        remediation: 'Require owner, ticket, and expiry for allow rules; enable logging; review zero-hit and expired rules on a schedule.',
      },
    ],
  },
  {
    id: 'threat-model',
    title: 'Threat Modeling: STRIDE Pass',
    category: 'Threat Model',
    kind: 'writeup',
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
    flagChallenge: {
      prompt:
        'Identify the single most urgent trust and identity design failure in the fictional architecture and submit it as a flag.',
      assets: [
        {
          id: 'architecture',
          label: 'architecture.md (synthetic)',
          kind: 'architecture',
          description: 'Fictional components, trust boundaries, and deliberately unsafe design notes.',
        },
      ],
      expectedFlag: 'FLAG{EXPOSED_SIGNING_SECRET}',
      hints: [
        'Ask which issue could let a repository reader impersonate any user.',
        'The signing material is committed with the application source instead of being held by a secrets manager.',
      ],
      explanation:
        'A committed signing secret enables token forgery and combines Spoofing with Elevation of Privilege across the application.',
      remediation:
        'Rotate the fictional signing secret, remove it from history, load replacements from a secrets manager, and add secret scanning.',
      reportPrompt:
        'Create a critical finding that connects source-controlled signing material to token forgery, then order rotation and repository cleanup actions.',
    },
    objectives: [
      'List the key assets and the trust boundaries',
      'Give one concrete threat for Spoofing, Tampering, Info Disclosure, and Elevation',
      'Identify the single most urgent issue',
      'Rank the top three mitigations',
    ],
    rubric: rubric('stride-threat-model', {
      flag: [2],
      evidence: [0, 1],
      explanation: [1, 2],
      remediation: [3],
    }),
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
