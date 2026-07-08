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

- [ ] question_type enum を実装する
- [ ] MCQ, multi_select, true_false, short_answer, scenario, report_prompt をサポートする
- [ ] type ごとに validation を変える
- [ ] UI は type に応じて回答形式を変える

## Acceptance Criteria

- [ ] 6 種類の question type が seed data で表示できる
- [ ] type に合わない回答形式は保存できない
- [ ] attempt history に回答形式が残る

## Subtasks

- [ ] schema を拡張する
- [ ] renderer を分岐する
- [ ] validation を追加する
- [ ] sample data を作る

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
