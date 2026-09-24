---
title: "[P4-004] PCAP / Log / Config Analysis Challenge を追加する"
labels: "phase:4,type:content,area:lab,area:content,priority:P0"
milestone: "Phase 4 - Safe Practical Labs"
phase: "4"
priority: "priority:P0"
estimate: "3d"
---

# [P4-004] PCAP / Log / Config Analysis Challenge を追加する

## Summary

実践的だが安全な dataset 分析型 challenge を作る。

## User Story

実践者として、危険な攻撃を実行せずに、通信・ログ・設定の読み方を身につけたい。

## Requirements

- [x] PCAP, web log, auth log, cloud config, firewall rule の challenge type を用意する
- [x] 各 challenge は answer, evidence, remediation を要求する
- [x] dataset は synthetic または intentionally prepared のみ使う
- [x] 解説は detection と prevention を含める

## Acceptance Criteria

- [x] 最低 5 種類の analysis challenge sample がある
- [x] 各 sample に flag と explanation がある
- [x] report builder へ evidence を送れる

## Subtasks

- [x] challenge type を定義する
- [x] sample dataset を作る
- [x] viewer UI を作る
- [x] scoring を作る

## Dependencies

- None

## Safety / Abuse Prevention

実被害ログや流出データは使わない。教材用に作成した synthetic dataset のみを seed に含める。

## Test Plan

- [x] 主要な happy path が手動で再現できる
- [x] 入力エラー時に安全に失敗する
- [x] 永続化されたデータが再読み込み後も一致する

## Definition of Done

- [x] Acceptance Criteria がすべて満たされている
- [x] 必要な docs / schema / sample data が更新されている
- [x] Safety / Abuse Prevention が確認されている
- [x] Review Queue / Analytics への影響が確認されている
- [x] Cyberpunk UI が可読性を邪魔していない

## Notes

- Six dataset-analysis families ship as Safe Labs (PCAP summary, web access log, auth log, cloud
  config, firewall rules, email headers). Each has a flag, explanation, detection/prevention debrief,
  and rubric requiring answer, evidence, and remediation. The line-numbered viewer sends selected lines
  to the Evidence Vault and cites them in the lab report. Verified with unit, type, content, safety,
  and build checks.
