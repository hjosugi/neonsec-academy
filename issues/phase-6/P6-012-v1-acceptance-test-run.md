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

- [ ] happy path: onboarding → question → attempt → review → mock → lab → report → export
- [ ] safety path: unsafe lab rejected, public-safe export masking
- [ ] accessibility path: keyboard review, reduced motion, low glow
- [ ] data path: import/export/backup restore

## Acceptance Criteria

- [ ] acceptance checklist がすべて pass している
- [ ] known issues が triaged されている
- [ ] v1.0 release note が作成されている

## Subtasks

- [ ] test plan を作る
- [ ] manual run を実行する
- [ ] bugs を起票する
- [ ] release note を作る

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
