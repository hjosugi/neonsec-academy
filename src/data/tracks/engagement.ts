// ============================================================
// CEH+ Pentest Engagement Workflow (P5-001).
// One fictional engagement, walked from scope review to report delivery.
// All assets, people, and findings are synthetic; addresses use documentation
// or private IP ranges and safe training domains only. No scanning or
// exploitation happens in the app — learners reason over prepared material.
// ============================================================
import type { EngagementScenario } from './types'

export const ENGAGEMENTS: EngagementScenario[] = [
  {
    id: 'ENG-01',
    title: 'Neon Harbor Logistics: External and Staging API Assessment',
    client: 'Neon Harbor Logistics (fictional)',
    summary:
      'Neon Harbor Logistics, a fictional freight company, has authorized a one-week assessment of its customer portal, perimeter range, and staging API. You will confirm scope, commit to the rules of engagement, build an asset inventory, triage prepared scanner and manual-test notes, and deliver a Markdown report. Every artifact is synthetic and nothing is tested live.',
    statementOfWork: [
      'Client: Neon Harbor Logistics (fictional). Engagement: external perimeter and staging API assessment (training scenario).',
      'Authorization: signed by the fictional CISO, Rin Aoyama, on 2026-04-01 (letter reference NHL-AUTH-2026-04).',
      'Testing window: 2026-04-06 to 2026-04-10, 09:00-18:00 JST only.',
      'In scope: perimeter range 203.0.113.16/29 (addresses 203.0.113.16 through 203.0.113.23).',
      'In scope: portal.neonharbor.example (customer shipment tracking portal).',
      'In scope: api-staging.neonharbor.example and the staging subnet 10.70.5.0/24, reachable only through the supplied test VPN.',
      'Out of scope: pay.neonharbor.example (production payment host). No testing of any kind, including passive crawling.',
      'Out of scope: all third-party SaaS, including the hosted helpdesk at neonharbor.helpdesk-vendor.example.',
      'Out of scope: the cloud storage tenant, corporate internal networks other than the staging subnet, and all employees.',
      'Out of scope: social engineering, physical access, and denial-of-service testing.',
      'Objectives: identify weaknesses in in-scope assets, validate impact with the least intrusive method, and deliver prioritized remediation.',
      'Test accounts: the client supplies cust-demo-1 and cust-demo-2 for the portal; no other accounts may be used.',
      'Deliverables: daily status notes, a draft report by 2026-04-13, a readout meeting, and a final Markdown report.',
    ],
    rulesOfEngagement: [
      'No denial-of-service, stress, or flooding tests. Stop any activity that degrades a service and notify the client contact.',
      'No social engineering, phishing, or contact with Neon Harbor employees or customers.',
      'Stop and notify: if payment data, personal data, or live credentials are encountered, stop, capture minimal redacted evidence, and notify the client contact within one hour.',
      'Primary contact: Rin Aoyama (fictional CISO). Emergency contact: SOC duty lead Kaito Mori (fictional), via the engagement channel.',
      'All testing originates from the tester egress address 198.51.100.40, which the client SOC allowlists and monitors.',
      'Use only the techniques agreed in the statement of work. No persistence, no data modification, and no lateral movement beyond the staging subnet.',
      'Use only client-supplied test accounts. Never reuse any credential discovered during testing; record that it exists, not its value.',
      'Store evidence only in the encrypted engagement vault, redact personal data in screenshots, and destroy copies 30 days after the final report.',
      'Send a daily status note to the client contact at 18:00 JST, including any scope questions.',
      'Resolve every scope question in writing with the authorizer before touching the asset in question.',
    ],
    assets: [
      {
        id: 'A-01',
        name: 'Customer tracking portal',
        address: 'portal.neonharbor.example',
        type: 'web',
        owner: 'Digital Products team',
        inScope: true,
        criticality: 'high',
        reason: 'Listed by name as an in-scope host in the statement of work.',
      },
      {
        id: 'A-02',
        name: 'Staging shipment API',
        address: 'api-staging.neonharbor.example',
        type: 'api',
        owner: 'Platform Engineering',
        inScope: true,
        criticality: 'medium',
        reason: 'Listed by name as in scope; reachable only through the supplied test VPN.',
      },
      {
        id: 'A-03',
        name: 'Perimeter VPN gateway',
        address: '203.0.113.17',
        type: 'network',
        owner: 'Infrastructure team',
        inScope: true,
        criticality: 'high',
        reason: 'Inside the in-scope perimeter range 203.0.113.16/29.',
      },
      {
        id: 'A-04',
        name: 'Outbound mail relay',
        address: '203.0.113.20',
        type: 'host',
        owner: 'Infrastructure team',
        inScope: true,
        criticality: 'medium',
        reason: 'Inside the in-scope perimeter range 203.0.113.16/29.',
      },
      {
        id: 'A-05',
        name: 'Adjacent upstream host',
        address: '203.0.113.24',
        type: 'host',
        owner: 'Upstream provider (fictional), not the client',
        inScope: false,
        criticality: 'low',
        reason: 'One address past the end of 203.0.113.16/29, which stops at 203.0.113.23. Adjacency does not grant authorization.',
      },
      {
        id: 'A-06',
        name: 'Production payment host',
        address: 'pay.neonharbor.example',
        type: 'web',
        owner: 'Finance Systems',
        inScope: false,
        criticality: 'high',
        reason: 'Explicitly excluded in the statement of work, including passive crawling, even though the portal links to it.',
      },
      {
        id: 'A-07',
        name: 'Hosted helpdesk (third-party SaaS)',
        address: 'neonharbor.helpdesk-vendor.example',
        type: 'saas',
        owner: 'Helpdesk vendor (fictional third party)',
        inScope: false,
        criticality: 'medium',
        reason: 'Third-party SaaS is excluded; only the vendor can authorize testing of its platform.',
      },
      {
        id: 'A-08',
        name: 'Staging database',
        address: '10.70.5.20',
        type: 'host',
        owner: 'Platform Engineering',
        inScope: true,
        criticality: 'medium',
        reason: 'Inside the in-scope staging subnet 10.70.5.0/24 behind the test VPN.',
      },
      {
        id: 'A-09',
        name: 'Staging build server',
        address: '10.70.5.31',
        type: 'host',
        owner: 'Platform Engineering',
        inScope: true,
        criticality: 'medium',
        reason: 'Inside the in-scope staging subnet 10.70.5.0/24 behind the test VPN.',
      },
      {
        id: 'A-10',
        name: 'Corporate HR subnet',
        address: '10.70.9.0/24',
        type: 'network',
        owner: 'People Operations',
        inScope: false,
        criticality: 'high',
        reason: 'Corporate internal networks other than the staging subnet are excluded; a verbal request does not change scope.',
      },
      {
        id: 'A-11',
        name: 'Cloud storage tenant for tracking exports',
        address: 'exports.storage.neonharbor.example',
        type: 'cloud',
        owner: 'Data Platform team',
        inScope: false,
        criticality: 'high',
        reason: 'The cloud storage tenant is explicitly excluded and would need its own authorization.',
      },
      {
        id: 'A-12',
        name: 'Neon Harbor employees',
        address: 'all-staff@neonharbor.example',
        type: 'people',
        owner: 'People Operations',
        inScope: false,
        criticality: 'high',
        reason: 'People are never targets in this engagement: social engineering and employee contact are prohibited.',
      },
    ],
    scopeQuiz: [
      {
        id: 'SQ-1',
        prompt:
          'While reviewing results you notice 203.0.113.24 serves a login page that looks like the customer portal. What do you do?',
        options: [
          'Do not touch it; record the observation and ask the authorizer in writing whether it belongs to the client',
          'Test it lightly because it is adjacent to the authorized range',
          'Test it only outside business hours to avoid disruption',
          'Treat it as a portal replica and add it to the findings',
        ],
        answer:
          'Do not touch it; record the observation and ask the authorizer in writing whether it belongs to the client',
        explanation:
          'The authorized range ends at 203.0.113.23. A similar-looking page does not prove ownership, and only the written authorizer can expand scope.',
      },
      {
        id: 'SQ-2',
        prompt:
          'A staging API response contains what appears to be a real customer payment card number. What does the RoE require?',
        options: [
          'Stop, capture minimal redacted evidence, and notify the client contact within one hour',
          'Keep testing and mention it in the final report',
          'Download the full record set to prove the impact',
          'Delete the record from the staging database to protect the customer',
        ],
        answer: 'Stop, capture minimal redacted evidence, and notify the client contact within one hour',
        explanation:
          'Stop-and-notify rules exist so sensitive data exposure is handled immediately. Collecting more data or modifying records both violate the rules.',
      },
      {
        id: 'SQ-3',
        prompt:
          'The in-scope portal links its checkout button to pay.neonharbor.example. May you test the payment host through that link?',
        options: [
          'No. It is explicitly out of scope, even if an in-scope asset links to it',
          'Yes, because the link starts from an in-scope asset',
          'Yes, but only with passive crawling',
          'Yes, if you use the client-supplied test accounts',
        ],
        answer: 'No. It is explicitly out of scope, even if an in-scope asset links to it',
        explanation:
          'Scope follows the written statement of work, not links between systems. The SoW even prohibits passive crawling of the payment host.',
      },
      {
        id: 'SQ-4',
        prompt: 'Staff sign in to the hosted helpdesk at neonharbor.helpdesk-vendor.example. How should you handle it?',
        options: [
          'Treat it as out of scope third-party SaaS and note it only as an observation',
          'Test the staff login page because it holds client data',
          'Test it only with the client test accounts',
          'Ask a helpdesk agent by email to confirm it is safe to test',
        ],
        answer: 'Treat it as out of scope third-party SaaS and note it only as an observation',
        explanation:
          'The client cannot authorize testing of a vendor platform, and contacting staff is prohibited. Record it as an observation for the client to raise with the vendor.',
      },
      {
        id: 'SQ-5',
        prompt: 'It is 20:30 JST and one validation step is left for the staging API. What do you do?',
        options: [
          'Stop and resume inside the 09:00-18:00 JST window the next day',
          'Finish quickly because the API is only staging',
          'Finish it but mention the time in the daily note',
          'Ask the SOC duty lead to approve a short extension by chat',
        ],
        answer: 'Stop and resume inside the 09:00-18:00 JST window the next day',
        explanation:
          'The testing window is part of the authorization. Out-of-window activity looks like a real attack to the SOC and is not covered by the letter.',
      },
      {
        id: 'SQ-6',
        prompt: 'The client IT manager phones and asks you to "also take a quick look" at the HR subnet 10.70.9.0/24. What do you do?',
        options: [
          'Ask for a written scope change signed by the authorizer before any testing',
          'Start immediately because the request came from the client',
          'Test only the hosts that respond to ping',
          'Test it and add it to the report as a bonus',
        ],
        answer: 'Ask for a written scope change signed by the authorizer before any testing',
        explanation:
          'Verbal requests do not change scope. The CISO signed the authorization, so any expansion must come from the authorizer in writing.',
      },
    ],
    findings: [
      {
        id: 'F-01',
        title: 'Missing object-level authorization on shipment records',
        assetId: 'A-01',
        source: 'manual-test-notes.txt entry 3 (synthetic)',
        evidence:
          'Signed in as cust-demo-1, the portal returned shipment NH-55812 owned by cust-demo-2 after the shipment identifier in the request was changed. Both are client-supplied test accounts.',
        expectedStatus: 'confirmed',
        expectedSeverity: 'high',
        impact: 'Any customer can read other customers’ shipment details, addresses, and contents by changing an identifier.',
        remediation:
          'Enforce server-side ownership checks on every shipment lookup and add negative authorization tests for cross-customer access.',
        rationale:
          'Reproduced with two authorized test accounts on an in-scope asset, and the impact is cross-customer data exposure.',
      },
      {
        id: 'F-02',
        title: 'Outdated VPN firmware with known critical flaw (scanner)',
        assetId: 'A-03',
        source: 'scanner-export.txt row 14 (synthetic)',
        evidence:
          'The scanner matched the login banner "NX-7 firmware 4.1" to a critical advisory. The client change record shows hotfix 4.1-HF3 was applied, and the patched management page confirms the fixed build; only the banner text was not updated.',
        expectedStatus: 'false-positive',
        expectedSeverity: 'info',
        impact: 'None confirmed: the vulnerable code path is patched; the stale banner only causes misleading scan results.',
        remediation: 'Update the banner to reflect the patched build so future scans do not raise false alarms.',
        rationale:
          'Version-banner matching is not proof. Verified patch evidence contradicts the scanner, so this is a false positive (with a low-priority banner note).',
      },
      {
        id: 'F-03',
        title: 'Open mail relay (scanner)',
        assetId: 'A-04',
        source: 'scanner-export.txt row 22 (synthetic)',
        evidence:
          'The scanner flagged the relay as open. The agreed manual check with the client test mailbox returned "550 relaying denied" for external recipients.',
        expectedStatus: 'false-positive',
        expectedSeverity: 'info',
        impact: 'None: the relay refuses to forward mail for unauthenticated external recipients.',
        remediation: 'No fix required; record the manual verification so the item is not re-raised.',
        rationale: 'A direct, agreed verification step contradicts the scanner heuristic.',
      },
      {
        id: 'F-04',
        title: 'Verbose error pages disclose framework and internal paths',
        assetId: 'A-02',
        source: 'manual-test-notes.txt entry 7 (synthetic)',
        evidence:
          'A malformed date parameter on the staging shipment API returned a full stack trace naming the framework version and internal directory layout.',
        expectedStatus: 'confirmed',
        expectedSeverity: 'low',
        impact: 'Internal details make targeted attacks easier but do not expose data by themselves.',
        remediation: 'Return generic error responses, log stack traces server-side only, and validate input types before processing.',
        rationale: 'Confirmed on an in-scope asset; information disclosure with limited direct impact.',
      },
      {
        id: 'F-05',
        title: 'Vendor default administrator account enabled on staging database',
        assetId: 'A-08',
        source: 'manual-test-notes.txt entry 9 (synthetic)',
        evidence:
          'The vendor-documented default administrator account was accepted by the staging database. The credential value was not recorded, and testing stopped after the successful sign-in as the RoE requires.',
        expectedStatus: 'confirmed',
        expectedSeverity: 'high',
        impact: 'Anyone on the staging subnet could gain full control of the staging database and any copied production data.',
        remediation:
          'Disable or rename the default account, set unique credentials from a secrets manager, restrict database access to application hosts, and check whether staging holds production data.',
        rationale: 'Confirmed on an in-scope asset with full administrative impact.',
      },
      {
        id: 'F-06',
        title: 'Expired TLS certificate on 203.0.113.24',
        assetId: 'A-05',
        source: 'scanner-export.txt row 31 (synthetic)',
        evidence:
          'The scanner target list was entered as 203.0.113.16/28 by mistake, so it also reached 203.0.113.24 and reported an expired certificate.',
        expectedStatus: 'out-of-scope',
        expectedSeverity: 'info',
        impact: 'Not assessed: the host is outside the authorized range and not owned by the client.',
        remediation:
          'Exclude the result from the report, correct the scanner range, and disclose the configuration error to the client contact.',
        rationale:
          'Results from unauthorized addresses must not be reported as findings; the process error itself must be disclosed.',
      },
      {
        id: 'F-07',
        title: 'Missing HSTS header on the payment host (crawler)',
        assetId: 'A-06',
        source: 'crawler-log.txt line 88 (synthetic)',
        evidence:
          'The portal crawler followed the checkout link and recorded response headers from pay.neonharbor.example before the exclusion rule was applied.',
        expectedStatus: 'out-of-scope',
        expectedSeverity: 'info',
        impact: 'Not assessed: the payment host is explicitly excluded, including passive crawling.',
        remediation:
          'Discard the data, add the payment host to the crawler deny list, and tell the client contact that an excluded host was touched.',
        rationale: 'Explicitly excluded assets cannot produce reportable findings, even by accident.',
      },
      {
        id: 'F-08',
        title: 'Portal session cookie missing Secure and HttpOnly attributes',
        assetId: 'A-01',
        source: 'manual-test-notes.txt entry 4 (synthetic)',
        evidence:
          'The session cookie set after signing in as cust-demo-1 had neither the Secure nor the HttpOnly attribute.',
        expectedStatus: 'confirmed',
        expectedSeverity: 'medium',
        impact:
          'The session value could leak over unencrypted connections or be read by injected scripts, enabling session hijacking.',
        remediation: 'Set Secure, HttpOnly, and SameSite on the session cookie and redirect all traffic to HTTPS with HSTS.',
        rationale: 'Confirmed on an in-scope asset; exploitation needs an additional condition, so medium rather than high.',
      },
    ],
    steps: [
      {
        key: 'scope',
        title: 'Scope review',
        goal: 'Confirm exactly what is authorized, by whom, and when before any work starts.',
        checklist: [
          'Authorization letter is signed by someone with authority over the assets',
          'In-scope ranges and hosts are written down exactly, including range boundaries',
          'Out-of-scope assets, third parties, and people are listed',
          'Testing window and time zone are recorded',
          'Scope violation quiz is completed',
        ],
        deliverable: 'Scope confirmation note listing authorizer, window, in-scope assets, and exclusions.',
      },
      {
        key: 'roe',
        title: 'Rules of engagement',
        goal: 'Agree how testing will be conducted safely and how to escalate.',
        checklist: [
          'Prohibited activities (DoS, social engineering, persistence) are acknowledged',
          'Stop-and-notify conditions and the one-hour notification rule are understood',
          'Primary and emergency contacts are recorded',
          'Tester egress address is shared with the client SOC',
          'Evidence handling and retention rules are accepted',
        ],
        deliverable: 'Signed RoE acknowledgement with contacts and escalation path.',
      },
      {
        key: 'inventory',
        title: 'Asset inventory',
        goal: 'Classify every known asset as in or out of scope before testing.',
        checklist: [
          'Every asset has an owner and criticality',
          'Each asset is marked in scope or out of scope with a reason from the SoW',
          'Adjacent addresses and third-party services are explicitly excluded',
          'Scanner target lists match the in-scope inventory exactly',
        ],
        deliverable: 'Asset inventory table with scope decision and justification for each asset.',
      },
      {
        key: 'triage',
        title: 'Finding triage',
        goal: 'Turn raw scanner and manual notes into validated, prioritized findings.',
        checklist: [
          'Each raw result is marked confirmed, false positive, or out of scope',
          'Confirmed findings have severity based on impact and likelihood',
          'False positives record the verification evidence',
          'Out-of-scope results are excluded and any process error is disclosed',
          'Evidence is redacted and stored in the engagement vault',
        ],
        deliverable: 'Triaged finding list with status, severity, and rationale for each item.',
      },
      {
        key: 'report',
        title: 'Report delivery',
        goal: 'Deliver a clear, scoped, prioritized Markdown report to the client.',
        checklist: [
          'Executive summary states overall risk and top priority in plain language',
          'Scope and methodology sections match the SoW and RoE',
          'Only confirmed, in-scope findings appear as findings',
          'Every finding has evidence, impact, and remediation',
          'Report contains no real credentials or unredacted personal data',
          'Readout meeting and retention date are scheduled',
        ],
        deliverable: 'Final Markdown report with executive summary, scope, methodology, findings, and remediation plan.',
      },
    ],
  },
]
