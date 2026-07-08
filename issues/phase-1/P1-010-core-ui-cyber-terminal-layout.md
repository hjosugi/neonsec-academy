---
title: "[P1-010] Core UI Layout を cyber terminal 風に実装する"
labels: "phase:1,type:design,type:feature,area:design,priority:P0"
milestone: "Phase 1 - Question Bank MVP"
phase: "1"
priority: "priority:P0"
estimate: "2d"
---

# [P1-010] Core UI Layout を cyber terminal 風に実装する

## Summary

Dashboard / Question Bank / Review / Exam / Labs へ行ける基本 UI を作る。

## User Story

ユーザーとして、cyberpunk 感のある画面でありながら、問題管理にすぐアクセスしたい。

## Requirements

- [ ] left nav, top status bar, main console panel の 3 領域を作る
- [ ] neon glow は active state と progress indicator に限定する
- [ ] Dashboard に Today Review, Weak Areas, Mock Exam CTA を置く
- [ ] キーボード操作で主要画面へ移動できる設計にする

## Acceptance Criteria

- [ ] 5 つの主要画面へ遷移できる
- [ ] 空データ時の dashboard が表示される
- [ ] design tokens が使われている

## Subtasks

- [ ] layout shell を作る
- [ ] nav を作る
- [ ] status bar を作る
- [ ] dashboard placeholder を作る

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
