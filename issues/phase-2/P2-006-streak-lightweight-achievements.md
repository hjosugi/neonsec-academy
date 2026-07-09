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
- [x] streak loss で過度に不安を煽らない copy にする

## Acceptance Criteria

- [x] 今日の復習完了で streak が増える
- [x] miss しても motivational copy が表示される
- [x] achievement は disable できる

## Subtasks

- [x] streak model を作る
- [x] achievement list を作る
- [x] dashboard badge を作る
- [x] settings を作る

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

- None
