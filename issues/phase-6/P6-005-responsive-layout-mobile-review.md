---
title: "[P6-005] Responsive Layout / Mobile Review を仕上げる"
labels: "phase:6,type:design,type:quality,area:design,area:review,priority:P1"
milestone: "Phase 6 - Cyberpunk Polish and Launch"
phase: "6"
priority: "priority:P1"
estimate: "3d"
---

# [P6-005] Responsive Layout / Mobile Review を仕上げる

## Summary

スマホや小さい画面でも復習と問題確認ができるようにする。

## User Story

ユーザーとして、移動中にも短い復習だけできるようにしたい。

## Requirements

- [ ] mobile では Review Queue と Mistake Notebook を優先する
- [ ] Mock exam は desktop 推奨として warning を出す
- [ ] long table は card layout に変える
- [ ] touch target を十分に大きくする

## Acceptance Criteria

- [ ] mobile width で review session が完了できる
- [ ] dashboard が横スクロールなしで見える
- [ ] mock exam desktop warning が出る

## Subtasks

- [ ] responsive breakpoints を確認する
- [ ] mobile review UI を作る
- [ ] table fallback を作る
- [ ] manual QA を行う

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
