---
title: "[P2-001] Review scheduler を実装する"
labels: "phase:2,type:feature,area:review,priority:P0"
milestone: "Phase 2 - Review System"
phase: "2"
priority: "priority:P0"
estimate: "3d"
---

# [P2-001] Review scheduler を実装する

## Summary

間違えた問題や自信の低い問題を自動で復習予定に入れる。

## User Story

ユーザーとして、次に何を復習すべきかを自分で毎回考えなくてよいようにしたい。

## Requirements

- [ ] review interval, due_at, ease, lapses, confidence を持つ
- [ ] 回答結果と confidence から次回復習日を決める
- [ ] 同じ日に出す問題数の上限を設定できる
- [ ] manual reschedule を可能にする

## Acceptance Criteria

- [x] 不正解問題が due queue に入る
- [x] 正解が続くと間隔が伸びる
- [x] due count が dashboard に表示される

## Subtasks

- [x] scheduler model を作る
- [x] enqueue logic を作る
- [x] due query を作る
- [ ] settings を作る

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
