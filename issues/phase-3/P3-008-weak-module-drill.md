---
title: "[P3-008] Weak Module Drill を作る"
labels: "phase:3,type:feature,area:exam,area:review,priority:P0"
milestone: "Phase 3 - CEH Exam Mode"
phase: "3"
priority: "priority:P0"
estimate: "2d"
---

# [P3-008] Weak Module Drill を作る

## Summary

苦手 module に絞って短時間 drill を実行できるようにする。

## User Story

受験者として、弱点だけを 10〜30 問単位で集中練習したい。

## Requirements

- [ ] module / tag / question type / difficulty を選んで drill を作る
- [ ] 10, 20, 30 問の quick presets を用意する
- [x] drill 結果を review と analytics に反映する
- [x] 同じ問題の連続出題を避ける

## Acceptance Criteria

- [x] Cryptography 10 問 drill を開始できる
- [ ] drill result が保存される
- [x] weakness dashboard が更新される

## Subtasks

- [x] drill generator を作る
- [x] session UI を作る
- [ ] result save を作る
- [x] dashboard 連携を作る

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
