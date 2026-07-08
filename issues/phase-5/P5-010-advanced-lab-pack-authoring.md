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

- [ ] lab pack manifest, challenge files, assets, safety audit result を定義する
- [ ] versioning と compatibility を持たせる
- [ ] pack import 前に safety audit を必須にする
- [ ] sample pack を 1 つ作る

## Acceptance Criteria

- [ ] lab pack format が docs にある
- [ ] sample pack を import preview できる
- [ ] unsafe pack は import できない

## Subtasks

- [ ] manifest schema を作る
- [ ] sample pack を作る
- [ ] import preview を設計する
- [ ] safety audit 連携を作る

## Dependencies

- None

## Safety / Abuse Prevention

第三者からの lab pack は信頼しない。安全 audit、manifest validation、public target 禁止を必須にする。

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
