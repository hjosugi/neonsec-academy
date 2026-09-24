// ============================================================
// CEH+ SOC Log Investigation track (P5-004).
// Synthetic logs only: fictional users and hosts, documentation/private IPs,
// safe training domains, and redacted probes. Analysis and defense only.
// ============================================================
import type { TrackChallenge } from './types'

export const SOC_CHALLENGES: TrackChallenge[] = [
  {
    id: 'SOC-01',
    track: 'soc',
    kind: 'log-investigation',
    title: 'Password Spray Into an MFA-less Account',
    difficulty: 'easy',
    cehModules: [6],
    skills: ['soc-triage', 'soc-timeline', 'identity-monitoring'],
    category: 'auth-log',
    scenario:
      'The fictional NeonCorp SSO tenant raised a failure-volume alert overnight. You have an excerpt of the synthetic identity provider log and must decide what happened.',
    artifact: {
      label: 'sso-auth.log (synthetic)',
      language: 'log',
      lines: [
        '2026-03-14T01:58:02Z idp=sso.neoncorp.example user=akira src=198.51.100.23 result=SUCCESS mfa=pass',
        '2026-03-14T02:10:11Z idp=sso.neoncorp.example user=bento src=203.0.113.45 result=FAIL reason=bad_credential',
        '2026-03-14T02:10:13Z idp=sso.neoncorp.example user=chiyo src=203.0.113.45 result=FAIL reason=bad_credential',
        '2026-03-14T02:10:16Z idp=sso.neoncorp.example user=daisuke src=203.0.113.45 result=FAIL reason=bad_credential',
        '2026-03-14T02:14:40Z idp=sso.neoncorp.example user=emi src=198.51.100.23 result=SUCCESS mfa=pass',
        '2026-03-14T02:21:00Z siem=auth-agg src=203.0.113.45 fail_count=212 distinct_users=71 window=11m lockouts=0',
        '2026-03-14T02:21:40Z idp=sso.neoncorp.example user=fumiko src=203.0.113.45 result=SUCCESS mfa=not_enrolled',
        '2026-03-14T02:22:15Z app=mail.neoncorp.example user=fumiko src=203.0.113.45 action=inbox_rule_created rule=forward-all-external',
        '2026-03-14T02:24:03Z app=docs.neoncorp.example user=fumiko src=203.0.113.45 action=bulk_download files=340',
        '2026-03-14T02:30:00Z idp=sso.neoncorp.example user=gin src=198.51.100.23 result=SUCCESS mfa=pass',
      ],
    },
    linePrompt:
      'Select the log lines that show the spray volume, the account takeover, and the post-compromise activity.',
    answerLines: [6, 7, 8, 9],
    classification: {
      prompt: 'What activity best explains this log excerpt?',
      options: [
        'Single-account brute force against fumiko',
        'Password spraying that led to an account takeover',
        'Credential stuffing from a large botnet of many sources',
        'A legitimate user repeatedly mistyping a password',
      ],
      answer: 'Password spraying that led to an account takeover',
    },
    writeups: [
      {
        key: 'indicator',
        label: 'Indicator',
        prompt: 'Which observable proves this is an attack rather than user error?',
        model:
          'One source (203.0.113.45) produced 212 failures across 71 distinct users in 11 minutes, then succeeded as fumiko without MFA and immediately created an external forwarding rule.',
      },
      {
        key: 'affected-asset',
        label: 'Affected asset',
        prompt: 'Which account and data are affected?',
        model:
          'The fumiko account (MFA not enrolled), its mailbox through the forwarding rule, and the 340 documents bulk-downloaded from the fictional docs service.',
      },
      {
        key: 'next-action',
        label: 'Next action',
        prompt: 'What should the analyst do first?',
        model:
          'Revoke fumiko sessions and reset the credential, remove the forwarding rule, block the source, enroll MFA, then scope every other login from 203.0.113.45.',
      },
    ],
    explanation:
      'Spraying tries a few passwords against many usernames from one source, which stays under per-account lockout. The only success came from the account without MFA, and the inbox rule plus bulk download show the attacker acting on that access.',
    remediation:
      'Enforce MFA for every account, block legacy flows that bypass it, add source-based throttling, and review mailbox forwarding rules created shortly after risky sign-ins.',
    detection:
      'Alert when one source fails against more than 20 distinct usernames within 15 minutes, raise severity on any subsequent success from that source, and correlate new external forwarding rules created within an hour of such a login.',
    containment:
      'Disable the compromised session and account, remove the forwarding rule, block 203.0.113.45 at the identity layer, and preserve the mailbox and download audit records before resetting the credential.',
    timeline: [
      { time: '2026-03-14T02:21:00Z', line: 6, observation: 'Aggregated 212 failures across 71 users from 203.0.113.45 in 11 minutes.' },
      { time: '2026-03-14T02:21:40Z', line: 7, observation: 'Spray source logs in as fumiko; MFA not enrolled.' },
      { time: '2026-03-14T02:22:15Z', line: 8, observation: 'External forward-all inbox rule created on the fumiko mailbox.' },
      { time: '2026-03-14T02:24:03Z', line: 9, observation: 'Bulk download of 340 documents by the compromised account.' },
    ],
  },
  {
    id: 'SOC-02',
    track: 'soc',
    kind: 'log-investigation',
    title: 'Impossible Travel on a Finance Account',
    difficulty: 'medium',
    cehModules: [6, 11],
    skills: ['soc-triage', 'soc-timeline', 'identity-monitoring'],
    category: 'auth-log',
    scenario:
      'A risk engine at the fictional Kitsune Pay flagged the finance user haruto. The synthetic sign-in log includes device and location enrichment fields.',
    artifact: {
      label: 'signin-risk.log (synthetic)',
      language: 'log',
      lines: [
        '2026-04-02T07:55:10Z user=mei src=198.51.100.14 geo=JP-Tokyo device=managed-laptop-22 vpn=corp auth=modern mfa=pass result=SUCCESS',
        '2026-04-02T08:02:31Z user=haruto src=198.51.100.18 geo=JP-Tokyo device=managed-laptop-07 vpn=corp auth=modern mfa=pass result=SUCCESS',
        '2026-04-02T08:15:02Z user=haruto src=198.51.100.18 geo=JP-Tokyo app=erp.kitsunepay.example action=view_invoices',
        '2026-04-02T08:31:47Z user=haruto src=203.0.113.99 geo=NL-Amsterdam device=unknown vpn=none auth=legacy_basic mfa=not_applicable result=SUCCESS',
        '2026-04-02T08:33:05Z user=haruto src=203.0.113.99 geo=NL-Amsterdam app=mail.kitsunepay.example action=mailbox_sync items=5120',
        '2026-04-02T08:36:44Z user=haruto src=203.0.113.99 geo=NL-Amsterdam app=erp.kitsunepay.example action=change_payee_bank_details vendor=V-2291',
        '2026-04-02T08:40:12Z user=sora src=198.51.100.14 geo=JP-Tokyo device=managed-laptop-31 vpn=corp auth=modern mfa=pass result=SUCCESS',
        '2026-04-02T08:52:19Z user=haruto src=198.51.100.18 geo=JP-Tokyo device=managed-laptop-07 vpn=corp app=erp.kitsunepay.example action=view_invoices',
      ],
    },
    linePrompt:
      'Select the legitimate baseline sign-in, the impossible-travel sign-in, and what the second session did.',
    answerLines: [2, 4, 5, 6],
    classification: {
      prompt: 'Which conclusion best fits the evidence?',
      options: [
        'A traveling employee whose VPN egress changed countries',
        'Scheduled synchronization by a service account',
        'Credential compromise shown by impossible travel and legacy authentication',
        'Password spraying against the finance department',
      ],
      answer: 'Credential compromise shown by impossible travel and legacy authentication',
    },
    writeups: [
      {
        key: 'indicator',
        label: 'Indicator',
        prompt: 'Which observable proves the second session is not the real user?',
        model:
          'Haruto was active from a managed device in Tokyo while, 29 minutes later, an unknown device in Amsterdam signed in without VPN via legacy basic auth that skipped MFA; the Tokyo device kept working afterwards.',
      },
      {
        key: 'affected-asset',
        label: 'Affected asset',
        prompt: 'Which account and data are affected?',
        model:
          'The haruto finance account, its synchronized mailbox (5120 items), and the payee bank details of vendor V-2291 in the fictional ERP.',
      },
      {
        key: 'next-action',
        label: 'Next action',
        prompt: 'What should happen first?',
        model:
          'Revoke all haruto sessions and reset the credential, freeze and verify the payee change with the vendor through a known channel, and disable legacy authentication for the tenant.',
      },
    ],
    explanation:
      'Two successful sessions from locations that cannot be travelled between in 29 minutes, with the second on an unknown device using a legacy protocol that bypasses MFA, indicate stolen credentials. The payee change points to payment-diversion fraud.',
    remediation:
      'Block legacy authentication, require phishing-resistant MFA for finance roles, add dual approval for payee changes, and enforce conditional access that requires managed devices for ERP.',
    detection:
      'Correlate successful sign-ins for one user whose geo distance divided by elapsed time exceeds plausible travel speed, and raise severity when the second sign-in uses legacy auth, an unknown device, or is followed by a sensitive ERP change.',
    containment:
      'Revoke tokens for the account, block 203.0.113.99 at the identity layer, hold pending payments to V-2291, and preserve sign-in and ERP audit records for the investigation.',
    timeline: [
      { time: '2026-04-02T08:02:31Z', line: 2, observation: 'Legitimate haruto sign-in from managed device in Tokyo with MFA.' },
      { time: '2026-04-02T08:31:47Z', line: 4, observation: 'Unknown device in Amsterdam signs in as haruto using legacy basic auth, no MFA.' },
      { time: '2026-04-02T08:33:05Z', line: 5, observation: 'Second session syncs 5120 mailbox items.' },
      { time: '2026-04-02T08:36:44Z', line: 6, observation: 'Second session changes payee bank details for vendor V-2291.' },
    ],
  },
  {
    id: 'SOC-03',
    track: 'soc',
    kind: 'log-investigation',
    title: 'Enumeration Burst Ends in a Backup Download',
    difficulty: 'easy',
    cehModules: [13, 14],
    skills: ['soc-web', 'soc-triage'],
    category: 'web-access-log',
    scenario:
      'The storefront for the fictional Neon Harbor Logistics saw a spike of 404 responses. You have a trimmed synthetic access log from the web tier.',
    artifact: {
      label: 'shop-access.log (synthetic)',
      language: 'log',
      lines: [
        '2026-05-09T11:02:14Z 198.51.100.40 "GET /catalog HTTP/1.1" 200 18233 ua="Mozilla/5.0 (fictional browser)"',
        '2026-05-09T11:04:51Z 203.0.113.77 "GET /admin HTTP/1.1" 404 512 ua="generic-crawler/2"',
        '2026-05-09T11:04:51Z 203.0.113.77 "GET /old HTTP/1.1" 404 512 ua="generic-crawler/2"',
        '2026-05-09T11:04:52Z 203.0.113.77 "GET /test HTTP/1.1" 404 512 ua="generic-crawler/2"',
        '2026-05-09T11:08:59Z waf-agg src=203.0.113.77 status_404=1380 distinct_paths=1377 window=4m',
        '2026-05-09T11:09:03Z 203.0.113.77 "GET /backup/ HTTP/1.1" 403 280 ua="generic-crawler/2"',
        '2026-05-09T11:09:04Z 203.0.113.77 "GET /backup/shop-db.bak HTTP/1.1" 200 48213990 ua="generic-crawler/2"',
        '2026-05-09T11:10:30Z 198.51.100.41 "GET /cart HTTP/1.1" 200 7342 ua="Mozilla/5.0 (fictional browser)"',
        '2026-05-09T11:12:47Z 203.0.113.77 "POST /account/login HTTP/1.1" 302 0 ua="generic-crawler/2"',
      ],
    },
    linePrompt:
      'Select the lines that show the enumeration burst and the successful retrieval of the sensitive file, plus the follow-on action.',
    answerLines: [5, 7, 9],
    classification: {
      prompt: 'What does the log show?',
      options: [
        'A search engine crawler indexing the catalog',
        'Directory enumeration that exposed a publicly reachable database backup',
        'A volumetric denial-of-service attack',
        'A broken deployment returning 404 for every page',
      ],
      answer: 'Directory enumeration that exposed a publicly reachable database backup',
    },
    writeups: [
      {
        key: 'indicator',
        label: 'Indicator',
        prompt: 'Which observable matters most?',
        model:
          'After 1380 not-found responses over 1377 distinct paths in four minutes, the same source received HTTP 200 with about 48 MB for a database backup under the web root.',
      },
      {
        key: 'affected-asset',
        label: 'Affected asset',
        prompt: 'What is exposed?',
        model:
          'The storefront web tier and the shop database backup file, which likely contains customer and order records plus credential hashes.',
      },
      {
        key: 'next-action',
        label: 'Next action',
        prompt: 'What should the analyst do first?',
        model:
          'Remove the backup from the web root, block the source, treat the data as disclosed (rotate stored secrets, assess customer impact), and review the later login attempt from the same source.',
      },
    ],
    explanation:
      'A burst of 404s across many unique paths from one client is content discovery. The decisive event is the 200 response with a large body for a backup file that should never be web-served; the POST to login suggests the attacker is trying to use what they found.',
    remediation:
      'Keep backups outside the web root in access-controlled storage, deny backup-like extensions at the web server, and add alerting for large responses to unusual paths.',
    detection:
      'Alert when one client produces more than 200 not-found responses across distinct paths within five minutes, and escalate any 200 response larger than a few megabytes for a path that client first requested during that burst.',
    containment:
      'Delete or relocate the exposed backup, block 203.0.113.77 at the WAF, invalidate sessions created from that source, and preserve access logs covering the full burst.',
    timeline: [
      { time: '2026-05-09T11:08:59Z', line: 5, observation: 'WAF aggregate: 1380 not-found responses across 1377 paths from 203.0.113.77.' },
      { time: '2026-05-09T11:09:04Z', line: 7, observation: 'Same source downloads the 48 MB database backup with HTTP 200.' },
      { time: '2026-05-09T11:12:47Z', line: 9, observation: 'Same source attempts a storefront login after the download.' },
    ],
  },
  {
    id: 'SOC-04',
    track: 'soc',
    kind: 'log-investigation',
    title: 'Injection Probes and an Oversized Response',
    difficulty: 'medium',
    cehModules: [15, 14],
    skills: ['soc-web', 'soc-triage', 'soc-timeline'],
    category: 'web-access-log',
    scenario:
      'The fictional NeonCorp partner API started throwing 500 errors on its search endpoint. Probe values in this synthetic excerpt are redacted.',
    artifact: {
      label: 'partner-api-access.log (synthetic)',
      language: 'log',
      lines: [
        '2026-06-21T14:00:05Z 198.51.100.61 "GET /api/search?q=widgets HTTP/1.1" 200 2214 ms=38',
        '2026-06-21T14:03:12Z 203.0.113.150 "GET /api/search?q=[REDACTED-INJECTION-PROBE] HTTP/1.1" 500 311 ms=12',
        '2026-06-21T14:03:13Z app=partner-api level=error msg="database syntax error near [REDACTED]" route=/api/search',
        '2026-06-21T14:03:20Z 203.0.113.150 "GET /api/search?q=[REDACTED-INJECTION-PROBE] HTTP/1.1" 500 311 ms=11',
        '2026-06-21T14:04:02Z 203.0.113.150 "GET /api/search?q=[REDACTED-INJECTION-PROBE] HTTP/1.1" 200 2216 ms=41',
        '2026-06-21T14:06:44Z 198.51.100.62 "GET /api/search?q=gears HTTP/1.1" 200 1980 ms=35',
        '2026-06-21T14:09:31Z 203.0.113.150 "GET /api/search?q=[REDACTED-INJECTION-PROBE] HTTP/1.1" 200 2238112 ms=2890',
        '2026-06-21T14:10:02Z 203.0.113.150 "GET /api/search?q=[REDACTED-INJECTION-PROBE] HTTP/1.1" 200 2241907 ms=2954',
        '2026-06-21T14:15:40Z 198.51.100.61 "GET /api/orders/7781 HTTP/1.1" 200 1204 ms=22',
      ],
    },
    linePrompt:
      'Select the first probe, the database error it triggered, and the responses that indicate extraction.',
    answerLines: [2, 3, 7, 8],
    classification: {
      prompt: 'What is the most likely explanation?',
      options: [
        'A bad deployment broke the search endpoint for everyone',
        'Volumetric denial of service against the API',
        'A partner integration sending malformed but harmless queries',
        'SQL injection probing followed by probable data extraction',
      ],
      answer: 'SQL injection probing followed by probable data extraction',
    },
    writeups: [
      {
        key: 'indicator',
        label: 'Indicator',
        prompt: 'Which observables support your conclusion?',
        model:
          'Only 203.0.113.150 triggers 500s with a database syntax error, and its later search responses are about 1000 times larger and far slower than normal searches.',
      },
      {
        key: 'affected-asset',
        label: 'Affected asset',
        prompt: 'What is affected?',
        model:
          'The partner API search endpoint and the database behind it; the oversized responses suggest records beyond the search table were returned.',
      },
      {
        key: 'next-action',
        label: 'Next action',
        prompt: 'What should the analyst do first?',
        model:
          'Block the source, capture the full request and response logs, escalate to the API owners for an emergency fix of the query, and assess which tables were readable by the service account.',
      },
    ],
    explanation:
      'Crafted input that produces database syntax errors shows the query is built from user input. The shift from errors to successful responses with huge bodies and long execution times indicates the attacker found a working injection and pulled bulk data.',
    remediation:
      'Use parameterized queries, validate search input against an allowlist, return generic errors, cap response size, and run the API database account with read access limited to the search view.',
    detection:
      'Alert on database syntax errors surfaced by a public route, and on responses from one route whose size or latency exceeds a baseline percentile by a large factor for the same client.',
    containment:
      'Block 203.0.113.150 at the WAF, temporarily disable or restrict the search route, rotate the API database credential, and preserve application and database logs.',
    timeline: [
      { time: '2026-06-21T14:03:12Z', line: 2, observation: 'First redacted injection probe from 203.0.113.150 returns 500.' },
      { time: '2026-06-21T14:03:13Z', line: 3, observation: 'Application logs a database syntax error on the search route.' },
      { time: '2026-06-21T14:09:31Z', line: 7, observation: 'Probe returns 200 with about 2.2 MB and 2.9 s latency.' },
      { time: '2026-06-21T14:10:02Z', line: 8, observation: 'Second oversized response indicates repeated extraction.' },
    ],
  },
  {
    id: 'SOC-05',
    track: 'soc',
    kind: 'log-investigation',
    title: 'Metronome DNS Beaconing',
    difficulty: 'medium',
    cehModules: [7],
    skills: ['soc-dns', 'soc-triage'],
    category: 'dns-log',
    scenario:
      'The resolver for the fictional Tokyo-7 Transit office enriches queries with domain age. One workstation keeps asking for the same name.',
    artifact: {
      label: 'resolver-query.log (synthetic)',
      language: 'log',
      lines: [
        '2026-02-11T09:00:02Z client=10.20.4.31 host=ws-031.corp.internal qname=intranet.tokyo7.internal qtype=A rcode=NOERROR',
        '2026-02-11T09:00:07Z client=10.20.4.114 host=ws-114.corp.internal qname=sync.cdn-telemetry.test qtype=A rcode=NOERROR answer=203.0.113.200 domain_age_days=2',
        '2026-02-11T09:02:40Z client=10.20.4.31 host=ws-031.corp.internal qname=mail.tokyo7.internal qtype=MX rcode=NOERROR',
        '2026-02-11T09:05:07Z client=10.20.4.114 host=ws-114.corp.internal qname=sync.cdn-telemetry.test qtype=A rcode=NOERROR answer=203.0.113.200 domain_age_days=2',
        '2026-02-11T09:07:55Z client=10.20.4.52 host=ws-052.corp.internal qname=updates.vendor-portal.example qtype=A rcode=NOERROR domain_age_days=2900',
        '2026-02-11T09:10:07Z client=10.20.4.114 host=ws-114.corp.internal qname=sync.cdn-telemetry.test qtype=A rcode=NOERROR answer=203.0.113.200 domain_age_days=2',
        '2026-02-11T09:15:07Z client=10.20.4.114 host=ws-114.corp.internal qname=sync.cdn-telemetry.test qtype=A rcode=NOERROR answer=203.0.113.200 domain_age_days=2',
        '2026-02-11T09:15:30Z dns-agg host=ws-114.corp.internal qname=sync.cdn-telemetry.test interval_s=300 jitter_s=0 queries_24h=288 other_clients=0',
        '2026-02-11T09:16:11Z client=10.20.4.31 host=ws-031.corp.internal qname=intranet.tokyo7.internal qtype=A rcode=NOERROR',
      ],
    },
    linePrompt:
      'Select every beacon query from the suspicious workstation and the aggregate that confirms the cadence.',
    answerLines: [2, 4, 6, 7, 8],
    classification: {
      prompt: 'What does this pattern most likely represent?',
      options: [
        'A normal software update check',
        'DNS amplification against the resolver',
        'Periodic command-and-control style beaconing from one workstation',
        'An unauthorized zone transfer attempt',
      ],
      answer: 'Periodic command-and-control style beaconing from one workstation',
    },
    writeups: [
      {
        key: 'indicator',
        label: 'Indicator',
        prompt: 'Which properties make the queries suspicious?',
        model:
          'Only ws-114 queries a two-day-old domain exactly every 300 seconds with zero jitter, 288 times per day, while no other client uses it.',
      },
      {
        key: 'affected-asset',
        label: 'Affected asset',
        prompt: 'Which asset is affected?',
        model:
          'Workstation ws-114 (10.20.4.114), which is the likely infected host; 203.0.113.200 is the suspected controller address.',
      },
      {
        key: 'next-action',
        label: 'Next action',
        prompt: 'What should the analyst do next?',
        model:
          'Isolate ws-114 through EDR, collect volatile evidence, sinkhole the domain at the resolver, and search proxy and firewall logs for other hosts contacting 203.0.113.200.',
      },
    ],
    explanation:
      'Machine-regular intervals without jitter, a newly registered domain, and a single querying host are classic beacon traits. Legitimate update checks usually come from many hosts to long-lived vendor domains.',
    remediation:
      'Block newly registered domains by policy, route all DNS through monitored resolvers, and keep EDR coverage on workstations so beacons can be tied to a process.',
    detection:
      'Score client and domain pairs by interval regularity (low standard deviation), low domain age, and a small number of distinct clients, and alert when all three exceed thresholds over a day.',
    containment:
      'Network-isolate ws-114, sinkhole the domain, block 203.0.113.200 at the egress firewall, and image the host before remediation.',
    timeline: [
      { time: '2026-02-11T09:00:07Z', line: 2, observation: 'ws-114 resolves a two-day-old domain to 203.0.113.200.' },
      { time: '2026-02-11T09:05:07Z', line: 4, observation: 'Same query repeats exactly 300 seconds later.' },
      { time: '2026-02-11T09:10:07Z', line: 6, observation: 'Cadence continues with zero jitter.' },
      { time: '2026-02-11T09:15:30Z', line: 8, observation: 'Aggregate confirms 288 queries per day, no other clients.' },
    ],
  },
  {
    id: 'SOC-06',
    track: 'soc',
    kind: 'log-investigation',
    title: 'High-Entropy TXT Lookups From a Build Server',
    difficulty: 'hard',
    cehModules: [12, 8],
    skills: ['soc-dns', 'soc-exfil-detection'],
    category: 'dns-log',
    scenario:
      'A build server at the fictional NeonCorp should only talk to internal package mirrors. The resolver log shows an unusual volume of TXT lookups.',
    artifact: {
      label: 'build-resolver.log (synthetic)',
      language: 'log',
      lines: [
        '2026-07-03T22:40:01Z client=10.30.2.7 host=build-07.corp.internal qname=mirror.corp.internal qtype=A rcode=NOERROR',
        '2026-07-03T22:41:15Z client=10.30.2.7 host=build-07.corp.internal qname=4f2a9c07e1b3d5a8c6f0e2b4d6a8c0e2f4a6b8c0d2e4f6a8b0c2d4e6.x.pipe-relay.test qtype=TXT rcode=NOERROR',
        '2026-07-03T22:41:15Z client=10.30.2.7 host=build-07.corp.internal qname=9b1d3f5a7c9e0b2d4f6a8c0e1b3d5f7a9c0e2b4d6f8a1c3e5b7d9f0a2c4.x.pipe-relay.test qtype=TXT rcode=NOERROR',
        '2026-07-03T22:41:16Z client=10.30.2.7 host=build-07.corp.internal qname=e0c2a4f6b8d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8.x.pipe-relay.test qtype=TXT rcode=NOERROR',
        '2026-07-03T22:45:00Z client=10.30.2.12 host=build-12.corp.internal qname=mirror.corp.internal qtype=A rcode=NOERROR',
        '2026-07-03T23:01:30Z dns-agg host=build-07.corp.internal zone=pipe-relay.test qtype=TXT unique_subdomains=1840 avg_label_len=58 window=20m',
        '2026-07-03T23:01:30Z dns-agg host=build-07.corp.internal zone=pipe-relay.test bytes_in_qnames=106720 other_clients=0 domain_age_days=5',
        '2026-07-03T23:04:12Z client=10.30.2.7 host=build-07.corp.internal qname=mirror.corp.internal qtype=A rcode=NOERROR',
      ],
    },
    linePrompt:
      'Select every high-entropy TXT query and the aggregates that quantify them.',
    answerLines: [2, 3, 4, 6, 7],
    classification: {
      prompt: 'What is the most plausible explanation?',
      options: [
        'DNSSEC validation traffic from the resolver',
        'Possible DNS tunneling used for data exfiltration',
        'CDN load balancing across edge nodes',
        'Cache poisoning of the internal resolver',
      ],
      answer: 'Possible DNS tunneling used for data exfiltration',
    },
    writeups: [
      {
        key: 'indicator',
        label: 'Indicator',
        prompt: 'Which properties are abnormal?',
        model:
          'Build-07 sent 1840 unique TXT lookups with about 58-character high-entropy labels to a five-day-old zone in 20 minutes, moving roughly 100 KB inside query names, and no other client uses that zone.',
      },
      {
        key: 'affected-asset',
        label: 'Affected asset',
        prompt: 'Which asset is affected?',
        model:
          'Build server build-07 (10.30.2.7) and whatever data it can read, such as source code and build secrets.',
      },
      {
        key: 'next-action',
        label: 'Next action',
        prompt: 'What should the analyst do next?',
        model:
          'Block the zone at the resolver, isolate build-07, identify the process issuing the lookups, and rotate secrets available to the build pipeline.',
      },
    ],
    explanation:
      'Data can be smuggled out inside DNS query names. Many unique, long, random-looking labels under one young zone, sent from a server that normally resolves only internal mirrors, strongly suggests tunneling rather than normal lookups.',
    remediation:
      'Restrict build servers to internal resolvers that only forward approved zones, alert on label entropy and length, and keep build secrets short-lived and scoped.',
    detection:
      'For each client and parent zone, alert when unique subdomain count, average label length, and label entropy exceed baselines within a short window, especially for TXT or NULL query types and young zones.',
    containment:
      'Sinkhole the zone, isolate build-07, preserve resolver logs and a host image, and rotate every credential the build pipeline could access.',
    timeline: [
      { time: '2026-07-03T22:41:15Z', line: 2, observation: 'First high-entropy TXT query to the young zone from build-07.' },
      { time: '2026-07-03T23:01:30Z', line: 6, observation: 'Aggregate: 1840 unique subdomains with 58-character labels in 20 minutes.' },
      { time: '2026-07-03T23:01:30Z', line: 7, observation: 'About 106 KB carried in query names; no other clients; zone five days old.' },
    ],
  },
  {
    id: 'SOC-07',
    track: 'soc',
    kind: 'log-investigation',
    title: 'Office Document Spawns a Script Host',
    difficulty: 'medium',
    cehModules: [7, 9],
    skills: ['soc-edr', 'soc-triage', 'soc-timeline'],
    category: 'endpoint-alert',
    scenario:
      'EDR at the fictional Neon Harbor Logistics raised a chain of alerts on the workstation of the user kaori shortly after she opened an emailed invoice.',
    artifact: {
      label: 'edr-alerts.log (synthetic)',
      language: 'log',
      lines: [
        '2026-08-18T09:12:40Z host=ws-203.corp.internal user=kaori proc=mail-client.exe event=attachment_saved file=invoice_0818.docm sender=billing@harbor-invoices.example',
        '2026-08-18T09:13:02Z host=ws-203.corp.internal user=kaori proc=office-suite.exe event=document_opened file=invoice_0818.docm macros=enabled',
        '2026-08-18T09:13:05Z host=ws-203.corp.internal user=kaori parent=office-suite.exe proc=script-host.exe args=[REDACTED-OBFUSCATED-ARGS] severity=high rule=office-child-script',
        '2026-08-18T09:13:07Z host=ws-203.corp.internal user=kaori proc=script-host.exe event=network_connect dst=198.51.100.66:443',
        '2026-08-18T09:13:11Z host=ws-203.corp.internal user=kaori proc=script-host.exe event=file_write path=C:/Users/kaori/AppData/Roaming/updater.exe signed=false',
        '2026-08-18T09:13:14Z host=ws-203.corp.internal user=kaori proc=script-host.exe event=scheduled_task_created name=UserUpdateCheck',
        '2026-08-18T09:30:00Z host=ws-203.corp.internal user=kaori proc=browser.exe event=network_connect dst=10.40.0.20:443',
        '2026-08-18T10:00:00Z host=ws-203.corp.internal proc=updater.exe event=network_connect dst=198.51.100.66:443 severity=medium',
      ],
    },
    linePrompt:
      'Select the script-host lines that form the malicious chain: execution, outbound connection, dropped file, and persistence.',
    answerLines: [3, 4, 5, 6],
    classification: {
      prompt: 'What does this alert chain represent?',
      options: [
        'Malicious macro document leading to script execution and persistence',
        'A routine application updater installing itself',
        'The user running an approved administrative script',
        'A browser crash triggered by a faulty extension',
      ],
      answer: 'Malicious macro document leading to script execution and persistence',
    },
    writeups: [
      {
        key: 'indicator',
        label: 'Indicator',
        prompt: 'Which observable is the strongest indicator?',
        model:
          'The office suite spawned a script host with obfuscated arguments seconds after a macro-enabled attachment was opened, and that script host contacted 198.51.100.66, wrote an unsigned binary, and created a scheduled task.',
      },
      {
        key: 'affected-asset',
        label: 'Affected asset',
        prompt: 'Which asset is affected?',
        model:
          'Workstation ws-203 and the kaori user profile; the dropped unsigned updater and its scheduled task are the persistence artifacts.',
      },
      {
        key: 'next-action',
        label: 'Next action',
        prompt: 'What should happen next?',
        model:
          'Isolate ws-203, collect the document, dropped binary, and task definition as evidence, block 198.51.100.66, and search mail logs for the same sender to find other recipients.',
      },
    ],
    explanation:
      'Office applications rarely need to launch script interpreters. The chain of macro-enabled document, script host, outbound connection, unsigned file drop, and scheduled task is initial access followed by persistence.',
    remediation:
      'Block macros from internet-sourced documents, enable attack surface reduction rules for office child processes, quarantine lookalike sender domains, and train users to report unexpected invoices.',
    detection:
      'Alert whenever an office process spawns a script interpreter, and raise severity when the child makes an external connection, writes an unsigned executable to a user profile, or creates a scheduled task within minutes.',
    containment:
      'Network-isolate the host via EDR, stop and remove the scheduled task only after evidence collection, block the destination address, and purge the email from all mailboxes.',
    timeline: [
      { time: '2026-08-18T09:13:05Z', line: 3, observation: 'Office suite spawns script host with obfuscated arguments.' },
      { time: '2026-08-18T09:13:07Z', line: 4, observation: 'Script host connects to 198.51.100.66 over 443.' },
      { time: '2026-08-18T09:13:11Z', line: 5, observation: 'Unsigned updater binary written to the user roaming profile.' },
      { time: '2026-08-18T09:13:14Z', line: 6, observation: 'Scheduled task UserUpdateCheck created for persistence.' },
    ],
  },
  {
    id: 'SOC-08',
    track: 'soc',
    kind: 'log-investigation',
    title: 'Credential Store Access Then Lateral Logons',
    difficulty: 'hard',
    cehModules: [6],
    skills: ['soc-edr', 'soc-lateral-movement', 'soc-timeline'],
    category: 'endpoint-alert',
    scenario:
      'A fictional NeonCorp database server raised an EDR alert after an interactive logon by a deployment service account.',
    artifact: {
      label: 'server-edr.log (synthetic)',
      language: 'log',
      lines: [
        '2026-09-02T01:05:44Z host=app-db-02.corp.internal event=logon type=interactive account=svc_deploy src=10.20.4.114',
        '2026-09-02T01:06:10Z host=app-db-02.corp.internal proc=patch-agent.exe signed=true event=service_heartbeat',
        '2026-09-02T01:07:02Z host=app-db-02.corp.internal account=svc_deploy proc=C:/Windows/Temp/cred-tool.exe signed=false event=process_start',
        '2026-09-02T01:07:05Z host=app-db-02.corp.internal proc=cred-tool.exe event=memory_read target=lsa-credential-store severity=critical rule=credential-store-access',
        '2026-09-02T01:09:40Z host=app-db-02.corp.internal account=svc_deploy event=local_account_created name=support_tmp group=Administrators',
        '2026-09-02T01:12:18Z host=fs-01.corp.internal event=logon type=remote_interactive account=dbadmin src=10.20.8.12',
        '2026-09-02T01:13:55Z host=hr-app-01.corp.internal event=logon type=network account=dbadmin src=10.20.8.12',
        '2026-09-02T01:20:00Z host=app-db-02.corp.internal proc=backup-agent.exe signed=true event=scheduled_backup_start',
      ],
    },
    linePrompt:
      'Select the lines showing the unsigned tool, the credential-store access, the new admin account, and the first lateral logon.',
    answerLines: [3, 4, 5, 6],
    classification: {
      prompt: 'Which conclusion fits the evidence?',
      options: [
        'The backup agent reading memory during a scheduled job',
        'An antivirus scan touching protected processes',
        'Routine patch installation by the deployment account',
        'Credential dumping followed by lateral movement',
      ],
      answer: 'Credential dumping followed by lateral movement',
    },
    writeups: [
      {
        key: 'indicator',
        label: 'Indicator',
        prompt: 'Which observable matters most?',
        model:
          'An unsigned tool launched from a temp folder by svc_deploy read the credential store memory, a local admin was created, and minutes later dbadmin logged on to other servers from app-db-02 (10.20.8.12).',
      },
      {
        key: 'affected-asset',
        label: 'Affected asset',
        prompt: 'Which assets are affected?',
        model:
          'Server app-db-02, the svc_deploy and dbadmin credentials, and the lateral targets fs-01 and hr-app-01; ws-114 is the source of the initial logon.',
      },
      {
        key: 'next-action',
        label: 'Next action',
        prompt: 'What should happen next?',
        model:
          'Isolate app-db-02, disable svc_deploy, dbadmin, and support_tmp, reset credentials cached on the server, and scope every logon made by those accounts in the last day.',
      },
    ],
    explanation:
      'Legitimate agents are signed and do not read the credential store. An unsigned temp-folder tool touching it, followed by a new local admin and logons with a different privileged account from this server, shows credentials were harvested and reused.',
    remediation:
      'Enable credential store protection, remove interactive logon rights from service accounts, use tiered admin accounts, and deploy unique local admin passwords managed by a vault.',
    detection:
      'Alert on any non-allowlisted process reading credential store memory, on local admin group changes, and on privileged accounts logging on from servers they have never originated from.',
    containment:
      'Isolate app-db-02 and the source ws-114, disable the involved accounts, force credential resets for accounts cached on the server, and block remote logons from 10.20.8.12.',
    timeline: [
      { time: '2026-09-02T01:05:44Z', line: 1, observation: 'svc_deploy logs on interactively to app-db-02 from ws-114.' },
      { time: '2026-09-02T01:07:05Z', line: 4, observation: 'Unsigned tool reads credential store memory.' },
      { time: '2026-09-02T01:09:40Z', line: 5, observation: 'Local admin support_tmp created.' },
      { time: '2026-09-02T01:12:18Z', line: 6, observation: 'dbadmin logs on to fs-01 from app-db-02.' },
      { time: '2026-09-02T01:13:55Z', line: 7, observation: 'dbadmin logs on to hr-app-01 from app-db-02.' },
    ],
  },
  {
    id: 'SOC-09',
    track: 'soc',
    kind: 'log-investigation',
    title: 'Egress Probing Finds an Open Door',
    difficulty: 'medium',
    cehModules: [12, 8],
    skills: ['soc-network', 'soc-firewall'],
    category: 'firewall-log',
    scenario:
      'The perimeter firewall of the fictional Kitsune Pay office logged a run of denied outbound connections from one workstation.',
    artifact: {
      label: 'perimeter-fw.log (synthetic)',
      language: 'log',
      lines: [
        '2026-10-05T13:00:12Z action=ALLOW src=10.20.7.40 dst=198.51.100.80 dport=443 proto=tcp rule=web-egress bytes_out=5120',
        '2026-10-05T13:02:01Z action=DENY src=10.20.7.31 dst=203.0.113.140 dport=4444 proto=tcp rule=default-deny',
        '2026-10-05T13:02:03Z action=DENY src=10.20.7.31 dst=203.0.113.140 dport=6667 proto=tcp rule=default-deny',
        '2026-10-05T13:02:05Z action=DENY src=10.20.7.31 dst=203.0.113.140 dport=8081 proto=tcp rule=default-deny',
        '2026-10-05T13:02:08Z fw-agg src=10.20.7.31 dst=203.0.113.140 denied_distinct_ports=14 window=8s',
        '2026-10-05T13:02:09Z action=ALLOW src=10.20.7.31 dst=203.0.113.140 dport=8443 proto=tcp rule=legacy-any-8443',
        '2026-10-05T13:47:30Z action=CLOSE src=10.20.7.31 dst=203.0.113.140 dport=8443 proto=tcp duration_s=2721 bytes_out=327155712 bytes_in=40960',
        '2026-10-05T13:50:00Z action=ALLOW src=10.20.7.40 dst=198.51.100.80 dport=443 proto=tcp rule=web-egress bytes_out=6144',
      ],
    },
    linePrompt:
      'Select the aggregate that quantifies the probing, the permitted connection, and the transfer size.',
    answerLines: [5, 6, 7],
    classification: {
      prompt: 'What does the sequence indicate?',
      options: [
        'An inbound port scan from the internet',
        'Egress probing for an allowed port followed by a large outbound transfer',
        'A misconfigured time synchronization client',
        'Normal HTTPS browsing by the user',
      ],
      answer: 'Egress probing for an allowed port followed by a large outbound transfer',
    },
    writeups: [
      {
        key: 'indicator',
        label: 'Indicator',
        prompt: 'Which observable matters most?',
        model:
          'Host 10.20.7.31 was denied on 14 distinct ports to 203.0.113.140 within 8 seconds until a legacy rule allowed 8443, then held a 45-minute session that sent about 312 MB while receiving only 40 KB.',
      },
      {
        key: 'affected-asset',
        label: 'Affected asset',
        prompt: 'Which assets are affected?',
        model:
          'Workstation 10.20.7.31 and any data it could reach; the permissive legacy-any-8443 firewall rule is the control gap.',
      },
      {
        key: 'next-action',
        label: 'Next action',
        prompt: 'What should happen next?',
        model:
          'Block 203.0.113.140, disable or scope the legacy rule, isolate 10.20.7.31, and identify the process and data behind the 312 MB upload.',
      },
    ],
    explanation:
      'Sequential denied attempts to one external address across unrelated ports are a client searching for an egress path. The first allowed port leads to a long, heavily outbound session, which is typical of exfiltration.',
    remediation:
      'Remove any-destination legacy rules, force outbound traffic through an authenticated proxy, and alert on large asymmetric uploads to uncategorized destinations.',
    detection:
      'Alert when one internal source is denied on three or more distinct destination ports to the same external address within a minute, and correlate with any subsequent allowed session to that address.',
    containment:
      'Block the destination at the perimeter, disable the legacy rule, isolate the workstation, and preserve firewall session logs plus the host image.',
    timeline: [
      { time: '2026-10-05T13:02:01Z', line: 2, observation: 'First denied outbound attempt to 203.0.113.140 on an unusual port.' },
      { time: '2026-10-05T13:02:08Z', line: 5, observation: 'Aggregate: 14 distinct ports denied to the same address within 8 seconds.' },
      { time: '2026-10-05T13:02:09Z', line: 6, observation: 'Legacy rule allows 8443 to the same address.' },
      { time: '2026-10-05T13:47:30Z', line: 7, observation: 'Session closes after 45 minutes with about 312 MB sent outbound.' },
    ],
  },
  {
    id: 'SOC-10',
    track: 'soc',
    kind: 'log-investigation',
    title: 'East-West Scanning From a Workstation',
    difficulty: 'hard',
    cehModules: [3, 12],
    skills: ['soc-network', 'soc-lateral-movement'],
    category: 'firewall-log',
    scenario:
      'The internal segmentation firewall of the fictional Tokyo-7 Transit network logs traffic between user and server VLANs. An approved scanner also runs from its own subnet.',
    artifact: {
      label: 'internal-fw.log (synthetic)',
      language: 'log',
      lines: [
        '2026-11-12T02:00:00Z action=ALLOW src=10.20.0.5 dst=10.20.1.10 dport=443 proto=tcp asset_tag=approved-scanner change=CHG-4471',
        '2026-11-12T03:14:01Z action=RESET src=10.20.9.50 dst=10.20.1.10 dport=21 proto=tcp',
        '2026-11-12T03:14:01Z action=RESET src=10.20.9.50 dst=10.20.1.10 dport=23 proto=tcp',
        '2026-11-12T03:14:02Z action=DENY src=10.20.9.50 dst=10.20.1.10 dport=3389 proto=tcp',
        '2026-11-12T03:14:02Z action=RESET src=10.20.9.50 dst=10.20.1.11 dport=22 proto=tcp',
        '2026-11-12T03:20:10Z fw-agg src=10.20.9.50 distinct_dst_ports=1012 distinct_dst_hosts=64 window=6m asset_tag=user-workstation',
        '2026-11-12T03:21:45Z action=ALLOW src=10.20.9.50 dst=10.20.1.12 dport=445 proto=tcp rule=legacy-file-share bytes_out=88200',
        '2026-11-12T03:40:00Z action=ALLOW src=10.20.9.61 dst=10.20.1.12 dport=445 proto=tcp rule=legacy-file-share bytes_out=2048',
      ],
    },
    linePrompt:
      'Select the line that quantifies the scan and the connection that succeeded afterwards.',
    answerLines: [6, 7],
    classification: {
      prompt: 'What does the traffic from 10.20.9.50 represent?',
      options: [
        'Printer discovery broadcasts',
        'The approved vulnerability scanner running its weekly job',
        'Internal reconnaissance by port scanning from a possibly compromised host',
        'A distributed denial-of-service attack from the internet',
      ],
      answer: 'Internal reconnaissance by port scanning from a possibly compromised host',
    },
    writeups: [
      {
        key: 'indicator',
        label: 'Indicator',
        prompt: 'Which observable separates this from the approved scanner?',
        model:
          'A user workstation (10.20.9.50), not the tagged scanner at 10.20.0.5, touched 1012 ports on 64 hosts in six minutes and then opened a file-share session to 10.20.1.12.',
      },
      {
        key: 'affected-asset',
        label: 'Affected asset',
        prompt: 'Which assets are affected?',
        model:
          'The workstation 10.20.9.50 as the likely compromised source, and the server VLAN hosts it probed, especially 10.20.1.12 where a file-share session succeeded.',
      },
      {
        key: 'next-action',
        label: 'Next action',
        prompt: 'What should happen next?',
        model:
          'Isolate 10.20.9.50, review what was accessed on 10.20.1.12, confirm with the scanner owner that no scan was scheduled from that address, and tighten the legacy file-share rule.',
      },
    ],
    explanation:
      'Many ports across many hosts in minutes from a host tagged as a user workstation is reconnaissance. The approved scanner has its own subnet and change ticket, which is why asset context matters before escalating.',
    remediation:
      'Segment user VLANs from servers with deny-by-default rules, restrict file sharing to required hosts, and keep an asset inventory that tags approved scanners.',
    detection:
      'Alert when a non-scanner asset exceeds a threshold of distinct destination ports or hosts within minutes, suppressing sources tagged as approved scanners with an active change record.',
    containment:
      'Isolate 10.20.9.50, block its east-west traffic at the segmentation firewall, and preserve firewall and file-server logs for the scan window.',
    timeline: [
      { time: '2026-11-12T03:14:01Z', line: 2, observation: 'Workstation 10.20.9.50 starts connecting to many ports on server VLAN hosts.' },
      { time: '2026-11-12T03:20:10Z', line: 6, observation: 'Aggregate: 1012 ports across 64 hosts in six minutes.' },
      { time: '2026-11-12T03:21:45Z', line: 7, observation: 'File-share session to 10.20.1.12 succeeds after the scan.' },
    ],
  },
]
