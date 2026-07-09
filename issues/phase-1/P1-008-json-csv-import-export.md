---
title: "[P1-008] JSON / CSV import export を実装する"
labels: "phase:1,type:infra,area:question-bank,priority:P1"
milestone: "Phase 1 - Question Bank MVP"
phase: "1"
priority: "priority:P1"
estimate: "2d"
---

# [P1-008] JSON / CSV import export を実装する

## Summary

問題データをバックアップし、外部編集できるように import/export を用意する。

## User Story

ユーザーとして、問題をファイルで一括追加・バックアップしたい。

## Requirements

- [ ] JSONL export を標準形式にする
- [ ] CSV import は MCQ の basic fields に限定する
- [x] import preview と validation error を表示する
- [x] 既存 ID の conflict policy を定義する

## Acceptance Criteria

- [ ] sample JSONL を export/import できる
- [ ] invalid row の error が行番号付きで出る
- [x] duplicate ID の扱いが明確である

## Subtasks

- [ ] export format を決める
- [x] import parser を作る
- [x] preview UI を作る
- [x] validation を作る

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
