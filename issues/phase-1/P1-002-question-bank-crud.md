---
title: "[P1-002] Question Bank CRUD を実装する"
labels: "phase:1,type:feature,area:question-bank,priority:P0"
milestone: "Phase 1 - Question Bank MVP"
phase: "1"
priority: "priority:P0"
estimate: "3d"
---

# [P1-002] Question Bank CRUD を実装する

## Summary

CEH 問題を作成・閲覧・編集・アーカイブできる最小機能を作る。

## User Story

ユーザーとして、自分の問題を登録して復習対象にできるようにしたい。

## Requirements

- [ ] Question title, body, choices, answer, explanation, module, tags, difficulty を保存できる
- [ ] 削除は hard delete ではなく archive にする
- [ ] 問題 ID は永続的に変わらない
- [ ] 入力 validation と preview を用意する

## Acceptance Criteria

- [ ] 新規問題を作成できる
- [ ] 作成した問題を編集できる
- [ ] archive した問題は通常一覧から消える
- [ ] invalid question は保存できない

## Subtasks

- [ ] form を作る
- [ ] list/detail を作る
- [ ] edit/archive を作る
- [ ] validation を作る

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
