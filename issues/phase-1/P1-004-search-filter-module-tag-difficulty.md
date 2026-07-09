---
title: "[P1-004] CEH module / tag / difficulty で検索・フィルタする"
labels: "phase:1,type:feature,area:question-bank,priority:P0"
milestone: "Phase 1 - Question Bank MVP"
phase: "1"
priority: "priority:P0"
estimate: "2d"
---

# [P1-004] CEH module / tag / difficulty で検索・フィルタする

## Summary

必要な問題をすぐ探せるように、分類と検索 UI を実装する。

## User Story

ユーザーとして、弱点 module や難易度ごとに問題を絞り込みたい。

## Requirements

- [x] keyword search を提供する
- [x] module, tag, difficulty, status, last_attempt_result で filter できる
- [x] 複数 filter の組み合わせを保存できる設計にする
- [x] empty state で次の action を出す

## Acceptance Criteria

- [x] module: Cryptography などで正しく絞り込める
- [x] 複数 tag の filter が動く
- [x] 検索結果件数が表示される

## Subtasks

- [x] filter state を設計する
- [x] search input を作る
- [x] filter chips を作る
- [x] empty state を作る

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

- Question Bank now supports multi-tag filters, active/archive status, last attempt result, and local saved filter sets.
