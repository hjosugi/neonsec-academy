---
title: "[P4-003] Flag Challenge Engine を実装する"
labels: "phase:4,type:feature,area:lab,priority:P0"
milestone: "Phase 4 - Safe Practical Labs"
phase: "4"
priority: "priority:P0"
estimate: "3d"
---

# [P4-003] Flag Challenge Engine を実装する

## Summary

CEH Practical 風に、問題文・dataset・flag・evidence・解説を管理できるようにする。

## User Story

ユーザーとして、安全な課題で手を動かし、答えと根拠を提出したい。

## Requirements

- [ ] challenge に prompt, assets, expected_flag, hint, explanation を持たせる
- [ ] flag submit と attempt history を保存する
- [ ] hint 使用を記録する
- [ ] 正解後に remediation と report prompt を出す

## Acceptance Criteria

- [ ] flag を提出して正誤判定できる
- [ ] hint 使用が記録される
- [ ] 正解後に explanation が見える
- [ ] challenge result が analytics に反映される

## Subtasks

- [ ] challenge schema を作る
- [ ] flag submit UI を作る
- [ ] attempt save を作る
- [ ] explanation flow を作る

## Dependencies

- None

## Safety / Abuse Prevention

flag はローカル教材や静的 dataset から導く。実ネットワークへの侵入、credential theft、マルウェア実行を必要条件にしない。

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
