---
title: "[P5-003] CEH+ Cloud IAM / Config Review Track を作る"
labels: "phase:5,type:content,area:lab,area:content,priority:P0"
milestone: "Phase 5 - CEH Plus Practical Track"
phase: "5"
priority: "priority:P0"
estimate: "4d"
---

# [P5-003] CEH+ Cloud IAM / Config Review Track を作る

## Summary

Cloud security の基礎を、模擬設定ファイルのレビューで学ぶ track を作る。

## User Story

実践者として、cloud の危険な設定を見つけ、修正方針を説明できるようになりたい。

## Requirements

- [x] IAM over-permission, public exposure, weak logging, missing encryption, secret handling を扱う
- [x] vendor 固有操作ではなく、概念と設定レビューを中心にする
- [x] synthetic config files のみ使う
- [x] 各課題に least privilege の説明を入れる

## Acceptance Criteria

- [x] 最低 8 個の cloud config review challenge がある
- [x] 各 challenge に risk と remediation がある
- [x] cloud track の weakness stats が出る

## Subtasks

- [x] cloud scenario を作る
- [x] config sample を作る
- [x] review form を作る
- [x] analytics tag を追加する

## Dependencies

- None

## Safety / Abuse Prevention

実 cloud account、実 access key、実 resource は使わない。synthetic config と架空 account ID のみ。

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

- `/tracks/cloud` ships 8 synthetic, vendor-neutral config reviews across IAM over-permission,
  public exposure, weak logging, missing encryption, and secret handling. Each has risk and
  remediation deliverables plus a least-privilege explanation; the track page shows weakness stats by
  category and skill. Verified with unit, type, content, safety, audit, and build checks.
