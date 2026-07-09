---
title: "[P5-006] Threat Modeling and Remediation Track を作る"
labels: "phase:5,type:content,area:content,area:lab,priority:P1"
milestone: "Phase 5 - CEH Plus Practical Track"
phase: "5"
priority: "priority:P1"
estimate: "3d"
---

# [P5-006] Threat Modeling and Remediation Track を作る

## Summary

攻撃者視点を安全に防御設計へ変換する track を作る。

## User Story

実践者として、脆弱性を見つけるだけでなく、設計レベルの対策を考えたい。

## Requirements

- [x] simple architecture diagram / data flow を教材として使う
- [x] assets, trust boundaries, threats, mitigations を整理する
- [x] CEH concepts と secure design を接続する
- [ ] output は remediation backlog とする

## Acceptance Criteria

- [ ] 最低 5 個の threat modeling scenario がある
- [ ] mitigation backlog を作成できる
- [x] report builder と連携できる

## Subtasks

- [ ] scenario template を作る
- [ ] threat form を作る
- [ ] mitigation backlog を作る
- [x] report 連携を作る

## Dependencies

- None

## Safety / Abuse Prevention

この Issue は許可済み教材・ローカルデータ・模擬データのみを対象にする。実システム、第三者サービス、実アカウント、実認証情報を扱わない。

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
