---
title: "[P1-003] 複数の question type に対応する"
labels: "phase:1,type:feature,area:question-bank,priority:P0"
milestone: "Phase 1 - Question Bank MVP"
phase: "1"
priority: "priority:P0"
estimate: "3d"
---

# [P1-003] 複数の question type に対応する

## Summary

MCQ だけでなく、scenario、multi-select、true/false、short answer、report prompt を扱えるようにする。

## User Story

CEH 受験者として、知識問題だけでなくシナリオ問題や実務寄りの問題も同じ場所で管理したい。

## Requirements

- [x] question_type enum を実装する
- [x] MCQ, multi_select, true_false, short_answer, scenario, report_prompt をサポートする
- [x] type ごとに validation を変える
- [x] UI は type に応じて回答形式を変える

## Acceptance Criteria

- [x] 6 種類の question type が seed data で表示できる
- [x] type に合わない回答形式は保存できない
- [x] attempt history に回答形式が残る

## Subtasks

- [x] schema を拡張する
- [x] renderer を分岐する
- [x] validation を追加する
- [x] sample data を作る

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

- Added `short_answer` and `report_prompt` as self-graded free-form types; seed data includes both.
