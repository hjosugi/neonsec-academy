---
title: "[P0-006] Cyberpunk Productivity Design System v0 を作る"
labels: "phase:0,type:design,area:design,priority:P0"
milestone: "Phase 0 - Foundation"
phase: "0"
priority: "priority:P0"
estimate: "2d"
---

# [P0-006] Cyberpunk Productivity Design System v0 を作る

## Summary

neon terminal 風の見た目を残しつつ、問題管理・復習管理が読みやすい UI ルールを作る。

## User Story

ユーザーとして、cyberpunk 感は欲しいが、長時間の復習でも疲れない画面にしたい。

## Requirements

- [x] color token, typography, spacing, elevation, border, glow のルールを定義する
- [x] neon effect は CTA, focus, status, rank に限定する
- [x] 問題文・解説・コード・ログは高コントラストで読みやすくする
- [x] reduced motion と low glow mode を必須にする

## Acceptance Criteria

- [x] docs/DESIGN_SYSTEM.md に token と component 方針がある
- [x] Question Console, Review Queue, Mock Exam, Lab Report の wireframe がある
- [x] accessibility notes がある

## Subtasks

- [x] color tokens を決める
- [x] component vocabulary を決める
- [x] screen priority を決める
- [x] motion / glow policy を書く

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

- Wireframes added to `docs/DESIGN_SYSTEM.md`.
