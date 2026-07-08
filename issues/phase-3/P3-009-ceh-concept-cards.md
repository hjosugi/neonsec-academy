---
title: "[P3-009] CEH Concept Cards を作る"
labels: "phase:3,type:content,area:content,area:review,priority:P1"
milestone: "Phase 3 - CEH Exam Mode"
phase: "3"
priority: "priority:P1"
estimate: "3d"
---

# [P3-009] CEH Concept Cards を作る

## Summary

問題の周辺知識を 1 枚カードで復習できるようにする。

## User Story

受験者として、問題を解く前後に短い要点カードで理解を補強したい。

## Requirements

- [ ] 各 module に minimum 5 concept cards を用意する
- [ ] cards は meaning, when used, exam trap, remember phrase を含める
- [ ] 危険な tool 手順ではなく、概念・判断・防御観点に寄せる
- [ ] cards を問題と相互リンクする

## Acceptance Criteria

- [ ] 最低 100 枚の card 仕様が用意される
- [ ] question detail から関連 card を見られる
- [ ] card から関連 questions に行ける

## Subtasks

- [ ] card schema を作る
- [ ] card samples を作る
- [ ] question link を作る
- [ ] card viewer を作る

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
