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

- [ ] landing copy は problem management, review system, practical evidence を強調する
- [ ] demo dataset は安全な synthetic content のみ使う
- [ ] screens: dashboard, review queue, mock exam report, lab report, city map
- [ ] dark cyberpunk aesthetic を保つ

## Acceptance Criteria

- [ ] landing page に主要価値が 30 秒で伝わる
- [ ] demo mode を安全に起動できる
- [ ] 危険な tool 実行を連想させすぎない copy になっている

## Subtasks

- [ ] landing copy を作る
- [ ] demo dataset を作る
- [ ] screens を整える
- [ ] safety copy を review する

## Dependencies

- None

## Safety / Abuse Prevention

demo は synthetic content のみ。実攻撃ツールの実行デモや実ターゲット操作の演出は避ける。

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
