// ============================================================
// CEH+ Cloud IAM / Config Review track (P5-003).
// Vendor-neutral synthetic configuration for fictional accounts
// (acct-000000-demo). Review only: nothing is applied anywhere, and no
// real account, access key, or resource is referenced.
// ============================================================
import type { TrackChallenge } from './types'

export const CLOUD_CHALLENGES: TrackChallenge[] = [
  {
    id: 'CLOUD-01',
    track: 'cloud',
    kind: 'config-review',
    title: 'CI Deployer With Identity Admin Rights',
    difficulty: 'medium',
    cehModules: [19, 6],
    skills: ['cloud-review', 'least-privilege', 'iam'],
    category: 'iam-over-permission',
    scenario:
      'NeonCorp\'s build pipeline assumes a deploy role to publish web artifacts and update one serverless function. The role grew over time as engineers fixed failed deploys.',
    artifact: {
      label: 'ci-deploy-role.json (synthetic)',
      language: 'json',
      lines: [
        `{`,
        `  "role": "neoncorp-ci-deployer",`,
        `  "account": "acct-000000-demo",`,
        `  "trust": { "principal": "ci-runner.neoncorp.internal" },`,
        `  "statements": [`,
        `    {`,
        `      "effect": "allow",`,
        `      "actions": ["storage:PutObject", "functions:UpdateCode"],`,
        `      "resources": ["neoncorp-web-artifacts/*", "function/checkout-api"]`,
        `    },`,
        `    {`,
        `      "effect": "allow",`,
        `      "actions": ["iam:*"],`,
        `      "resources": ["*"]`,
        `    }`,
        `  ]`,
        `}`,
      ],
    },
    linePrompt: 'Select the lines that grant more than the pipeline needs.',
    answerLines: [13, 14],
    classification: {
      prompt: 'What is the primary risk of this role?',
      options: [
        'Privilege escalation path via wildcard identity-management permissions',
        'Publicly readable storage bucket',
        'Missing encryption at rest',
        'Disabled audit logging',
      ],
      answer: 'Privilege escalation path via wildcard identity-management permissions',
    },
    writeups: [
      {
        key: 'risk',
        label: 'Risk',
        prompt: 'What could a compromised pipeline do with this role?',
        model:
          'With every identity-management action on every resource, a compromised build job can create new admin roles or attach admin policies, turning a CI compromise into full account takeover.',
      },
      {
        key: 'remediation',
        label: 'Remediation',
        prompt: 'How should the role be rewritten?',
        model:
          'Remove the identity-management statement, keep only the artifact upload and single function update on the named resources, and move rare identity changes to a separate human-approved role.',
      },
    ],
    explanation:
      'The first statement matches the pipeline\'s real job. The second grants all identity-management actions on all resources, which lets the holder rewrite permissions for itself and others: a classic escalation path.',
    remediation:
      'Delete the wildcard identity statement, scope remaining actions to named resources, add a permissions boundary that forbids identity administration, require short-lived credentials for the runner, and review role changes through code review.',
    leastPrivilege:
      'A CI role should hold exactly the actions its deploy steps perform on exactly the resources they touch. Identity administration is never part of a deploy, so it belongs in a separate break-glass role with approval and alerting, not in an always-on automation identity.',
  },
  {
    id: 'CLOUD-02',
    track: 'cloud',
    kind: 'config-review',
    title: 'Analytics Reader Anyone Can Assume',
    difficulty: 'hard',
    cehModules: [19],
    skills: ['cloud-review', 'least-privilege', 'iam', 'trust-policy'],
    category: 'iam-over-permission',
    scenario:
      'A partner analytics integration needs to read one export prefix. The role was created from an old template during a rushed onboarding.',
    artifact: {
      label: 'analytics-reader-role.yaml (synthetic)',
      language: 'yaml',
      lines: [
        `service_account: analytics-reader`,
        `account: acct-000000-demo`,
        `trust_policy:`,
        `  allowed_principals:`,
        `    - "*"`,
        `  require_external_id: false`,
        `permissions:`,
        `  - action: storage:GetObject`,
        `    resource: "neoncorp-analytics-exports/*"`,
        `  - action: storage:ListBuckets`,
        `    resource: "*"`,
        `  - action: secrets:GetSecretValue`,
        `    resource: "*"`,
      ],
    },
    linePrompt: 'Select the lines that define who may assume the role and the permission it should never have.',
    answerLines: [5, 12],
    classification: {
      prompt: 'Which description fits best?',
      options: [
        'Over-permissive role: wildcard trust plus unscoped secret access',
        'Unencrypted data at rest',
        'Weak password policy',
        'Missing network segmentation',
      ],
      answer: 'Over-permissive role: wildcard trust plus unscoped secret access',
    },
    writeups: [
      {
        key: 'risk',
        label: 'Risk',
        prompt: 'Explain the combined risk of the trust policy and permissions.',
        model:
          'Any principal can assume the role without an external id, and the role can read every secret in the account, so an outsider could obtain credentials for unrelated systems.',
      },
      {
        key: 'remediation',
        label: 'Remediation',
        prompt: 'What should the role look like?',
        model:
          'Trust only the partner\'s named principal with a required external id, keep read access to the single export prefix, and remove bucket listing and secret reads entirely.',
      },
    ],
    explanation:
      'Trust policies decide who can use a role; permissions decide what they can do. Here both are wildcards in the wrong places: everyone may assume it, and it can read all secrets, which the integration never needs.',
    remediation:
      'Restrict the trust policy to the partner principal with an external id condition, remove secret and listing permissions, scope reads to the export prefix, and alert on role assumption from unexpected principals.',
    leastPrivilege:
      'Least privilege applies to both sides of a role: only the specific partner identity should be able to assume it, and once assumed it should only read the one export prefix. Every extra principal or action widens the blast radius without supporting the business need.',
  },
  {
    id: 'CLOUD-03',
    track: 'cloud',
    kind: 'config-review',
    title: 'Invoice Bucket With Public Read',
    difficulty: 'easy',
    cehModules: [19],
    skills: ['cloud-review', 'public-exposure', 'storage'],
    category: 'public-exposure',
    scenario:
      'NeonCorp stores generated customer invoices in object storage. A developer enabled public access so the email service could link invoices directly.',
    artifact: {
      label: 'invoices-bucket.hcl (synthetic)',
      language: 'hcl',
      lines: [
        `resource "storage_bucket" "invoices" {`,
        `  name        = "neoncorp-invoices-bucket"`,
        `  account     = "acct-000000-demo"`,
        `  acl         = "public-read"`,
        `  versioning  = true`,
        ``,
        `  encryption {`,
        `    algorithm = "AES256"`,
        `  }`,
        ``,
        `  public_access_block {`,
        `    block_public_acls   = false`,
        `    block_public_policy = false`,
        `  }`,
        `}`,
      ],
    },
    linePrompt: 'Select the lines that make the bucket reachable anonymously.',
    answerLines: [4, 12, 13],
    classification: {
      prompt: 'Which risk does this configuration create?',
      options: [
        'Publicly readable storage exposing sensitive documents',
        'Privilege escalation through identity permissions',
        'Missing encryption at rest',
        'Excessive log retention',
      ],
      answer: 'Publicly readable storage exposing sensitive documents',
    },
    writeups: [
      {
        key: 'risk',
        label: 'Risk',
        prompt: 'What data is exposed and to whom?',
        model:
          'Every invoice object, with customer names and amounts, is readable by anyone on the internet who learns or guesses an object name, and encryption at rest does not help because reads are authorized.',
      },
      {
        key: 'remediation',
        label: 'Remediation',
        prompt: 'How should invoices be shared instead?',
        model:
          'Set the bucket private, enable the public access block settings, and deliver invoices through short-lived signed links generated by the billing service.',
      },
    ],
    explanation:
      'A public-read ACL grants anonymous read, and turning off the public access block removes the guardrail that would have overridden it. Encryption at rest is enabled, but it only protects against storage-level theft, not authorized public reads.',
    remediation:
      'Remove the public ACL, enable all public access block settings at bucket and account level, grant read only to the billing service identity, use short-lived signed links for customers, and add a policy check that blocks public buckets in CI.',
    leastPrivilege:
      'Anonymous users need no access to invoices at all. Grant read only to the billing service role that generates signed links, so each customer can reach only their own invoice for a limited time instead of the whole bucket being open to everyone.',
  },
  {
    id: 'CLOUD-04',
    track: 'cloud',
    kind: 'config-review',
    title: 'Database Tier Open to Any Source',
    difficulty: 'easy',
    cehModules: [19, 12],
    skills: ['cloud-review', 'public-exposure', 'network-policy'],
    category: 'public-exposure',
    scenario:
      'The Neon Harbor Logistics database tier has a network policy that should only allow the application subnet. Two temporary rules were added during an incident last quarter.',
    artifact: {
      label: 'db-tier-network-policy.yaml (synthetic)',
      language: 'yaml',
      lines: [
        `network_policy: neonharbor-db-tier`,
        `account: acct-000000-demo`,
        `ingress:`,
        `  - name: app-to-db`,
        `    from: 10.20.1.0/24`,
        `    port: 5432`,
        `    protocol: tcp`,
        `  - name: temp-debug`,
        `    from: any`,
        `    port: 5432`,
        `    protocol: tcp`,
        `  - name: admin-remote`,
        `    from: any`,
        `    port: 22`,
        `    protocol: tcp`,
        `egress:`,
        `  - to: any`,
        `    port: all`,
      ],
    },
    linePrompt: 'Select the lines that expose services to every source.',
    answerLines: [9, 13],
    classification: {
      prompt: 'What is the finding?',
      options: [
        'Database and remote-admin ports exposed to any source',
        'Wildcard identity-management permissions',
        'Plaintext secrets in configuration',
        'Missing object versioning',
      ],
      answer: 'Database and remote-admin ports exposed to any source',
    },
    writeups: [
      {
        key: 'risk',
        label: 'Risk',
        prompt: 'Why are the temporary rules dangerous?',
        model:
          'The database port and remote administration port accept connections from anywhere, so credential guessing and exploitation of unpatched services become possible from the internet, bypassing the application tier.',
      },
      {
        key: 'remediation',
        label: 'Remediation',
        prompt: 'What should the policy allow?',
        model:
          'Delete the temporary rules, keep database access limited to the application subnet, route admin access through a bastion or private access service, and add expiry dates to any future temporary rule.',
      },
    ],
    explanation:
      'Only the first ingress rule is needed. The temporary debug and admin rules use "any" as the source, which exposes the database and remote administration directly, and nobody removed them after the incident.',
    remediation:
      'Remove any-source ingress, restrict database access to the app subnet, use a bastion or identity-aware private access for administration, restrict egress to required destinations, and alert on rules with any-source ingress to sensitive ports.',
    leastPrivilege:
      'Network access should follow least privilege too: only the application subnet talks to the database port, and only a controlled admin path reaches remote administration. Every other source should be denied by default, and temporary exceptions need an owner and an expiry.',
  },
  {
    id: 'CLOUD-05',
    track: 'cloud',
    kind: 'config-review',
    title: 'Audit Trail That Cannot Support an Investigation',
    difficulty: 'medium',
    cehModules: [19],
    skills: ['cloud-review', 'logging', 'detection-readiness'],
    category: 'weak-logging',
    scenario:
      'Before a tabletop exercise, the Kitsune Pay security team reviews whether the organization audit trail could reconstruct a data-access incident.',
    artifact: {
      label: 'org-audit-trail.json (synthetic)',
      language: 'json',
      lines: [
        `{`,
        `  "audit_trail": "kitsune-org-trail",`,
        `  "account": "acct-000000-demo",`,
        `  "enabled": true,`,
        `  "regions": ["primary"],`,
        `  "management_events": "write-only",`,
        `  "data_events": [],`,
        `  "log_file_validation": false,`,
        `  "retention_days": 1,`,
        `  "destination": "kitsune-audit-logs",`,
        `  "alerts": []`,
        `}`,
      ],
    },
    linePrompt: 'Select the lines that prevent investigators from reconstructing data access.',
    answerLines: [7, 8, 9],
    classification: {
      prompt: 'Which weakness category applies?',
      options: [
        'Insufficient audit logging, integrity, and retention',
        'Public network exposure',
        'Over-permissive identity role',
        'Missing encryption in transit',
      ],
      answer: 'Insufficient audit logging, integrity, and retention',
    },
    writeups: [
      {
        key: 'risk',
        label: 'Risk',
        prompt: 'What would investigators be missing during an incident?',
        model:
          'Object-level reads are never recorded, logs cannot be proven untampered, and everything older than one day is gone, so a data-access incident could not be scoped or confirmed.',
      },
      {
        key: 'remediation',
        label: 'Remediation',
        prompt: 'What logging baseline should be set?',
        model:
          'Enable data events for sensitive stores, record read and write management events in all regions, turn on log file validation, keep logs for at least the retention policy period in a protected destination, and add alerts.',
      },
    ],
    explanation:
      'The trail is enabled, but it only records management writes in one region, skips data events, has no integrity validation, and keeps one day of history. Detection and forensics depend on exactly the signals that are missing.',
    remediation:
      'Log data events for sensitive stores, capture read and write management events across all regions, enable log integrity validation, extend retention to meet policy, protect the log destination from deletion, and create alerts for high-risk actions.',
    leastPrivilege:
      'Logs must be protected by least privilege as well: the logging service writes, the security team reads, and no workload or administrator can modify or delete entries. Separating these duties keeps the audit trail trustworthy even if an admin account is compromised.',
  },
  {
    id: 'CLOUD-06',
    track: 'cloud',
    kind: 'config-review',
    title: 'Customer Database Without Encryption',
    difficulty: 'easy',
    cehModules: [19, 20],
    skills: ['cloud-review', 'encryption', 'data-protection'],
    category: 'missing-encryption',
    scenario:
      'Tokyo-7 Transit keeps rider profiles in a managed database. An audit asks whether stored data and client connections are encrypted.',
    artifact: {
      label: 'customers-db.hcl (synthetic)',
      language: 'hcl',
      lines: [
        `resource "managed_database" "customers" {`,
        `  name                = "tokyo7-riders-db"`,
        `  engine              = "postgres"`,
        `  account             = "acct-000000-demo"`,
        `  storage_encrypted   = false`,
        `  kms_key             = null`,
        `  require_tls         = false`,
        `  backup_retention    = 14`,
        `  backup_copy_target  = "tokyo7-dr-backups"`,
        `  publicly_accessible = false`,
        `}`,
      ],
    },
    linePrompt: 'Select the lines that leave data unencrypted at rest or in transit.',
    answerLines: [5, 7],
    classification: {
      prompt: 'Which weakness is present?',
      options: [
        'Missing encryption at rest and in transit for sensitive data',
        'Public network exposure of the database',
        'Wildcard trust policy',
        'Insufficient audit log retention',
      ],
      answer: 'Missing encryption at rest and in transit for sensitive data',
    },
    writeups: [
      {
        key: 'risk',
        label: 'Risk',
        prompt: 'Where could rider data leak?',
        model:
          'Disk snapshots and the copied backups hold readable rider data, and connections can be made without TLS, so anyone with snapshot access or an on-path position could read profiles.',
      },
      {
        key: 'remediation',
        label: 'Remediation',
        prompt: 'How should encryption be enabled?',
        model:
          'Enable storage encryption with a managed customer key, re-encrypt existing snapshots and backup copies, require TLS for all client connections, and restrict key usage to the database service.',
      },
    ],
    explanation:
      'The database is private, but storage encryption is off, no key is configured, and TLS is optional. Backups inherit the unencrypted state, so every copy multiplies the exposure of sensitive rider data.',
    remediation:
      'Enable encryption at rest with a managed key (migrating via an encrypted snapshot restore), encrypt the backup copies, enforce TLS on connections, rotate keys on schedule, and add a policy check that rejects unencrypted databases.',
    leastPrivilege:
      'Encryption keys need their own least-privilege policy: only the database service identity should be able to use the key, while administrators who manage the database cannot decrypt snapshots or backups on their own. Separating key use from database administration limits insider and credential-theft risk.',
  },
  {
    id: 'CLOUD-07',
    track: 'cloud',
    kind: 'config-review',
    title: 'Portal Load Balancer With Weak Transport Security',
    difficulty: 'medium',
    cehModules: [19, 20],
    skills: ['cloud-review', 'encryption', 'tls'],
    category: 'missing-encryption',
    scenario:
      'The NeonCorp customer portal sits behind a managed load balancer. A legacy kiosk client was the reason for the current listener settings.',
    artifact: {
      label: 'portal-load-balancer.yaml (synthetic)',
      language: 'yaml',
      lines: [
        `load_balancer: neoncorp-portal-lb`,
        `account: acct-000000-demo`,
        `listeners:`,
        `  - port: 80`,
        `    protocol: http`,
        `    action: forward`,
        `    target: portal-app`,
        `  - port: 443`,
        `    protocol: https`,
        `    tls_policy: legacy-tls1_0-compatible`,
        `    certificate: portal.neoncorp.example`,
        `    action: forward`,
        `    target: portal-app`,
        `backend:`,
        `  target: portal-app`,
        `  protocol: http`,
        `  port: 8080`,
      ],
    },
    linePrompt: 'Select the lines that allow login traffic without strong transport encryption.',
    answerLines: [6, 10],
    classification: {
      prompt: 'Which weakness category applies?',
      options: [
        'Weak or missing encryption in transit',
        'Publicly readable storage',
        'Excessive identity permissions',
        'Disabled audit logging',
      ],
      answer: 'Weak or missing encryption in transit',
    },
    writeups: [
      {
        key: 'risk',
        label: 'Risk',
        prompt: 'What can an on-path observer do?',
        model:
          'The plain HTTP listener serves the portal instead of redirecting, and the HTTPS listener still negotiates deprecated protocol versions, so sessions and credentials can be captured or downgraded on path.',
      },
      {
        key: 'remediation',
        label: 'Remediation',
        prompt: 'What listener settings should be used?',
        model:
          'Make port 80 redirect to HTTPS only, apply a modern TLS policy (1.2 minimum), enable HSTS on the portal, and move the legacy kiosk to a supported client or an isolated endpoint.',
      },
    ],
    explanation:
      'Forwarding plain HTTP to the app means users can authenticate without encryption, and a legacy TLS policy keeps protocol versions with known weaknesses enabled for every client, not just the kiosk.',
    remediation:
      'Redirect all HTTP to HTTPS, apply a TLS 1.2+ policy, enable HSTS, consider encrypting load-balancer-to-backend traffic, restrict who can change listener policies, and monitor for listeners with weak policies.',
    leastPrivilege:
      'Expose only what clients actually need: a single HTTPS listener with modern protocol versions. Least privilege also applies to configuration rights, so only the platform team should be able to change listener and TLS policies, preventing ad hoc downgrades for one legacy client.',
  },
  {
    id: 'CLOUD-08',
    track: 'cloud',
    kind: 'config-review',
    title: 'Plaintext Secrets in Function Environment',
    difficulty: 'medium',
    cehModules: [19],
    skills: ['cloud-review', 'secret-handling', 'least-privilege'],
    category: 'secret-handling',
    scenario:
      'A NeonCorp invoice worker function connects to a database and a payment gateway. The deployment template was copied from a local development setup.',
    artifact: {
      label: 'invoice-worker-function.yaml (synthetic)',
      language: 'yaml',
      lines: [
        `function: neoncorp-invoice-worker`,
        `account: acct-000000-demo`,
        `runtime: node20`,
        `environment:`,
        `  DB_HOST: db01.corp.internal`,
        `  DB_USER: invoice_app`,
        `  DB_PASSWORD: "<plaintext-demo-value>"`,
        `  PAYMENT_API_KEY: "<plaintext-demo-value>"`,
        `  LOG_LEVEL: debug`,
        `permissions:`,
        `  - action: secrets:GetSecretValue`,
        `    resource: "*"`,
        `logging:`,
        `  log_environment_on_start: true`,
      ],
    },
    linePrompt: 'Select the lines where secrets are stored or exposed in plaintext.',
    answerLines: [7, 8, 14],
    classification: {
      prompt: 'Which finding best describes the configuration?',
      options: [
        'Plaintext secrets in deployment configuration exposed through logs',
        'Public storage exposure',
        'Missing encryption at rest for the database',
        'Overly broad network ingress',
      ],
      answer: 'Plaintext secrets in deployment configuration exposed through logs',
    },
    writeups: [
      {
        key: 'risk',
        label: 'Risk',
        prompt: 'Where do these secret values end up?',
        model:
          'The values sit in plaintext in the template, the function configuration, and every startup log line, so anyone with template, console, or log access can reuse the database and payment credentials.',
      },
      {
        key: 'remediation',
        label: 'Remediation',
        prompt: 'How should the worker obtain its secrets?',
        model:
          'Store the credentials in a secrets manager, grant the function read access to only its two named secrets, fetch them at runtime, stop logging the environment, and rotate both values.',
      },
    ],
    explanation:
      'Environment variables in a deployment template are configuration, not secret storage. Logging the environment on start copies the values into the log pipeline, and the wildcard secret permission would let the function read unrelated secrets too.',
    remediation:
      'Move credentials into a secrets manager referenced by name, scope the secret-read permission to the two required secrets, disable environment logging, rotate the exposed fictional values, and add secret scanning to template reviews.',
    leastPrivilege:
      'The worker should be able to read exactly two secrets, its database credential and its gateway key, and nothing else. A wildcard secret-read permission means one compromised function exposes every secret in the account, so scope reads to named secret identifiers.',
  },
]
