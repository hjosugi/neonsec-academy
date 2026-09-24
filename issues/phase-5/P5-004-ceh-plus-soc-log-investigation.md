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

- [x] auth log, web access log, DNS log, endpoint alert, firewall log の synthetic dataset を使う
- [x] 課題は timeline, indicator, affected asset, next action を提出させる
- [x] CEH module と SOC skill tag を両方付ける
- [x] 解説は detection logic と containment idea を含める

## Acceptance Criteria

- [x] 最低 10 個の log investigation challenge 仕様がある
- [x] timeline builder と連携できる
- [x] wrong answers が review queue に入る

## Subtasks

- [x] log dataset format を作る
- [x] scenario を作る
- [x] timeline form を作る
- [x] review 連携を作る

## Dependencies

- None

## Safety / Abuse Prevention

実インシデントログや個人情報は含めない。教材用 synthetic logs だけを使う。

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

- `/tracks/soc` ships 10 synthetic log investigations (auth, web access, DNS, endpoint alert,
  firewall) with CEH module and SOC skill tags. Learners submit a timeline (built from selected log
  lines), indicator, affected asset, and next action; results explain detection logic and
  containment. Wrong answers enter the Review Queue. Verified with unit, type, content, safety, audit,
  and build checks.
