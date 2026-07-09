---
title: "[P1-007] Attempt history と基本統計を保存する"
labels: "phase:1,type:feature,area:analytics,area:review,priority:P0"
milestone: "Phase 1 - Question Bank MVP"
phase: "1"
priority: "priority:P0"
estimate: "2d"
---

# [P1-007] Attempt history と基本統計を保存する

## Summary

各問題の回答履歴、正答率、最終回答日、連続正解数を保存する。

## User Story

ユーザーとして、自分がどの問題をいつ何回間違えたかを見たい。

## Requirements

- [ ] attempt ごとに selected_answer, result, time_spent, confidence を保存する
- [ ] question detail に attempt history を表示する
- [x] basic stats: total attempts, accuracy, last attempted を計算する
- [x] privacy のため external tracking は入れない

## Acceptance Criteria

- [ ] 同じ問題の複数 attempt が時系列で見える
- [x] dashboard に basic stats が表示される
- [x] データ再読み込み後も履歴が残る

## Subtasks

- [ ] attempt schema を作る
- [x] save flow を作る
- [ ] history UI を作る
- [x] stats calculation を作る

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
