---
title: "[P1-001] アプリケーションの土台と開発ルールを作る"
labels: "phase:1,type:infra,priority:P0"
milestone: "Phase 1 - Question Bank MVP"
phase: "1"
priority: "priority:P0"
estimate: "2d"
---

# [P1-001] アプリケーションの土台と開発ルールを作る

## Summary

MVP 開発を始めるため、ディレクトリ構成、設定、lint/test 方針、サンプルデータを用意する。

## User Story

開発者として、機能追加前に迷わないプロジェクト構成を持ちたい。

## Requirements

- [ ] src, docs, content, tests, scripts の責務を分ける
- [ ] 環境変数や secret を使わない初期構成にする
- [ ] seed data をローカルで読み込めるようにする
- [ ] 安全ポリシー文書をトップから参照する

## Acceptance Criteria

- [ ] 新規 clone 後に README の手順で起動できる
- [ ] sample questions が表示できる
- [ ] test command の入口がある

## Subtasks

- [ ] ディレクトリ構成を作る
- [ ] README 起動手順を書く
- [ ] seed data loader の placeholder を作る
- [ ] basic test を追加する

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
