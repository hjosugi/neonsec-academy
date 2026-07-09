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

- [x] mobile では Review Queue と Mistake Notebook を優先する
- [x] Mock exam は desktop 推奨として warning を出す
- [x] long table は card layout に変える
- [x] touch target を十分に大きくする

## Acceptance Criteria

- [x] mobile width で review session が完了できる
- [x] dashboard が横スクロールなしで見える
- [x] mock exam desktop warning が出る

## Subtasks

- [x] responsive breakpoints を確認する
- [x] mobile review UI を作る
- [x] table fallback を作る
- [x] manual QA を行う

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
