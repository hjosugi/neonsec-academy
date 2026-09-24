<!-- i18n: language-switcher -->
[English](LAB_PACK_FORMAT.md) | [日本語](LAB_PACK_FORMAT.ja.md)

# ラボパック形式

**ラボパック**は CEH+ の実践ラボをまとめたもので、作成者は `src/data/labs.ts` を編集せずに新しいチャレンジ
セットを追加できます。パックはローカルの JSON ファイルで、アプリにパックレジストリ・アップロード・ネットワーク
取得はありません。第三者のパックは**決して信頼しません**。インポートのたびにマニフェストを再検証し、ラボ安全監査を
ローカルで再実行します。

- スキーマ: [`docs/schemas/lab-pack.schema.json`](schemas/lab-pack.schema.json)
- サンプルパック: [`seed_content/lab-packs/neon-starter-pack.json`](../seed_content/lab-packs/neon-starter-pack.json)
- インポートプレビュー: セーフラボ → **Lab pack import**（`/labs/packs`）
- 実装: `src/lib/labPacks.ts`

## 構造

```text
neon-starter-pack.json
├── マニフェスト項目     format, formatVersion, id, name, version, minAppVersion, author, license, description, tags
├── labs[]               チャレンジファイル: 完全なラボ定義（scope, evidence, flagChallenge, rubric, …）
│   ├── evidence         行番号付きビューアに表示する合成アセットのテキスト
│   ├── flagChallenge    プロンプト、アセットメタデータ、期待フラグ、ヒント、解説、修正、レポートプロンプト
│   └── safetyAudit      ラボごとの監査記録（status は "pass" 必須）
└── safetyAudit          パック全体の監査サマリー: rulesetVersion, auditedAt, ラボごとの results[]
```

### マニフェスト

| フィールド | ルール |
|---|---|
| `format` | 常に `neonsec-lab-pack`。 |
| `formatVersion` | 整数の形式バージョン。アプリは `1` を受け付けます。 |
| `id` | パックを識別する小文字スラッグ（3〜49 文字）。 |
| `name`, `author`, `license`, `description` | 必須の空でない文字列。author はハンドルやチーム名で、個人メールは不可。 |
| `version` | パックの semver（`MAJOR.MINOR.PATCH`）。 |
| `minAppVersion` | パックをインポートできる最古の NeonSec Academy バージョン（semver）。 |
| `tags` | 任意の検索タグ。 |

### チャレンジファイル（`labs[]`）

各要素は `src/data/labs.ts` と同じスキーマの完全なラボです（[CONTENT_GUIDE.ja.md](CONTENT_GUIDE.ja.md) 参照）:
`id`、`title`、`category`、`kind`、`difficulty`、`brief`、`scope`、`evidenceTitle`、`evidence`、`flagChallenge`、
`objectives`、`rubric`、`guiding`、`modelFindings`、任意の `analysis` / `webConcept`、ラボごとの `safetyAudit`
記録。ラボ ID は出荷済みラボと重複してはならず、期待フラグは一意である必要があります。

### アセット

アセットは `evidence` の合成アーティファクトテキストと、それを説明する `flagChallenge.assets[]` のメタデータ
（`log`、`config`、`request-response`、`capture`、`headers`、`architecture`）です。バイナリ、リモート URL、実行
ファイル、アーカイブは形式に含まれません。

### 安全監査の結果

`safetyAudit` は作成者の監査結果（`rulesetVersion`、`auditedAt`、ラボごとの `{ labId, status, blockers, warnings }`）
を記録します。これは参考情報にすぎず、インポーターはアプリの現行ルールで再監査し、ローカルで不合格のラボを拒否し、
主張された `pass` がローカル監査と一致しないパックを指摘します。

## バージョニングと互換性

- **形式バージョン**: マニフェストの破壊的変更で `formatVersion` を上げます。インポーターは未知のバージョンを
  推測せず拒否します。
- **パックバージョン**: 作成者は semver で `version` を上げます — 内容修正はパッチ、新ラボはマイナー、ラボの削除や
  改名はメジャー（ID はローカル進捗の安定した識別子）。
- **アプリ互換性**: `minAppVersion` は実行中のアプリバージョン（インポート画面に表示）以下である必要があり、
  古いアプリは新しいパックを拒否します。
- **監査ルールセット**: 別の `rulesetVersion` で監査されたパックは警告のうえ現行ルールで再監査し、ローカル結果
  のみを採用します。
- **再インストール**: インストール済みの `id` を持つパックをインポートすると置き換えます。

## インポートパイプライン

1. JSON を解析（最大 512 KB）し、`format`、`formatVersion`、必須マニフェスト項目、semver を確認。
2. `minAppVersion` との互換性を確認。
3. すべてのラボについてパック全体の `safetyAudit` の結果を必須とする。
4. 手動 `override` 記録を拒否: パック作成者は自分のコンテンツを事前承認できない。
5. 出荷済みラボと重複するラボ ID を拒否。
6. すべてのラボにラボ安全監査の公開ゲート（禁止ターゲット/行為、公開 IP、実在ドメイン/メール、資格情報、
   実在マルウェアへの言及、ツールコマンド、ペイロード）を実行。
7. ラボレジストリのスキーマ検証（スコープ、証拠、フラグチャレンジ、分析/Web メタデータ、監査記録）を実行。
8. プレビュー（マニフェスト、互換性、安全な代替案付きのラボごとの監査所見）を表示。エラーが 0 件のときのみ
   **Import** が有効になります。

インストールしたパックはローカルに保存され、フルバックアップに含まれ、バックアップのインポートやブラウザでの
復元のたびに再検証・再監査され、不合格のパックは削除されます。このバージョンではインストール済みパックのラボは
インポート画面にプレビューとして一覧表示され、プレイ可能なセーフラボ一覧にはまだ表示されません。

## 作成チェックリスト

- [ ] すべてのアーティファクトが合成: 架空の組織、`.example` / `.internal` / `.test` / `.invalid` / `.localhost`
  のホスト、ドキュメント用またはプライベート IP、プレースホルダーの秘密情報。
- [ ] ペイロード、ツールコマンド、マルウェア名、実 URL を含まない。
- [ ] 各ラボにスコープ契約、フラグチャレンジ、ルーブリック、レポートに使えるモデル所見がある。
- [ ] 下書きを **Lab Safety Audit**（`/labs/audit`）で監査し、各ラボに `pass` 記録を保存する。
- [ ] パック全体の `safetyAudit.results` を埋め、テストしたバージョンを `minAppVersion` に設定する。
- [ ] 共有前に `/labs/packs` でプレビューし「safe to import」を確認する。
