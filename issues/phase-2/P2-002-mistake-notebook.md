---
title: "[P2-002] Mistake Notebook を作る"
labels: "phase:2,type:feature,area:review,priority:P0"
milestone: "Phase 2 - Review System"
phase: "2"
priority: "priority:P0"
estimate: "2d"
---

# [P2-002] Mistake Notebook を作る

## Summary

間違えた理由、正しい考え方、次回の覚え方を 1 問ごとに残せるようにする。

## User Story

ユーザーとして、自分の間違いパターンを言語化して、同じミスを減らしたい。

## Requirements

- [x] attempt から mistake note を作成できる
- [x] fields: why_wrong, correct_reasoning, memory_phrase, next_action
- [x] module / tag / date で notebook を filter できる
- [x] review session 後に notebook update を促す

## Acceptance Criteria

- [x] 不正解 attempt から note を作れる
- [x] note が question detail と dashboard から見える
- [x] 未記入の mistake note を検出できる

## Subtasks

- [x] note schema を作る
- [x] create flow を作る
- [x] notebook list を作る
- [x] filter を作る

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
