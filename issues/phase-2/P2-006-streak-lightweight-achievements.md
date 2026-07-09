---
title: "[P2-006] Progress streak と lightweight achievement を追加する"
labels: "phase:2,type:feature,area:review,area:design,priority:P2"
milestone: "Phase 2 - Review System"
phase: "2"
priority: "priority:P2"
estimate: "1d"
---

# [P2-006] Progress streak と lightweight achievement を追加する

## Summary

ゲーム化しすぎず、継続の手応えだけを出す。

## User Story

ユーザーとして、毎日の復習を継続している実感が欲しい。

## Requirements

- [x] daily completion streak を表示する
- [x] achievement は復習・正答率・レポート提出など学習行動に限定する
- [x] leaderboard は MVP では作らない
- [ ] streak loss で過度に不安を煽らない copy にする

## Acceptance Criteria

- [x] 今日の復習完了で streak が増える
- [ ] miss しても motivational copy が表示される
- [ ] achievement は disable できる

## Subtasks

- [x] streak model を作る
- [x] achievement list を作る
- [x] dashboard badge を作る
- [ ] settings を作る

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
