---
title: "[P6-001] Cyberpunk Visual Theme を本実装する"
labels: "phase:6,type:design,area:design,priority:P0"
milestone: "Phase 6 - Cyberpunk Polish and Launch"
phase: "6"
priority: "priority:P0"
estimate: "4d"
---

# [P6-001] Cyberpunk Visual Theme を本実装する

## Summary

Phase 0 の design system を使い、NeonSec らしい cyberpunk UI に仕上げる。

## User Story

ユーザーとして、問題管理アプリとして使いやすく、同時に neon hacker terminal の雰囲気を感じたい。

## Requirements

- [ ] color tokens, glow, grid background, panel border, status lights を実装する
- [ ] Question / Review / Exam の可読性を最優先にする
- [ ] glow intensity setting を持つ
- [ ] design regression checklist を作る

## Acceptance Criteria

- [ ] 主要画面が design system と一致する
- [ ] low glow mode が動く
- [ ] 長文問題の可読性が保たれる

## Subtasks

- [ ] theme tokens を適用する
- [ ] panel style を作る
- [ ] status light を作る
- [ ] visual QA を行う

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
