---
title: "[P0-004] Question / Review / Attempt / Lab / Report のデータモデルを設計する"
labels: "phase:0,type:infra,area:question-bank,area:review,priority:P0"
milestone: "Phase 0 - Foundation"
phase: "0"
priority: "priority:P0"
estimate: "2d"
---

# [P0-004] Question / Review / Attempt / Lab / Report のデータモデルを設計する

## Summary

問題管理と復習管理を後から拡張しやすくするため、最初に最小データモデルを決める。

## User Story

開発者として、問題・回答履歴・復習予定・lab evidence を一貫した ID で追跡したい。

## Requirements

- [x] Question, Choice, Explanation, Attempt, ReviewItem, LabChallenge, Evidence, Report の entity を定義する
- [x] すべての entity に stable id, created_at, updated_at を持たせる
- [x] CEH module と CEH+ track を外部キーまたは enum として扱う
- [x] 将来の import/export を前提に JSON schema を用意する

## Acceptance Criteria

- [x] docs/DATA_MODEL.md に ERD 風の説明がある
- [x] sample JSON が validation 可能な形で置かれている
- [x] 削除・アーカイブ・復元の方針が書かれている

## Subtasks

- [x] entity 一覧を書く
- [x] field 定義を書く
- [x] index / search key を決める
- [x] migration 方針を書く

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

- Completed in `docs/DATA_MODEL.md`; user-authored questions now persist `createdAt` and `updatedAt`.
