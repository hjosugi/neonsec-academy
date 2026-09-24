---
title: "[P6-010] Demo Content と Landing Page を作る"
labels: "phase:6,type:design,type:content,area:design,priority:P1"
milestone: "Phase 6 - Cyberpunk Polish and Launch"
phase: "6"
priority: "priority:P1"
estimate: "3d"
---

# [P6-010] Demo Content と Landing Page を作る

## Summary

Cyberpunk 感と問題管理価値が伝わる demo を用意する。

## User Story

初見ユーザーとして、これは単なるゲームではなく、CEH と実践復習の管理ツールだとすぐ分かりたい。

## Requirements

- [x] landing copy は problem management, review system, practical evidence を強調する
- [x] demo dataset は安全な synthetic content のみ使う
- [x] screens: dashboard, review queue, mock exam report, lab report, city map
- [x] dark cyberpunk aesthetic を保つ

## Acceptance Criteria

- [x] landing page に主要価値が 30 秒で伝わる
- [x] demo mode を安全に起動できる
- [x] 危険な tool 実行を連想させすぎない copy になっている

## Subtasks

- [x] landing copy を作る
- [x] demo dataset を作る
- [x] screens を整える
- [x] safety copy を review する

## Dependencies

- None

## Safety / Abuse Prevention

demo は synthetic content のみ。実攻撃ツールの実行デモや実ターゲット操作の演出は避ける。

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

- `/welcome` presents the three core values, safety copy, and demo entry points (dashboard, review
  queue, mock exam report, lab report, city map). Demo mode loads a deterministic synthetic learner
  after parking the user's data locally and restores it on exit. Landing copy is tested against the
  lab safety audit rules. Verified with unit, type, content, safety, audit, and build checks.
