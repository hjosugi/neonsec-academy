---
title: "[P5-008] Security Interview Readiness Tracker を作る"
labels: "phase:5,type:feature,area:analytics,area:content,priority:P2"
milestone: "Phase 5 - CEH Plus Practical Track"
phase: "5"
priority: "priority:P2"
estimate: "2d"
---

# [P5-008] Security Interview Readiness Tracker を作る

## Summary

CEH と実践 track の成果を、面接で説明できる形に整理する。

## User Story

求職者として、自分が何を学び、何を実践し、どう説明するかを整理したい。

## Requirements

- [ ] skill evidence を STAR 形式または concise story に変換する
- [ ] concept, lab, report, reflection を紐付ける
- [ ] 弱点 module は honest gap と next plan として表示する
- [ ] 英語面接用の短い回答メモを保存できる

## Acceptance Criteria

- [ ] skill ごとに evidence が表示される
- [ ] 1〜2 分の説明メモを保存できる
- [ ] portfolio exporter と連携できる

## Subtasks

- [ ] skill evidence model を作る
- [ ] story template を作る
- [ ] tracker UI を作る
- [ ] portfolio 連携を作る

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
