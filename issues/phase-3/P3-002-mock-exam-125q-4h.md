---
title: "[P3-002] 125問・4時間の Mock Exam Mode を実装する"
labels: "phase:3,type:feature,area:exam,priority:P0"
milestone: "Phase 3 - CEH Exam Mode"
phase: "3"
priority: "priority:P0"
estimate: "4d"
---

# [P3-002] 125問・4時間の Mock Exam Mode を実装する

## Summary

CEH 知識試験形式に近い timed mock exam を実装する。

## User Story

受験者として、本番と同じ時間感覚で 125 問を解く練習をしたい。

## Requirements

- [ ] 125 問の exam session を作成できる
- [ ] timer, question navigator, flagged for review を実装する
- [ ] 途中保存と resume をサポートする
- [ ] submit 後に result report へ遷移する

## Acceptance Criteria

- [ ] 125 問 session を開始できる
- [ ] timer が動く
- [ ] flagged questions を見直せる
- [ ] submit 後に採点される

## Subtasks

- [ ] exam session model を作る
- [ ] timer を作る
- [ ] navigator を作る
- [ ] submit flow を作る

## Dependencies

- None

## Safety / Abuse Prevention

Mock exam は知識確認用。実ターゲットへの操作や外部通信を伴う課題は入れない。

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
