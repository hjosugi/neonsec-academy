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

- [x] challenge に prompt, assets, expected_flag, hint, explanation を持たせる
- [x] flag submit と attempt history を保存する
- [x] hint 使用を記録する
- [x] 正解後に remediation と report prompt を出す

## Acceptance Criteria

- [x] flag を提出して正誤判定できる
- [x] hint 使用が記録される
- [x] 正解後に explanation が見える
- [x] challenge result が analytics に反映される

## Subtasks

- [x] challenge schema を作る
- [x] flag submit UI を作る
- [x] attempt save を作る
- [x] explanation flow を作る

## Dependencies

- None

## Safety / Abuse Prevention

flag はローカル教材や静的 dataset から導く。実ネットワークへの侵入、credential theft、マルウェア実行を必要条件にしない。

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

- Implemented safe flag definitions across all six local labs, persisted attempts and unique hint
  usage, accepted-flag locking, remediation/report unlocks, rubric integration, and a dedicated
  Analytics result panel. Import and browser hydration reject malformed or unknown challenge state
  and recompute correctness from the current static definition. Verified with unit, type, build,
  content, safety, persistence, and responsive smoke checks.
