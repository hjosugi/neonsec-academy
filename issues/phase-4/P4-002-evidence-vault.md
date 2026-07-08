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

- [ ] evidence item: title, type, note, source, timestamp, related challenge を持つ
- [ ] file path や screenshot reference を保存できる設計にする
- [ ] sensitive data warning を表示する
- [ ] evidence を report finding に紐付けられる

## Acceptance Criteria

- [ ] lab 中に evidence を追加できる
- [ ] evidence 一覧を challenge ごとに見られる
- [ ] report builder から evidence を引用できる

## Subtasks

- [ ] evidence schema を作る
- [ ] add/edit UI を作る
- [ ] lab link を作る
- [ ] report link を作る

## Dependencies

- None

## Safety / Abuse Prevention

実認証情報、第三者の個人情報、実システムの秘密情報を evidence に保存しない warning を出す。

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
