// ============================================================
// CEH+ Incident Response Timeline / Report track (P5-005).
// A fictional incident reconstructed from synthetic artifacts. Accounts,
// hosts, and organizations are invented; addresses use documentation or
// private IP ranges and safe training domains only.
// ============================================================
import type { IncidentScenario } from './types'

export const INCIDENTS: IncidentScenario[] = [
  {
    id: 'IR-01',
    title: 'RecordVault Night Export: MFA-less Account Takeover',
    organization: 'NeonCorp (fictional) — RecordVault customer records app',
    summary:
      'Overnight, a data-loss alert fired on the fictional RecordVault app after a large customer-records export. Reconstruct what happened from the synthetic authentication log, application audit log, DLP alert, and helpdesk ticket, then write the incident report covering containment, eradication, recovery, and lessons learned.',
    relatedSocChallenges: ['SOC-01', 'SOC-02'],
    artifacts: [
      {
        id: 'auth-log',
        label: 'recordvault-auth.log (synthetic)',
        kind: 'log',
        lines: [
          '2026-05-19T02:40:11Z user=bob   src=203.0.113.77 result=FAIL reason=bad_password',
          '2026-05-19T02:40:14Z user=carol src=203.0.113.77 result=FAIL reason=bad_password',
          '2026-05-19T02:40:19Z user=dave  src=203.0.113.77 result=FAIL reason=bad_password',
          '2026-05-19T02:41:02Z summary src=203.0.113.77 failures=417 distinct_users=60 window=9m',
          '2026-05-19T02:49:58Z user=erin  src=203.0.113.77 result=SUCCESS mfa=no',
          '2026-05-19T02:50:05Z user=erin  src=203.0.113.77 session=s-erin-8812 created',
          '2026-05-19T08:41:30Z user=erin  action=account_disabled by=it-admin-kei',
        ],
      },
      {
        id: 'app-audit',
        label: 'recordvault-audit.log (synthetic)',
        kind: 'log',
        lines: [
          '2026-05-19T02:50:31Z session=s-erin-8812 user=erin action=search scope=all_customers',
          '2026-05-19T02:51:12Z session=s-erin-8812 user=erin action=export_all_records rows=12000 format=csv',
          '2026-05-19T02:51:40Z session=s-erin-8812 user=erin action=download file=export-0519 size=38MB',
          '2026-05-19T02:53:02Z session=s-erin-8812 user=erin action=create_api_token name=sync-helper',
          '2026-05-19T03:10:44Z auth=api-token(sync-helper) user=erin action=export_all_records rows=12000 format=csv',
          '2026-05-19T09:05:12Z user=it-admin-kei action=revoke_api_token name=sync-helper',
          '2026-05-19T09:06:40Z user=it-admin-kei action=terminate_sessions user=erin count=1',
        ],
      },
      {
        id: 'dlp-alert',
        label: 'dlp-alert.txt (synthetic)',
        kind: 'alert',
        lines: [
          'alert_id=DLP-2026-0519-004 severity=high status=new',
          '2026-05-19T02:52:10Z rule=bulk-customer-export app=RecordVault user=erin rows=12000',
          'destination=203.0.113.77 (not a managed NeonCorp address)',
          'classification=customer-pii (names, postal addresses, phone numbers; no payment data)',
          '2026-05-19T07:58:03Z alert acknowledged by soc-analyst-yui',
        ],
      },
      {
        id: 'ticket',
        label: 'helpdesk-ticket.txt (synthetic)',
        kind: 'ticket',
        lines: [
          'ticket=HD-7741 reporter=erin priority=P2',
          '2026-05-19T08:15:22Z erin reports she did not sign in overnight and sees an unknown API token in her profile',
          '2026-05-19T08:22:47Z helpdesk escalates HD-7741 to SOC and links DLP-2026-0519-004',
          '2026-05-19T08:55:09Z password reset completed for erin; MFA enrollment enforced',
          '2026-05-19T10:30:00Z tenant policy changed: MFA required for all RecordVault users',
          '2026-05-19T11:02:18Z source 203.0.113.77 blocked at the edge firewall and identity provider',
        ],
      },
    ],
    modelTimeline: [
      {
        time: '2026-05-19T02:40:11Z',
        source: 'recordvault-auth.log',
        observation: 'Password-spray activity begins: 203.0.113.77 fails against many different usernames.',
        confidence: 'high',
        artifactId: 'auth-log',
        line: 1,
      },
      {
        time: '2026-05-19T02:49:58Z',
        source: 'recordvault-auth.log',
        observation: 'Initial access: the spraying source signs in as erin, whose account had no MFA.',
        confidence: 'high',
        artifactId: 'auth-log',
        line: 5,
      },
      {
        time: '2026-05-19T02:51:12Z',
        source: 'recordvault-audit.log',
        observation: 'Collection: the hijacked session exports all 12000 customer records.',
        confidence: 'high',
        artifactId: 'app-audit',
        line: 2,
      },
      {
        time: '2026-05-19T02:52:10Z',
        source: 'dlp-alert.txt',
        observation: 'DLP bulk-export rule fires; the destination is the attacking, unmanaged address.',
        confidence: 'high',
        artifactId: 'dlp-alert',
        line: 2,
      },
      {
        time: '2026-05-19T02:53:02Z',
        source: 'recordvault-audit.log',
        observation: 'Persistence: an API token named sync-helper is created from the hijacked session.',
        confidence: 'medium',
        artifactId: 'app-audit',
        line: 4,
      },
      {
        time: '2026-05-19T03:10:44Z',
        source: 'recordvault-audit.log',
        observation: 'The new token repeats the full export, confirming the token was used by the attacker.',
        confidence: 'medium',
        artifactId: 'app-audit',
        line: 5,
      },
      {
        time: '2026-05-19T07:58:03Z',
        source: 'dlp-alert.txt',
        observation: 'Detection gap closes: the SOC acknowledges the DLP alert about five hours after it fired.',
        confidence: 'high',
        artifactId: 'dlp-alert',
        line: 5,
      },
      {
        time: '2026-05-19T08:15:22Z',
        source: 'helpdesk-ticket.txt',
        observation: 'The user reports sign-ins she did not make and an unknown API token.',
        confidence: 'high',
        artifactId: 'ticket',
        line: 2,
      },
      {
        time: '2026-05-19T08:41:30Z',
        source: 'recordvault-auth.log',
        observation: 'Containment starts: the compromised account is disabled.',
        confidence: 'high',
        artifactId: 'auth-log',
        line: 7,
      },
      {
        time: '2026-05-19T09:05:12Z',
        source: 'recordvault-audit.log',
        observation: 'Eradication: the attacker-created API token is revoked, followed by session termination.',
        confidence: 'high',
        artifactId: 'app-audit',
        line: 6,
      },
    ],
    modelReport: {
      summary:
        'On 2026-05-19 an external source compromised the RecordVault account of employee erin through password spraying, because that account did not have MFA. The attacker exported the full customer record set twice, once through the session and once through an API token it created, before the account was disabled about six hours later.',
      impact:
        'Twelve thousand customer records containing names, postal addresses, and phone numbers were exported to an unmanaged address; no payment data was included. The incident triggers the fictional privacy-notification process and a customer communication review.',
      containment:
        'The account was disabled, the attacker-created API token was revoked, active sessions were terminated, and the source address was blocked at the edge firewall and identity provider. Evidence (authentication, audit, and DLP logs) was preserved before changes were made.',
      eradication:
        'The password was reset, MFA enrollment was enforced for the account, and all API tokens created during the incident window were reviewed and removed. No other accounts showed successful sign-ins from the spraying source.',
      recovery:
        'The user regained access with MFA after identity verification, RecordVault export activity was monitored for 14 days, and the tenant now requires MFA for every user. Customer notification followed the fictional legal team guidance.',
      lessonsLearned:
        'MFA was optional, spray detection did not alert, and a high-severity DLP alert waited five hours for acknowledgement. Actions: mandatory MFA, one-source-to-many-users failure alerts, paging for high DLP alerts, and approval plus alerting for bulk exports and new API tokens.',
    },
  },
]
