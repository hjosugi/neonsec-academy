---
title: "[P6-007] Theme Presets と Accessibility QA を実施する"
labels: "phase:6,type:quality,type:design,area:design,priority:P0"
milestone: "Phase 6 - Cyberpunk Polish and Launch"
phase: "6"
priority: "priority:P0"
estimate: "3d"
---

# [P6-007] Theme Presets と Accessibility QA を実施する

## Summary

Cyberpunk theme を維持しつつ、視認性と疲れにくさを検証する。

## User Story

ユーザーとして、長時間使っても目が疲れにくく、文字が読めるテーマを選びたい。

## Requirements

- [x] presets: Neon Night, Low Glow, High Contrast, Focus Mode
- [x] 問題文、解説、ログ、コード、表の contrast を確認する
- [x] color だけに依存しない status 表示にする
- [x] keyboard focus と screen reader label を確認する

## Acceptance Criteria

- [x] 4 つの theme preset が選べる
- [x] status が色以外でも判別できる
- [x] accessibility checklist が pass する

## Subtasks

- [x] theme preset を作る
- [x] contrast QA を行う
- [x] focus QA を行う
- [x] checklist を記録する

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
