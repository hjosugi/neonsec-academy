---
title: "[P3-003] Exam weighting config をユーザー編集可能にする"
labels: "phase:3,type:feature,area:exam,priority:P1"
milestone: "Phase 3 - CEH Exam Mode"
phase: "3"
priority: "priority:P1"
estimate: "2d"
---

# [P3-003] Exam weighting config をユーザー編集可能にする

## Summary

module 別出題比率を設定し、弱点重視・均等・本番想定の mock exam を作れるようにする。

## User Story

ユーザーとして、苦手 module を多めに出す mock exam を作りたい。

## Requirements

- [ ] exam preset: balanced, weak-focused, final-ready を用意する
- [ ] module ごとの出題数を編集できる
- [ ] 問題数不足時の fallback を明示する
- [ ] preset は保存・複製できる

## Acceptance Criteria

- [ ] balanced preset で 125 問を生成できる
- [ ] weak-focused preset が弱点 module を増やす
- [ ] 問題不足時に warning が出る

## Subtasks

- [x] preset schema を作る
- [ ] editor UI を作る
- [x] exam generator と接続する
- [ ] warning を作る

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
