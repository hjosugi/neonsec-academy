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

- [ ] sound は default off にする
- [ ] motion は reduced motion setting を尊重する
- [ ] glitch effect は短く、問題文には使わない
- [ ] settings から all effects off ができる

## Acceptance Criteria

- [ ] effect settings が保存される
- [ ] 問題文に animation がかからない
- [ ] reduced motion on で演出が止まる

## Subtasks

- [ ] settings fields を作る
- [ ] effect gates を作る
- [ ] sound policy を作る
- [ ] QA を行う

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
