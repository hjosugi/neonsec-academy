# Markdown Sample Log Problem

Which event should a SOC analyst prioritize first?

> [!NOTE] Synthetic evidence
> These lines are generated for renderer testing. They are not customer logs and do not identify a real system.

```text
2026-07-10T09:14:03Z auth-gateway user=alex result=fail src=198.51.100.24 reason=bad_password
2026-07-10T09:14:08Z auth-gateway user=alex result=fail src=198.51.100.24 reason=bad_password
2026-07-10T09:14:19Z auth-gateway user=alex result=success src=198.51.100.24 mfa=disabled
2026-07-10T09:15:02Z finance-app user=alex action=export report=quarterly-summary
```

| Signal | Why it matters | First response |
|---|---|---|
| Repeated failures then success | May indicate password spraying or guessing against one account | Validate user activity and reset credentials if unauthorized |
| `mfa=disabled` | Removes a major account takeover control | Enforce MFA and review exception policy |
| Sensitive export after login | Possible post-compromise impact | Preserve logs and check data-access scope |

Expected answer: prioritize the successful login to the MFA-disabled account followed by the report export, then contain the account and preserve evidence.
