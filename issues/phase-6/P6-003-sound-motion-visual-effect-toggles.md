---
title: "[P6-003] Sound / Motion / Visual Effects の optional toggles を作る"
labels: "phase:6,type:design,type:quality,area:design,priority:P1"
milestone: "Phase 6 - Cyberpunk Polish and Launch"
phase: "6"
priority: "priority:P1"
estimate: "2d"
---

# [P6-003] Sound / Motion / Visual Effects の optional toggles を作る

## Summary

Cyberpunk 演出を好みに応じて調整できるようにする。

## User Story

ユーザーとして、集中したい時は演出を減らし、気分を上げたい時は演出を有効にしたい。

## Requirements

- [x] sound は default off にする
- [x] motion は reduced motion setting を尊重する
- [x] glitch effect は短く、問題文には使わない
- [x] settings から all effects off ができる

## Acceptance Criteria

- [x] effect settings が保存される
- [x] 問題文に animation がかからない
- [x] reduced motion on で演出が止まる

## Subtasks

- [x] settings fields を作る
- [x] effect gates を作る
- [x] sound policy を作る
- [x] QA を行う

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
