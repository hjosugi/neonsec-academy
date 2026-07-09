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
- [ ] 各課題に least privilege の説明を入れる

## Acceptance Criteria

- [ ] 最低 8 個の cloud config review challenge がある
- [x] 各 challenge に risk と remediation がある
- [x] cloud track の weakness stats が出る

## Subtasks

- [x] cloud scenario を作る
- [x] config sample を作る
- [ ] review form を作る
- [x] analytics tag を追加する

## Dependencies

- None

## Safety / Abuse Prevention

実 cloud account、実 access key、実 resource は使わない。synthetic config と架空 account ID のみ。

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
