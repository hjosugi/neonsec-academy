# Safety Boundaries

## Core Rule

NeonSec Academy は、許可済み教材・ローカル環境・合成データだけを使う。

## Forbidden

- 外部 IP / 実ドメインへの scanning
- 実サービスへの exploit attempt
- 実 phishing email / credential collection
- 実 Wi-Fi attack
- DDoS traffic generation
- live malware execution
- RAT / keylogger / spyware 実装
- 認証情報の窃取、回避、永続化
- 流出データや個人情報を含む dataset

## Allowed Safe Replacements

| Risky Topic | Safe Replacement |
|---|---|
| DDoS | synthetic traffic log analysis, rate-limit design quiz |
| Phishing | simulated email header analysis, awareness review |
| Malware | toy indicators, hash/string concept, static log/PCAP review |
| RAT / keylogger | detection concept, EDR alert review, prevention checklist |
| Password attacks | toy hash policy quiz, password hygiene, defensive policy |
| Wireless attack | static PCAP/config review only |
| Web attacks | local toy app or static request/response dataset |
| Cloud compromise | synthetic IAM/config review |

## Lab Scope Contract Template

```yaml
lab_id: LAB-001
allowed:
  - provided_dataset_only
  - local_toy_app_only
forbidden:
  - public_internet_target
  - real_credentials
  - third_party_service
requires_acknowledgement: true
expected_outputs:
  - finding
  - evidence
  - remediation
```
