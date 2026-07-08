---
title: "[P5-004] CEH+ SOC Log Investigation Track を作る"
labels: "phase:5,type:content,area:lab,area:content,priority:P0"
milestone: "Phase 5 - CEH Plus Practical Track"
phase: "5"
priority: "priority:P0"
estimate: "4d"
---

# [P5-004] CEH+ SOC Log Investigation Track を作る

## Summary

攻撃実行ではなく、ログから兆候を読み取る blue-team 実践課題を作る。

## User Story

実践者として、ログを読んで何が起きたかを説明できるようになりたい。

## Requirements

- [ ] auth log, web access log, DNS log, endpoint alert, firewall log の synthetic dataset を使う
- [ ] 課題は timeline, indicator, affected asset, next action を提出させる
- [ ] CEH module と SOC skill tag を両方付ける
- [ ] 解説は detection logic と containment idea を含める

## Acceptance Criteria

- [ ] 最低 10 個の log investigation challenge 仕様がある
- [ ] timeline builder と連携できる
- [ ] wrong answers が review queue に入る

## Subtasks

- [ ] log dataset format を作る
- [ ] scenario を作る
- [ ] timeline form を作る
- [ ] review 連携を作る

## Dependencies

- None

## Safety / Abuse Prevention

実インシデントログや個人情報は含めない。教材用 synthetic logs だけを使う。

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
