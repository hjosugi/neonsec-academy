---
title: "[P4-001] Lab Registry と Scope Contract を実装する"
labels: "phase:4,type:feature,type:security,area:lab,area:safety,priority:P0"
milestone: "Phase 4 - Safe Practical Labs"
phase: "4"
priority: "priority:P0"
estimate: "3d"
---

# [P4-001] Lab Registry と Scope Contract を実装する

## Summary

すべての lab に許可範囲、対象、禁止事項、期待 evidence を持たせる。

## User Story

ユーザーとして、実践課題を始める前に安全範囲を明確に確認したい。

## Requirements

- [x] lab ごとに scope contract を表示する
- [x] 開始前に user acknowledgement を必須にする
- [x] external target, public IP, real email, real credentials を禁止フィールドとして検出する
- [x] lab は local / dataset / simulated / writeup の種類に分ける

## Acceptance Criteria

- [x] scope 未確認では lab を開始できない
- [x] lab detail に allowed/forbidden が表示される
- [x] unsafe metadata を含む lab は publish できない

## Subtasks

- [x] lab schema を作る
- [x] scope UI を作る
- [x] acknowledgement を保存する
- [x] safety validation を作る

## Dependencies

- None

## Safety / Abuse Prevention

最重要 Issue。lab は許可済みローカル教材・模擬 dataset のみ。実サービスを対象にする記述を metadata validation で拒否する。

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
