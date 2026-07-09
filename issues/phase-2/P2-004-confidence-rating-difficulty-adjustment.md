---
title: "[P2-004] Confidence rating と difficulty adjustment を追加する"
labels: "phase:2,type:feature,area:review,priority:P1"
milestone: "Phase 2 - Review System"
phase: "2"
priority: "priority:P1"
estimate: "2d"
---

# [P2-004] Confidence rating と difficulty adjustment を追加する

## Summary

正解/不正解だけでなく、自信の有無を復習計画に反映する。

## User Story

ユーザーとして、勘で当たった問題も復習に残したい。

## Requirements

- [x] answer submit 時に confidence 1〜5 を入力できる
- [x] 低 confidence の正解は review interval を短くする
- [x] 問題作成者が perceived difficulty を見られる
- [x] confidence 未入力時の default policy を決める

## Acceptance Criteria

- [x] 正解でも confidence 低なら review queue に残る
- [x] confidence trend が question detail に出る
- [x] settings で confidence 入力の有無を切り替えられる

## Subtasks

- [x] confidence UI を作る
- [x] scheduler と接続する
- [x] history に保存する
- [x] stats に追加する

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
