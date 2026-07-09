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

- [x] exam preset: balanced, weak-focused, final-ready を用意する
- [x] module ごとの出題数を編集できる
- [x] 問題数不足時の fallback を明示する
- [x] preset は保存・複製できる

## Acceptance Criteria

- [x] balanced preset で 125 問を生成できる
- [x] weak-focused preset が弱点 module を増やす
- [x] 問題不足時に warning が出る

## Subtasks

- [x] preset schema を作る
- [x] editor UI を作る
- [x] exam generator と接続する
- [x] warning を作る

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
