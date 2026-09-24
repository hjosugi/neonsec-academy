---
title: "[P5-010] Advanced Lab Pack Authoring を設計する"
labels: "phase:5,type:infra,type:content,area:lab,priority:P1"
milestone: "Phase 5 - CEH Plus Practical Track"
phase: "5"
priority: "priority:P1"
estimate: "3d"
---

# [P5-010] Advanced Lab Pack Authoring を設計する

## Summary

将来、CEH+ の課題セットを追加しやすい authoring format を作る。

## User Story

教材作成者として、新しい lab pack を安全に追加したい。

## Requirements

- [x] lab pack manifest, challenge files, assets, safety audit result を定義する
- [x] versioning と compatibility を持たせる
- [x] pack import 前に safety audit を必須にする
- [x] sample pack を 1 つ作る

## Acceptance Criteria

- [x] lab pack format が docs にある
- [x] sample pack を import preview できる
- [x] unsafe pack は import できない

## Subtasks

- [x] manifest schema を作る
- [x] sample pack を作る
- [x] import preview を設計する
- [x] safety audit 連携を作る

## Dependencies

- None

## Safety / Abuse Prevention

第三者からの lab pack は信頼しない。安全 audit、manifest validation、public target 禁止を必須にする。

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

- `docs/LAB_PACK_FORMAT.md` (EN/JA) and `docs/schemas/lab-pack.schema.json` define the manifest,
  challenge files, assets, safety audit result, versioning, and compatibility. The sample pack
  `seed_content/lab-packs/neon-starter-pack.json` previews and imports on `/labs/packs`; unsafe packs,
  author overrides, incompatible versions, and id collisions are refused after a local re-audit.
  Installed pack labs are preview-only for now. Verified with unit, type, content, safety, audit, and
  build checks.
