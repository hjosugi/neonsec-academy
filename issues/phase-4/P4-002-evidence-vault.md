---
title: "[P4-002] Evidence Vault を作る"
labels: "phase:4,type:feature,area:lab,priority:P0"
milestone: "Phase 4 - Safe Practical Labs"
phase: "4"
priority: "priority:P0"
estimate: "2d"
---

# [P4-002] Evidence Vault を作る

## Summary

lab の観察結果、スクリーンショット名、ログ抜粋、メモを evidence として整理できるようにする。

## User Story

実践者として、lab の答えだけでなく根拠を残して report に使いたい。

## Requirements

- [x] evidence item: title, type, note, source, timestamp, related challenge を持つ
- [x] file path や screenshot reference を保存できる設計にする
- [x] sensitive data warning を表示する
- [x] evidence を report finding に紐付けられる

## Acceptance Criteria

- [x] lab 中に evidence を追加できる
- [x] evidence 一覧を challenge ごとに見られる
- [x] report builder から evidence を引用できる

## Subtasks

- [x] evidence schema を作る
- [x] add/edit UI を作る
- [x] lab link を作る
- [x] report link を作る

## Dependencies

- None

## Safety / Abuse Prevention

実認証情報、第三者の個人情報、実システムの秘密情報を evidence に保存しない warning を出す。

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

- Implemented challenge-scoped local persistence, lab add/edit/delete UI, a grouped Vault route,
  direct lab-to-report editing, finding links, and Markdown citations. Backup and browser hydration
  reject invalid Vault rows and reconcile duplicate, missing, or cross-challenge citations. Verified
  with unit/build/content/safety checks plus a desktop/mobile browser smoke flow including reload
  persistence.
