---
title: "[P3-007] Mock Exam Review Mode を実装する"
labels: "phase:3,type:feature,area:exam,area:review,priority:P0"
milestone: "Phase 3 - CEH Exam Mode"
phase: "3"
priority: "priority:P0"
estimate: "2d"
---

# [P3-007] Mock Exam Review Mode を実装する

## Summary

模試後に間違い・迷い・時間超過問題だけを効率よく見直せるようにする。

## User Story

受験者として、模試後に全問を見直すのではなく、重要な問題から復習したい。

## Requirements

- [ ] wrong, flagged, low confidence, slow questions で filter できる
- [x] explanation と自分の回答を並べる
- [ ] mistake notebook に送れる
- [ ] review queue への一括追加ができる

## Acceptance Criteria

- [x] wrong questions だけ表示できる
- [ ] flagged questions だけ表示できる
- [ ] 一括 review enqueue ができる

## Subtasks

- [ ] review filters を作る
- [x] compare view を接続する
- [ ] bulk enqueue を作る
- [ ] notebook 連携を作る

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
