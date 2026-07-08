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

- [ ] overall score, module score, time spent, flagged accuracy を表示する
- [ ] typical target score と safety margin を出す
- [ ] wrong answers を review queue に送る
- [ ] PDF ではなく Markdown/HTML export を優先する

## Acceptance Criteria

- [ ] score と module breakdown が見える
- [ ] wrong answers が review queue に入る
- [ ] next 7 days plan が生成される

## Subtasks

- [ ] result aggregation を作る
- [ ] report UI を作る
- [ ] review queue 連携を作る
- [ ] plan generator を作る

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
