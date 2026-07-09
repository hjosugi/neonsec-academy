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

- [ ] PCAP, web log, auth log, cloud config, firewall rule の challenge type を用意する
- [x] 各 challenge は answer, evidence, remediation を要求する
- [x] dataset は synthetic または intentionally prepared のみ使う
- [x] 解説は detection と prevention を含める

## Acceptance Criteria

- [x] 最低 5 種類の analysis challenge sample がある
- [ ] 各 sample に flag と explanation がある
- [ ] report builder へ evidence を送れる

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

- [ ] 主要な happy path が手動で再現できる
- [ ] 入力エラー時に安全に失敗する
- [ ] 永続化されたデータが再読み込み後も一致する

## Definition of Done

- [ ] Acceptance Criteria がすべて満たされている
- [ ] 必要な docs / schema / sample data が更新されている
- [ ] Safety / Abuse Prevention が確認されている
- [ ] Review Queue / Analytics への影響が確認されている
- [ ] Cyberpunk UI が可読性を邪魔していない

## Notes

- None
