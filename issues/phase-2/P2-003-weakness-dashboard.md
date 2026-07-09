---
title: "[P2-003] Weakness Dashboard を作る"
labels: "phase:2,type:feature,area:analytics,area:review,priority:P0"
milestone: "Phase 2 - Review System"
phase: "2"
priority: "priority:P0"
estimate: "3d"
---

# [P2-003] Weakness Dashboard を作る

## Summary

module, tag, question type, difficulty ごとの弱点を見える化する。

## User Story

ユーザーとして、今どの CEH module を重点的に復習すべきかを知りたい。

## Requirements

- [ ] accuracy, attempts, due count, average confidence, recent trend を計算する
- [x] CEH 20 module coverage を一覧表示する
- [x] weakest 3 modules と next action を出す
- [ ] データが少ない場合は insufficient data と表示する

## Acceptance Criteria

- [x] module ごとの正答率が表示される
- [x] weakest modules が dashboard に出る
- [x] クリックすると該当問題に遷移できる

## Subtasks

- [x] metrics 定義を作る
- [x] aggregation を作る
- [x] dashboard UI を作る
- [x] drilldown link を作る

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
