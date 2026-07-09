---
title: "[P0-001] プロダクトビジョン・対象ユーザー・非ゴールを確定する"
labels: "phase:0,type:epic,area:content,area:safety,priority:P0"
milestone: "Phase 0 - Foundation"
phase: "0"
priority: "priority:P0"
estimate: "1d"
---

# [P0-001] プロダクトビジョン・対象ユーザー・非ゴールを確定する

## Summary

NeonSec Academy を『CEH 問題管理・復習管理・安全な実践記録』のためのプロダクトとして定義する。

## User Story

CEH 受験者として、何を作るか・何を作らないかを最初に固定し、学習と実践の方向性で迷わないようにしたい。

## Requirements

- [x] 主目的を CEH 知識試験の合格、CEH Practical への準備、CEH 後の実践基礎に分ける
- [x] ゲーム要素は補助に限定し、問題管理・復習管理・実践記録を中心にする
- [x] 対象ユーザー、利用シーン、成功指標、非ゴールを 1 ページでまとめる
- [x] cyberpunk 感は UI/世界観/コピーに残し、学習効率を邪魔しない方針にする

## Acceptance Criteria

- [x] README の冒頭に product promise が 3 行以内で書かれている
- [x] MVP に入れる機能と入れない機能が明確になっている
- [x] 安全境界と非ゴールがトップレベル文書から参照できる

## Subtasks

- [x] product statement を作る
- [x] primary persona と secondary persona を書く
- [x] success metrics を定義する
- [x] non-goals を書く

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

- 推奨 product promise: Manage questions. Review mistakes. Prove practical skill safely.
- Completed in `docs/PRODUCT_SCOPE.md` and linked from `README.md`.
