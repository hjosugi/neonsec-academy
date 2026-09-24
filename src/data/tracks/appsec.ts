// ============================================================
// CEH+ AppSec Code Review track (P5-002).
// Toy snippets from fictional services. Static review only: the learner
// selects the vulnerable lines, names the class, and writes impact + fix.
// No payloads, no live targets, and placeholder-only secret values.
// ============================================================
import type { TrackChallenge } from './types'

export const APPSEC_CHALLENGES: TrackChallenge[] = [
  {
    id: 'APPSEC-01',
    track: 'appsec',
    kind: 'code-review',
    title: 'Invoice Lookup Without Ownership Check',
    difficulty: 'easy',
    cehModules: [14],
    skills: ['code-review', 'authz', 'idor'],
    category: 'authz',
    scenario:
      'NeonCorp billing exposes an invoice API to logged-in customers. A reviewer notices the handler loads invoices purely by the identifier in the URL.',
    artifact: {
      label: 'invoices.routes.ts (toy)',
      language: 'ts',
      lines: [
        `import { Router } from 'express'`,
        `import { invoices } from './store'`,
        `import { requireLogin } from './auth'`,
        ``,
        `export const router = Router()`,
        ``,
        `// GET /api/invoices/:id — any logged-in customer may call this`,
        `router.get('/api/invoices/:id', requireLogin, async (req, res) => {`,
        `  const invoice = await invoices.findById(req.params.id)`,
        `  if (!invoice) {`,
        `    return res.status(404).json({ error: 'not found' })`,
        `  }`,
        `  return res.json(invoice)`,
        `})`,
      ],
    },
    linePrompt: 'Select the line where the invoice is loaded without checking who owns it.',
    answerLines: [9],
    classification: {
      prompt: 'Which vulnerability class does this handler demonstrate?',
      options: [
        'Insecure direct object reference (broken object-level authorization)',
        'Cross-site request forgery',
        'SQL injection',
        'Server-side request forgery',
      ],
      answer: 'Insecure direct object reference (broken object-level authorization)',
    },
    writeups: [
      {
        key: 'impact',
        label: 'Impact',
        prompt: 'What can a logged-in customer do with this flaw?',
        model:
          'Any authenticated customer can read other customers\' invoices, including billing names and totals, simply by changing the identifier in the URL.',
      },
      {
        key: 'fix',
        label: 'Fix',
        prompt: 'Describe the secure change to the handler.',
        model:
          'Scope the lookup to the authenticated user on the server (owner id taken from the session, never from the request) and return 404 when the invoice is not owned by the caller.',
      },
    ],
    explanation:
      'Authentication proves who the caller is, but the handler never checks that the requested invoice belongs to that caller. The object identifier alone decides access, which is the root cause of an insecure direct object reference.',
    remediation:
      'Enforce object-level authorization on every read by querying with both the invoice id and the session owner id, keep identifiers unguessable only as defense in depth, and add negative authorization tests for cross-user access.',
    safeFix: [
      `router.get('/api/invoices/:id', requireLogin, async (req, res) => {`,
      `  const invoice = await invoices.findOne({ id: req.params.id, ownerId: req.user.id })`,
      `  if (!invoice) {`,
      `    return res.status(404).json({ error: 'not found' })`,
      `  }`,
      `  return res.json(invoice)`,
      `})`,
    ],
    testIdea:
      'Seed two fictional users, store an invoice owned by user A, request it with user B\'s session, and assert a 404 with no invoice fields in the body; then assert user A still receives the invoice with status 200.',
  },
  {
    id: 'APPSEC-02',
    track: 'appsec',
    kind: 'code-review',
    title: 'Admin Delete Trusts a Client Cookie',
    difficulty: 'medium',
    cehModules: [14],
    skills: ['code-review', 'authz', 'access-control'],
    category: 'authz',
    scenario:
      'An internal admin panel for Tokyo-7 Transit lets administrators delete user accounts. The role check was added quickly during a release freeze.',
    artifact: {
      label: 'admin_views.py (toy)',
      language: 'py',
      lines: [
        `from flask import Blueprint, request, abort`,
        `from .models import User, db`,
        `from .auth import login_required`,
        ``,
        `admin = Blueprint("admin", __name__)`,
        ``,
        `@admin.route("/admin/users/<int:user_id>", methods=["DELETE"])`,
        `@login_required`,
        `def delete_user(user_id):`,
        `    if request.cookies.get("role") != "admin":`,
        `        abort(403)`,
        `    user = User.query.get_or_404(user_id)`,
        `    db.session.delete(user)`,
        `    db.session.commit()`,
        `    return {"deleted": user_id}`,
      ],
    },
    linePrompt: 'Select the line that makes the authorization decision from attacker-controllable input.',
    answerLines: [10],
    classification: {
      prompt: 'Which weakness best describes the role check?',
      options: [
        'Authorization decision based on client-controlled data (broken function-level access control)',
        'Session fixation',
        'Open redirect',
        'Insecure deserialization',
      ],
      answer: 'Authorization decision based on client-controlled data (broken function-level access control)',
    },
    writeups: [
      {
        key: 'impact',
        label: 'Impact',
        prompt: 'What is the business impact of this check?',
        model:
          'Any logged-in user can set their own role cookie and delete arbitrary accounts, causing account loss and service disruption for the fictional transit users.',
      },
      {
        key: 'fix',
        label: 'Fix',
        prompt: 'How should the role be verified?',
        model:
          'Read the role from the server-side user record bound to the authenticated session (or a signed, server-issued claim) and deny by default when the role is not admin.',
      },
    ],
    explanation:
      'Cookies are fully controlled by the browser. Using a plain cookie value as the source of truth for the admin role lets the client grant itself privileges; the server must derive roles from its own records.',
    remediation:
      'Move role checks to a reusable server-side decorator that loads the current user from the session store, deny by default, log denied admin attempts, and cover the endpoint with tests for non-admin callers.',
    safeFix: [
      `from flask_login import current_user`,
      ``,
      `@admin.route("/admin/users/<int:user_id>", methods=["DELETE"])`,
      `@login_required`,
      `def delete_user(user_id):`,
      `    if current_user.role != "admin":`,
      `        abort(403)`,
      `    user = User.query.get_or_404(user_id)`,
      `    db.session.delete(user)`,
      `    db.session.commit()`,
      `    return {"deleted": user_id}`,
    ],
    testIdea:
      'Log in as a fictional non-admin user, add a role cookie with the value admin, send the DELETE request, and assert 403 plus that the target user still exists; repeat with a real admin account and assert the delete succeeds.',
  },
  {
    id: 'APPSEC-03',
    track: 'appsec',
    kind: 'code-review',
    title: 'Order Search Built With String Concatenation',
    difficulty: 'easy',
    cehModules: [15, 14],
    skills: ['code-review', 'input-validation', 'sql-injection'],
    category: 'input-validation',
    scenario:
      'Neon Harbor Logistics lets customers filter their shipping orders by status. The data-access method below builds its query from the request values.',
    artifact: {
      label: 'OrderRepository.java (toy)',
      language: 'java',
      lines: [
        `public List<Order> searchOrders(String customerId, String status) throws SQLException {`,
        `    String sql = "SELECT id, total, status FROM orders WHERE customer_id = '"`,
        `        + customerId + "' AND status = '" + status + "'";`,
        `    try (Statement stmt = connection.createStatement();`,
        `         ResultSet rs = stmt.executeQuery(sql)) {`,
        `        List<Order> results = new ArrayList<>();`,
        `        while (rs.next()) {`,
        `            results.add(Order.fromRow(rs));`,
        `        }`,
        `        return results;`,
        `    }`,
        `}`,
      ],
    },
    linePrompt: 'Select the lines where untrusted values become part of the SQL text.',
    answerLines: [2, 3],
    classification: {
      prompt: 'Which vulnerability class is present?',
      options: [
        'SQL injection via string-concatenated query',
        'Cross-site scripting',
        'XML external entity processing',
        'Race condition',
      ],
      answer: 'SQL injection via string-concatenated query',
    },
    writeups: [
      {
        key: 'impact',
        label: 'Impact',
        prompt: 'What could go wrong if the status filter is manipulated?',
        model:
          'Request values are interpreted as SQL, so a caller could change the query logic to read orders belonging to other customers or tamper with data, depending on database privileges.',
      },
      {
        key: 'fix',
        label: 'Fix',
        prompt: 'How do you make the query safe?',
        model:
          'Use a prepared statement with bound parameters for customer id and status, and additionally validate status against the fixed set of allowed values.',
      },
    ],
    explanation:
      'The query mixes code and data by concatenating request values into the SQL string. The database cannot tell where the intended value ends, so input can change the structure of the query.',
    remediation:
      'Replace concatenation with parameterized queries everywhere, validate enumerated fields against an allowlist, run the application with a least-privilege database account, and add a static-analysis rule that flags string-built SQL.',
    safeFix: [
      `public List<Order> searchOrders(String customerId, String status) throws SQLException {`,
      `    if (!ALLOWED_STATUSES.contains(status)) {`,
      `        throw new IllegalArgumentException("unsupported status");`,
      `    }`,
      `    String sql = "SELECT id, total, status FROM orders WHERE customer_id = ? AND status = ?";`,
      `    try (PreparedStatement stmt = connection.prepareStatement(sql)) {`,
      `        stmt.setString(1, customerId);`,
      `        stmt.setString(2, status);`,
      `        try (ResultSet rs = stmt.executeQuery()) {`,
      `            List<Order> results = new ArrayList<>();`,
      `            while (rs.next()) {`,
      `                results.add(Order.fromRow(rs));`,
      `            }`,
      `            return results;`,
      `        }`,
      `    }`,
      `}`,
    ],
    testIdea:
      'Call searchOrders with a customer name containing an apostrophe and assert it returns an empty list without a SQL syntax error; with a mocked connection, assert prepareStatement is used and both values are bound as parameters, and that an unknown status is rejected.',
  },
  {
    id: 'APPSEC-04',
    track: 'appsec',
    kind: 'code-review',
    title: 'Report Download Path From Query String',
    difficulty: 'medium',
    cehModules: [13, 14],
    skills: ['code-review', 'input-validation', 'path-traversal'],
    category: 'input-validation',
    scenario:
      'A NeonCorp reporting service serves generated PDF reports from a fixed directory. The file name comes straight from the query string.',
    artifact: {
      label: 'download.go (toy)',
      language: 'go',
      lines: [
        `func downloadReport(w http.ResponseWriter, r *http.Request) {`,
        `    name := r.URL.Query().Get("file")`,
        `    if name == "" {`,
        `        http.Error(w, "missing file", http.StatusBadRequest)`,
        `        return`,
        `    }`,
        `    fullPath := filepath.Join("/srv/neoncorp/reports", name)`,
        `    data, err := os.ReadFile(fullPath)`,
        `    if err != nil {`,
        `        http.Error(w, "not found", http.StatusNotFound)`,
        `        return`,
        `    }`,
        `    w.Header().Set("Content-Type", "application/pdf")`,
        `    w.Write(data)`,
        `}`,
      ],
    },
    linePrompt: 'Select the line where user input decides which file on disk is read.',
    answerLines: [7],
    classification: {
      prompt: 'Which weakness is present?',
      options: [
        'Path traversal (improper limitation of a pathname to a restricted directory)',
        'Server-side request forgery',
        'OS command injection',
        'Cross-site request forgery',
      ],
      answer: 'Path traversal (improper limitation of a pathname to a restricted directory)',
    },
    writeups: [
      {
        key: 'impact',
        label: 'Impact',
        prompt: 'What could a caller read?',
        model:
          'Joining a caller-supplied name with parent-directory segments can resolve outside the reports directory, exposing configuration files or other readable files on the fictional server.',
      },
      {
        key: 'fix',
        label: 'Fix',
        prompt: 'How should the handler choose the file?',
        model:
          'Accept only a bare file name that matches an allowlist of generated reports (or map report ids to paths server-side) and reject anything containing separators or parent segments.',
      },
    ],
    explanation:
      'Path joining normalizes the result but does not confine it to the base directory, so relative segments in the request can walk out of the intended folder. The handler trusts the name instead of mapping it to a known file.',
    remediation:
      'Map report identifiers to server-side paths, or strip to the base name and verify it against an allowlist, confirm the resolved path stays under the base directory, and run the service with read access limited to the reports folder.',
    safeFix: [
      `func downloadReport(w http.ResponseWriter, r *http.Request) {`,
      `    requested := r.URL.Query().Get("file")`,
      `    name := filepath.Base(requested)`,
      `    if requested == "" || name != requested || !allowedReports[name] {`,
      `        http.Error(w, "invalid file", http.StatusBadRequest)`,
      `        return`,
      `    }`,
      `    fullPath := filepath.Join("/srv/neoncorp/reports", name)`,
      `    data, err := os.ReadFile(fullPath)`,
      `    if err != nil {`,
      `        http.Error(w, "not found", http.StatusNotFound)`,
      `        return`,
      `    }`,
      `    w.Header().Set("Content-Type", "application/pdf")`,
      `    w.Write(data)`,
      `}`,
    ],
    testIdea:
      'Table-test the handler against a temp reports folder: an allowlisted name returns 200, while names containing parent-directory segments or path separators return 400; place a sentinel file outside the folder and assert its contents never appear in any response.',
  },
  {
    id: 'APPSEC-05',
    track: 'appsec',
    kind: 'code-review',
    title: 'Session Signing Key Committed to Source',
    difficulty: 'easy',
    cehModules: [20, 14],
    skills: ['code-review', 'secrets-handling', 'session-management'],
    category: 'secrets-handling',
    scenario:
      'Kitsune Pay issues signed session tokens from a small auth module. The same module ships to every environment from the shared repository.',
    artifact: {
      label: 'session.ts (toy)',
      language: 'ts',
      lines: [
        `import jwt from 'jsonwebtoken'`,
        ``,
        `// Shared by every environment, committed with the service source`,
        `const JWT_SIGNING_KEY = '<hardcoded-demo-signing-key>'`,
        ``,
        `export function issueSession(userId: string, roles: string[]) {`,
        `  return jwt.sign({ sub: userId, roles }, JWT_SIGNING_KEY, {`,
        `    algorithm: 'HS256',`,
        `    expiresIn: '30d',`,
        `  })`,
        `}`,
        ``,
        `export function verifySession(bearer: string) {`,
        `  return jwt.verify(bearer, JWT_SIGNING_KEY)`,
        `}`,
      ],
    },
    linePrompt: 'Select the line that exposes the signing material.',
    answerLines: [4],
    classification: {
      prompt: 'Which weakness is the primary finding?',
      options: [
        'Hard-coded cryptographic key in source code',
        'Weak password hashing algorithm',
        'Missing rate limiting',
        'Cross-site scripting',
      ],
      answer: 'Hard-coded cryptographic key in source code',
    },
    writeups: [
      {
        key: 'impact',
        label: 'Impact',
        prompt: 'Who could abuse this key and how?',
        model:
          'Anyone with repository or build-artifact access can sign their own session tokens with arbitrary roles, impersonating any user in every environment that shares the key.',
      },
      {
        key: 'fix',
        label: 'Fix',
        prompt: 'How should the key be handled?',
        model:
          'Rotate the key, load a per-environment key from a secrets manager at startup, fail closed if it is missing, pin the verification algorithm, and purge the old value from history.',
      },
    ],
    explanation:
      'Signing keys are secrets: whoever holds the key can mint valid tokens. Committing it to source spreads it to every clone, fork, and build log, and sharing it across environments means a leak in one place compromises all of them.',
    remediation:
      'Rotate the fictional key immediately, remove it from repository history, load environment-specific keys from a secrets manager, restrict verification to the expected algorithm, shorten session lifetime, and enable secret scanning in CI.',
    safeFix: [
      `import jwt from 'jsonwebtoken'`,
      ``,
      `const JWT_SIGNING_KEY = process.env.JWT_SIGNING_KEY`,
      `if (!JWT_SIGNING_KEY) {`,
      `  throw new Error('JWT_SIGNING_KEY is not configured')`,
      `}`,
      ``,
      `export function issueSession(userId: string, roles: string[]) {`,
      `  return jwt.sign({ sub: userId, roles }, JWT_SIGNING_KEY, { algorithm: 'HS256', expiresIn: '1h' })`,
      `}`,
      ``,
      `export function verifySession(bearer: string) {`,
      `  return jwt.verify(bearer, JWT_SIGNING_KEY, { algorithms: ['HS256'] })`,
      `}`,
    ],
    testIdea:
      'Assert that importing the module without the signing-key environment variable throws, and that a session signed with a different test key fails verification; add a CI secret-scanning job that fails on committed key material.',
  },
  {
    id: 'APPSEC-06',
    track: 'appsec',
    kind: 'code-review',
    title: 'Payment Key and Headers Written to Logs',
    difficulty: 'medium',
    cehModules: [14],
    skills: ['code-review', 'secrets-handling', 'logging'],
    category: 'secrets-handling',
    scenario:
      'The Kitsune Pay checkout worker calls a fictional payment gateway. Support engineers asked for more verbose logs to debug failed charges.',
    artifact: {
      label: 'charge.py (toy)',
      language: 'py',
      lines: [
        `import logging`,
        `import os`,
        ``,
        `log = logging.getLogger("payments")`,
        `PAYMENT_KEY = os.environ["KITSUNE_PAY_KEY"]`,
        ``,
        `def charge(order, request):`,
        `    log.warning("charge start headers=%s", dict(request.headers))`,
        `    client = PaymentClient(api_base="https://pay.kitsune.example", credential=PAYMENT_KEY)`,
        `    try:`,
        `        return client.charge(order.id, order.total)`,
        `    except PaymentError as exc:`,
        `        log.error("charge failed key=%s order=%s err=%s", PAYMENT_KEY, order.id, exc)`,
        `        raise`,
      ],
    },
    linePrompt: 'Select the lines that write sensitive values to the log stream.',
    answerLines: [8, 13],
    classification: {
      prompt: 'Which weakness is present?',
      options: [
        'Insertion of sensitive information (credentials) into log files',
        'Server-side request forgery',
        'Use of insufficiently random values',
        'Open redirect',
      ],
      answer: 'Insertion of sensitive information (credentials) into log files',
    },
    writeups: [
      {
        key: 'impact',
        label: 'Impact',
        prompt: 'Who gains access to the secrets through these logs?',
        model:
          'Anyone who can read the log pipeline, dashboards, or log backups obtains the payment gateway key and customer session headers, enabling fraudulent charges and session reuse.',
      },
      {
        key: 'fix',
        label: 'Fix',
        prompt: 'How should the logging change?',
        model:
          'Log only non-sensitive identifiers such as the order id and error type, add a redaction filter for authorization and cookie headers, and rotate the key because it has already been logged.',
      },
    ],
    explanation:
      'Logs are copied widely and retained long, so they must never contain credentials. Dumping all request headers captures authorization and cookie values, and the error path prints the gateway key itself.',
    remediation:
      'Remove secret values from log statements, install a central redaction filter for known sensitive fields, restrict log access, purge affected log data according to retention policy, and rotate the exposed fictional gateway key.',
    safeFix: [
      `def charge(order, request):`,
      `    log.warning("charge start order=%s", order.id)`,
      `    client = PaymentClient(api_base="https://pay.kitsune.example", credential=PAYMENT_KEY)`,
      `    try:`,
      `        return client.charge(order.id, order.total)`,
      `    except PaymentError as exc:`,
      `        log.error("charge failed order=%s err_type=%s", order.id, type(exc).__name__)`,
      `        raise`,
    ],
    testIdea:
      'Use a log-capture fixture, run a failing charge with a fake client, a dummy key value, and a request carrying a dummy authorization header, then assert the captured log text contains neither dummy value.',
  },
  {
    id: 'APPSEC-07',
    track: 'appsec',
    kind: 'code-review',
    title: 'Profile API Returns Raw Error Details',
    difficulty: 'easy',
    cehModules: [13, 14],
    skills: ['code-review', 'error-handling', 'information-disclosure'],
    category: 'error-handling',
    scenario:
      'A NeonCorp profile API returns detailed error objects so the frontend team can debug faster. The same build runs in production.',
    artifact: {
      label: 'profile-route.js (toy)',
      language: 'js',
      lines: [
        `app.get('/api/profile/:id', requireLogin, async (req, res) => {`,
        `  try {`,
        `    const profile = await db.query('SELECT * FROM profiles WHERE id = $1', [req.params.id])`,
        `    res.json(profile.rows[0])`,
        `  } catch (err) {`,
        `    res.status(500).json({`,
        `      error: err.message,`,
        `      stack: err.stack,`,
        `      dbHost: process.env.DB_HOST,`,
        `    })`,
        `  }`,
        `})`,
      ],
    },
    linePrompt: 'Select the lines that disclose internal details to the client.',
    answerLines: [7, 8, 9],
    classification: {
      prompt: 'Which weakness is the finding?',
      options: [
        'Information exposure through error messages',
        'SQL injection',
        'Cross-site request forgery',
        'Regular expression denial of service',
      ],
      answer: 'Information exposure through error messages',
    },
    writeups: [
      {
        key: 'impact',
        label: 'Impact',
        prompt: 'Why does this matter if the query itself is parameterized?',
        model:
          'Stack traces, raw database messages, and internal host names reveal frameworks, file paths, schema, and infrastructure, which makes targeted attacks easier and may leak data from error text.',
      },
      {
        key: 'fix',
        label: 'Fix',
        prompt: 'What should the error path return instead?',
        model:
          'Return a generic message with a correlation id to the client and write the full error details only to the protected server log.',
      },
    ],
    explanation:
      'The query is parameterized, so injection is not the issue; the problem is the catch block, which forwards internal exception details and environment data straight to any caller.',
    remediation:
      'Centralize error handling so production responses contain only a generic message and incident id, log details server-side with access controls, and review other handlers for the same pattern.',
    safeFix: [
      `  } catch (err) {`,
      `    const incidentId = crypto.randomUUID()`,
      `    logger.error({ incidentId, err }, 'profile lookup failed')`,
      `    res.status(500).json({ error: 'internal error', incidentId })`,
      `  }`,
    ],
    testIdea:
      'Stub the database call to throw an error containing a fake stack and host name, call the route, and assert the 500 body contains only the generic message and incident id while the stub details appear in the captured server log.',
  },
  {
    id: 'APPSEC-08',
    track: 'appsec',
    kind: 'code-review',
    title: 'Refund Approval Fails Open',
    difficulty: 'medium',
    cehModules: [14, 5],
    skills: ['code-review', 'error-handling', 'authz'],
    category: 'error-handling',
    scenario:
      'Neon Harbor Logistics checks a central policy service before support staff can approve refunds. During a policy-service outage, refunds kept flowing.',
    artifact: {
      label: 'RefundPolicy.java (toy)',
      language: 'java',
      lines: [
        `public boolean canApproveRefund(User user, Refund refund) {`,
        `    try {`,
        `        Policy policy = policyClient.fetchPolicy(refund.getTenantId());`,
        `        return policy.allows(user.getRole(), "refund:approve")`,
        `            && refund.getAmount() <= policy.getApprovalLimit();`,
        `    } catch (PolicyServiceException e) {`,
        `        log.warn("policy service unavailable, allowing request", e);`,
        `        return true;`,
        `    }`,
        `}`,
      ],
    },
    linePrompt: 'Select the lines where an error changes the authorization outcome.',
    answerLines: [7, 8],
    classification: {
      prompt: 'Which weakness best describes this behavior?',
      options: [
        'Fail-open error handling in an authorization check',
        'Integer overflow',
        'Insecure deserialization',
        'Time-of-check to time-of-use race condition',
      ],
      answer: 'Fail-open error handling in an authorization check',
    },
    writeups: [
      {
        key: 'impact',
        label: 'Impact',
        prompt: 'What happens during a policy outage?',
        model:
          'Every refund request is approved regardless of role or amount limit, so any staff member (or anyone who can trigger the outage) can push unlimited refunds.',
      },
      {
        key: 'fix',
        label: 'Fix',
        prompt: 'How should the exception be handled?',
        model:
          'Fail closed by returning false on errors, surface a retryable error to the user, and alert operations when the policy service is unavailable.',
      },
    ],
    explanation:
      'Security decisions must default to deny. The catch block converts an infrastructure failure into an approval, so availability problems silently become authorization bypasses.',
    remediation:
      'Return deny on any exception, add monitoring and alerting for policy-service failures, consider a cached last-known-good policy with strict expiry, and test the outage path explicitly.',
    safeFix: [
      `    } catch (PolicyServiceException e) {`,
      `        log.warn("policy service unavailable, denying refund approval", e);`,
      `        metrics.increment("authz_policy_unavailable");`,
      `        return false;`,
      `    }`,
    ],
    testIdea:
      'Mock the policy client to throw the service exception and assert canApproveRefund returns false; add a second test where the policy allows the role and amount to prove the approval path still returns true.',
  },
  {
    id: 'APPSEC-09',
    track: 'appsec',
    kind: 'code-review',
    title: 'Config Loader Pinned to an Advisory Version',
    difficulty: 'medium',
    cehModules: [5, 14],
    skills: ['code-review', 'dependency-risk', 'supply-chain'],
    category: 'dependency-risk',
    scenario:
      'The NeonCorp config service previews YAML documents uploaded by operators. The fictional NeonSec advisory feed flagged one of its dependencies last month.',
    artifact: {
      label: 'package.json + config-loader.js (toy excerpt)',
      language: 'json',
      lines: [
        `// package.json (excerpt)`,
        `{`,
        `  "name": "neoncorp-config-service",`,
        `  "dependencies": {`,
        `    "neon-http-router": "^4.2.0",`,
        `    "neon-yaml-parse": "1.4.2",`,
        `    "neon-logger": "^3.1.0"`,
        `  }`,
        `}`,
        `// advisory feed (fictional): NSA-2026-0007 affects neon-yaml-parse below 1.6.0`,
        `//   parseDocument() constructs arbitrary object types from untrusted YAML tags`,
        `// src/config-loader.js`,
        `const { parseDocument } = require('neon-yaml-parse')`,
        `router.post('/config/preview', (req, res) => res.json(parseDocument(req.body.yamlText)))`,
      ],
    },
    linePrompt: 'Select the dependency pin and the call that exposes the vulnerable behavior to request data.',
    answerLines: [6, 14],
    classification: {
      prompt: 'Which risk category is this?',
      options: [
        'Use of a component with a known vulnerability',
        'Typosquatted package name',
        'Hard-coded credentials',
        'Prototype pollution in first-party code',
      ],
      answer: 'Use of a component with a known vulnerability',
    },
    writeups: [
      {
        key: 'impact',
        label: 'Impact',
        prompt: 'Why is the advisory relevant to this service?',
        model:
          'The vulnerable parse function is reachable with request-supplied YAML, so the advisory\'s unsafe object construction applies directly and could let a caller influence server-side behavior.',
      },
      {
        key: 'fix',
        label: 'Fix',
        prompt: 'What changes close the risk?',
        model:
          'Upgrade to the patched release, parse with a safe core schema that rejects custom tags, and add dependency auditing to CI so future advisories block the build.',
      },
    ],
    explanation:
      'The exact pin keeps the service on a release covered by a published (fictional) advisory, and the vulnerable function is called on untrusted input, so the known flaw is reachable rather than theoretical.',
    remediation:
      'Upgrade the dependency, restrict parsing to a safe schema, add automated dependency scanning with a severity gate, maintain an owner for each dependency, and document reachability analysis for future advisories.',
    safeFix: [
      `    "neon-yaml-parse": "1.6.1",`,
      `const { parseDocument } = require('neon-yaml-parse')`,
      `router.post('/config/preview', (req, res) => {`,
      `  res.json(parseDocument(req.body.yamlText, { schema: 'core', customTags: false }))`,
      `})`,
    ],
    testIdea:
      'Add a CI job that fails when the dependency audit reports an advisory at or above high severity, plus a unit test asserting that YAML containing a custom type tag is rejected by the preview endpoint.',
  },
  {
    id: 'APPSEC-10',
    track: 'appsec',
    kind: 'code-review',
    title: 'Internal Package Resolved From an Extra Index',
    difficulty: 'hard',
    cehModules: [5],
    skills: ['code-review', 'dependency-risk', 'supply-chain'],
    category: 'dependency-risk',
    scenario:
      'A NeonCorp billing job installs its dependencies at build time. A synthetic build log shows an unexpected version of an internal package.',
    artifact: {
      label: 'requirements.txt + build.log (synthetic excerpt)',
      language: 'text',
      lines: [
        `# requirements.txt (excerpt)`,
        `--extra-index-url https://packages.mirror.example/simple`,
        `neoncorp-billing-core`,
        `neon-http-client>=2.0`,
        `kitsune-crypto==0.9.1`,
        `# build log (synthetic)`,
        `resolving neoncorp-billing-core: internal 1.8.0, mirror 99.0.0`,
        `installed neoncorp-billing-core 99.0.0 from packages.mirror.example`,
      ],
    },
    linePrompt: 'Select the configuration lines that allow the internal package to resolve from the wrong source.',
    answerLines: [2, 3],
    classification: {
      prompt: 'Which dependency risk does the build log reveal?',
      options: [
        'Dependency confusion via an unpinned internal package and an extra public index',
        'Typosquatting of a popular package',
        'Vulnerable transitive dependency with a known advisory',
        'Missing subresource integrity on a CDN script',
      ],
      answer: 'Dependency confusion via an unpinned internal package and an extra public index',
    },
    writeups: [
      {
        key: 'impact',
        label: 'Impact',
        prompt: 'What does the unexpected version mean for the build?',
        model:
          'The resolver preferred the higher version from the external mirror, so code not published by NeonCorp ran inside the billing build with its secrets and network access.',
      },
      {
        key: 'fix',
        label: 'Fix',
        prompt: 'How should dependency resolution be locked down?',
        model:
          'Resolve internal names only from the internal registry, pin exact versions with hashes, reserve internal package names, and fail the build on unexpected sources.',
      },
    ],
    explanation:
      'With an extra index configured and no version pin, the resolver treats both sources as equal and picks the highest version, so a same-named package on another index can replace the internal one.',
    remediation:
      'Use a single internal index that proxies approved external packages, pin exact versions with hash checking, claim internal names on external registries, and review build logs and lockfiles for unexpected sources.',
    safeFix: [
      `# requirements.txt (excerpt)`,
      `--index-url https://packages.neoncorp.internal/simple`,
      `--require-hashes`,
      `neoncorp-billing-core==1.8.0 --hash=sha256:<pinned-hash-from-internal-registry>`,
      `neon-http-client==2.3.4 --hash=sha256:<pinned-hash>`,
      `kitsune-crypto==0.9.1 --hash=sha256:<pinned-hash>`,
    ],
    testIdea:
      'Add a CI check that installs with hash checking against only the internal index and fails if any package resolves from another source, plus a unit test that parses the requirements file and asserts every internal package name has an exact pin and hash.',
  },
]
