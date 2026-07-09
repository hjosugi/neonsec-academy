---
title: "[P3-005] Question randomization と no-repeat policy を実装する"
labels: "phase:3,type:infra,area:exam,priority:P1"
milestone: "Phase 3 - CEH Exam Mode"
phase: "3"
priority: "priority:P1"
estimate: "2d"
---

# [P3-005] Question randomization と no-repeat policy を実装する

## Summary

Mock exam で同じ問題が偏りすぎないようにする。

## User Story

受験者として、答えの暗記ではなく理解を測りたい。

## Requirements

- [ ] recently used questions を避ける
- [x] module coverage を守りながら randomize する
- [ ] 選択肢 order を question ごとに randomize できる
- [ ] seed を保存して exam 再現性を持たせる

## Acceptance Criteria

- [x] 同じ preset でも session ごとに問題が変わる
- [ ] 過去直近 session の重複率が threshold 以下になる
- [ ] result review では元の順序を再現できる

## Subtasks

- [x] selection algorithm を作る
- [ ] seed 保存を作る
- [ ] choice shuffle を作る
- [ ] duplicate test を作る

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
