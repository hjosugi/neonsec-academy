---
title: "[P3-010] CEH Final Gate Checklist を実装する"
labels: "phase:3,type:feature,area:exam,area:analytics,priority:P0"
milestone: "Phase 3 - CEH Exam Mode"
phase: "3"
priority: "priority:P0"
estimate: "2d"
---

# [P3-010] CEH Final Gate Checklist を実装する

## Summary

受験前の最終確認として、模試・coverage・復習 backlog・弱点をまとめる。

## User Story

受験者として、試験予約前に準備不足を客観的に確認したい。

## Requirements

- [ ] 3 回連続 mock score の条件を設定できる
- [ ] 未復習 due backlog の上限を設定できる
- [ ] weak modules が threshold 以下か確認する
- [ ] 未作成/未回答 module を警告する

## Acceptance Criteria

- [ ] Final Gate に pass/fail が出る
- [ ] fail の場合 next action が出る
- [ ] checklist を Markdown export できる

## Subtasks

- [ ] gate criteria を作る
- [ ] checklist UI を作る
- [ ] export を作る
- [ ] next action を作る

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
