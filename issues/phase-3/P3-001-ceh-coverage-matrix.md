---
title: "[P3-001] CEH 20-module Coverage Matrix を作る"
labels: "phase:3,type:feature,area:exam,area:analytics,priority:P0"
milestone: "Phase 3 - CEH Exam Mode"
phase: "3"
priority: "priority:P0"
estimate: "2d"
---

# [P3-001] CEH 20-module Coverage Matrix を作る

## Summary

公式 module ごとの問題数、正答率、復習状況を一覧で確認できるようにする。

## User Story

CEH 受験者として、20 module のどこが足りないかを一目で知りたい。

## Requirements

- [ ] 20 module ごとに total questions, attempted, accuracy, due count, readiness を表示する
- [ ] module をクリックすると drill に移動する
- [ ] coverage threshold を設定できる
- [ ] 問題数が少ない module を警告する

## Acceptance Criteria

- [ ] 20 module すべてが matrix に出る
- [ ] 未作成/未回答/弱点が区別できる
- [ ] module drill に遷移できる

## Subtasks

- [ ] matrix aggregation を作る
- [ ] readiness formula を作る
- [ ] UI を作る
- [ ] drill link を作る

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
