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

- [x] skill evidence を STAR 形式または concise story に変換する
- [x] concept, lab, report, reflection を紐付ける
- [x] 弱点 module は honest gap と next plan として表示する
- [x] 英語面接用の短い回答メモを保存できる

## Acceptance Criteria

- [x] skill ごとに evidence が表示される
- [x] 1〜2 分の説明メモを保存できる
- [x] portfolio exporter と連携できる

## Subtasks

- [x] skill evidence model を作る
- [x] story template を作る
- [x] tracker UI を作る
- [x] portfolio 連携を作る

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

- `/interview` shows evidence per skill (concepts, labs, reports, track challenges), turns weak areas
  into honest gaps with next plans, and saves STAR/concise stories with English answer memos and a
  speaking-time estimate. Stories flow into the Portfolio exporter. Verified with unit, type, content,
  safety, audit, and build checks.
