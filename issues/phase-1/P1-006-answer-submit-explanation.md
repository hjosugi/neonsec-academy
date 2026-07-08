---
title: "[P1-006] 回答提出と即時 explanation 表示を実装する"
labels: "phase:1,type:feature,area:question-bank,area:review,priority:P0"
milestone: "Phase 1 - Question Bank MVP"
phase: "1"
priority: "priority:P0"
estimate: "2d"
---

# [P1-006] 回答提出と即時 explanation 表示を実装する

## Summary

問題に回答したら正誤、理由、罠、覚える短文をすぐ確認できるようにする。

## User Story

ユーザーとして、間違えた直後に理由を理解し、復習に回したい。

## Requirements

- [ ] answer submit 後に correct/incorrect を表示する
- [ ] explanation, why wrong, memory phrase を表示する
- [ ] 間違えた問題は review queue 候補にする
- [ ] submit 前後で選択肢の変更を制御する

## Acceptance Criteria

- [ ] 正解時と不正解時の UI が分かる
- [ ] attempt が保存される
- [ ] 不正解問題が review 候補になる

## Subtasks

- [ ] submit handler を作る
- [ ] result panel を作る
- [ ] attempt save を作る
- [ ] review enqueue hook を作る

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
