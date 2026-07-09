---
title: "[P3-004] Exam Result Report を作る"
labels: "phase:3,type:feature,area:exam,area:analytics,priority:P0"
milestone: "Phase 3 - CEH Exam Mode"
phase: "3"
priority: "priority:P0"
estimate: "3d"
---

# [P3-004] Exam Result Report を作る

## Summary

Mock exam 後に合格可能性、弱点、復習 plan を出す。

## User Story

受験者として、模試後に何を直せば合格に近づくかを知りたい。

## Requirements

- [x] overall score, module score, time spent, flagged accuracy を表示する
- [x] typical target score と safety margin を出す
- [x] wrong answers を review queue に送る
- [x] PDF ではなく Markdown/HTML export を優先する

## Acceptance Criteria

- [x] score と module breakdown が見える
- [x] wrong answers が review queue に入る
- [x] next 7 days plan が生成される

## Subtasks

- [x] result aggregation を作る
- [x] report UI を作る
- [x] review queue 連携を作る
- [x] plan generator を作る

## Dependencies

- None

## Safety / Abuse Prevention

この Issue は許可済み教材・ローカルデータ・模擬データのみを対象にする。実システム、第三者サービス、実アカウント、実認証情報を扱わない。

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

- None
