---
title: "[P6-012] v1.0 Acceptance Test Run を実施する"
labels: "phase:6,type:quality,priority:P0"
milestone: "Phase 6 - Cyberpunk Polish and Launch"
phase: "6"
priority: "priority:P0"
estimate: "3d"
---

# [P6-012] v1.0 Acceptance Test Run を実施する

## Summary

Phase 0〜6 の主要 flow が通るかを、リリース前にまとめて検証する。

## User Story

開発者として、v1.0 を出す前に、問題作成から復習、模試、lab、report、export まで通しで確認したい。

## Requirements

- [x] happy path: onboarding → question → attempt → review → mock → lab → report → export
- [x] safety path: unsafe lab rejected, public-safe export masking
- [x] accessibility path: keyboard review, reduced motion, low glow
- [x] data path: import/export/backup restore

## Acceptance Criteria

- [x] acceptance checklist がすべて pass している
- [x] known issues が triaged されている
- [x] v1.0 release note が作成されている

## Subtasks

- [x] test plan を作る
- [x] manual run を実行する
- [x] bugs を起票する
- [x] release note を作る

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
