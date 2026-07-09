---
title: "[P2-010] Keyboard shortcut と reduced motion を実装する"
labels: "phase:2,type:design,type:quality,area:design,priority:P1"
milestone: "Phase 2 - Review System"
phase: "2"
priority: "priority:P1"
estimate: "2d"
---

# [P2-010] Keyboard shortcut と reduced motion を実装する

## Summary

長時間の復習を効率化し、cyberpunk 演出が負担にならないようにする。

## User Story

ユーザーとして、マウスを多用せず、疲れにくい状態で復習したい。

## Requirements

- [ ] Review で 1/2/3/4, Enter, Next, Bookmark を keyboard で操作できる
- [x] Command palette を呼び出せる shortcut を定義する
- [x] reduced motion setting で animation を無効化する
- [x] focus ring は neon だが視認性を優先する

## Acceptance Criteria

- [ ] 主要操作が keyboard だけで完了できる
- [x] reduced motion on で animation が止まる
- [x] focus state が見える

## Subtasks

- [ ] shortcut map を作る
- [x] review runner に追加する
- [x] settings を作る
- [x] accessibility QA を行う

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
