<!-- i18n: language-switcher -->
[English](DATA_MODEL.md) | [日本語](DATA_MODEL.ja.md)

# データモデル

NeonSec Academyは、ユーザーデータをブラウザストレージにZustandストアを通じて保存します（`src/store/useStore.ts`）。シードコンテンツはバージョン管理されたソースファイルに保持されます。永続化されたJSONはcamelCaseのフィールド名を使用します。

## ERD概要

```text
Question 1 ── * Attempt
Question 1 ── 0..1 ReviewItem
Question 1 ── 0..1 MistakeNote
Question * ── 1 CEH Module / CEH+ Track
ConceptCard * ── 1 CEH Module
ConceptCard * ── * Question (derived by module + tag overlap)

ExamSession 1 ── * ExamAnswer
ExamResult 1 ── * DomainScore
ExamResult * ── * Question

LabChallenge 1 ── 1 FlagChallengeDefinition
LabChallenge 1 ── * FlagAttempt
LabChallenge 1 ── * FlagHintUse
LabChallenge 1 ── * EvidenceItem
LabChallenge 1 ── * Finding
Report 1 ── * Finding
Finding * ── * EvidenceItem (via evidenceIds)
```

## IDおよびタイムスタンプポリシー

| エンティティ | ID | タイムスタンプ |
|---|---|---|
| `Question` | 安定した`id`。シードIDは変更されず、インポート時のID衝突は再割り当てされる。 | ユーザー作成の問題は`createdAt`と`updatedAt`を保存。シードのタイムスタンプはgit履歴で表現。 |
| `ConceptCard` | 安定した`id`。シードのコンセプトカードは移行ノートなしで変更されない。 | ソースでバージョン管理。リンクはモジュール/タグの重複からランタイムで導出。 |
| `Choice` | 配列の位置と`Question`内の正確な選択肢テキスト。 | 問題のタイムスタンプを継承。 |
| `Explanation` | `Question`内に埋め込み。 | 問題のタイムスタンプを継承。 |
| `Attempt` | 安定した生成`id`。 | 不変の`at`タイムスタンプ。`updatedAt`なし（追加のみ）。 |
| `ReviewItem` | `questionId`。各問題に1つのアクティブなスケジュール。 | `lastReviewed`と`dueAt`で状態変化を追跡。 |
| `ReviewSessionSummary` | 安定した生成`id`。 | `createdAt`と`completedAt`。 |
| `MistakeNote` | `questionId`。各問題に1つのノート。 | `createdAt`と`updatedAt`。 |
| `PinNote` | `pinNotes`内の`questionId`キー。 | ノートテキスト変更時に更新。 |
| `ExamSession` | 安定した生成`id`。 | `createdAt`, `startedAt`, オプションで`endedAt`。 |
| `ExamResult` | 提出されたセッションの`sessionId`。 | `submittedAt`。 |
| `LabChallenge` | 静的なラボ`id`。 | ソースでバージョン管理。ラボ進捗はローカル状態。 |
| `FlagChallengeDefinition` | 1つの静的`LabChallenge`に埋め込み。 | ラボとともにソースでバージョン管理。 |
| `FlagAttempt` | 安定した生成`id`。`challengeId`は静的ラボを参照。 | 不変の`at`。進捗リセットまで追加のみ。 |
| `FlagHintUse` | 一意な`challengeId` + `hintIndex`ペア。 | 最も早い有効な`usedAt`を保持。 |
| `StaticLabArtifact` | 静的ラボ内の`evidenceTitle` + `evidence`。 | ソースでバージョン管理。 |
| `EvidenceItem` | 安定した生成`id`。`challengeId`でラボチャレンジにリンク。 | ユーザー選択の`timestamp`、`createdAt`、`updatedAt`。 |
| `Finding` | レポート内の安定した生成`id`、またはラボ内の静的モデルファインディング。 | レポートファインディングは親レポートのタイムスタンプを継承。 |
| `Report` | 安定した生成`id`。 | `createdAt`と`updatedAt`。 |

## Question

```json
{
  "id": "Q-CEH-002-001",
  "title": "Passive reconnaissance boundary",
  "type": "mcq",
  "module": 2,
  "track": null,
  "difficulty": "easy",
  "tags": ["recon", "passive"],
  "body": "Which activity stays inside passive reconnaissance?",
  "choices": ["Reading public DNS records", "Sending packets to the target"],
  "answer": "Reading public DNS records",
  "explanation": {
    "answer": "Reading public DNS records",
    "why": "Passive reconnaissance uses already-public information and avoids target interaction.",
    "trap": "Public reachability is not permission to probe.",
    "memory_phrase": "Passive observes. Active interacts."
  },
  "status": "active",
  "source": "seed"
}
```

ルール:

- `module`はCEHモジュールの場合`1`〜`20`。
- `module: 0`の場合、有効なCEH+ `track`が必要。
- `tags`はサブトピックやスキルタイプのヒントを持つ。
- `source`は`seed`または`user`。インポートパックは`user`に正規化される。
- 新規ユーザー作成問題では`title`必須。レガシーシード/インポート行ではオプション。
- ユーザー作成問題は`createdAt`と`updatedAt`を含める場合がある。

## ConceptCard

```json
{
  "id": "CC-CEH-20-01",
  "module": 20,
  "title": "Symmetric encryption",
  "tags": ["symmetric-encryption", "block-cipher"],
  "meaning": "Symmetric encryption uses the same secret key for encryption and decryption.",
  "whenUsed": "Use it for fast bulk data protection when key sharing is already solved.",
  "examTrap": "The hard part is key management, not the speed of the cipher.",
  "rememberPhrase": "One shared secret, fast protection."
}
```

コンセプトカードは`src/data/conceptCards.ts`のシードコンテンツです。各CEHモジュールには最低5枚のカードがあります。カードと問題のリンクは、同じモジュールとタグの重複からランタイムで導出されます。カード詳細ページは関連問題へのリンクを持ち、問題詳細ページは関連カードへリンクします。

## Attempt

```json
{
  "id": "a-7b2f",
  "questionId": "Q-CEH-002-001",
  "at": 1783630800000,
  "correct": false,
  "chosen": "Sending packets to the target",
  "mode": "practice",
  "timeMs": 42000,
  "confidence": 3
}
```

Attemptは追加のみです。訂正は履歴を編集するのではなく、後のAttemptを作成して行います。`chosen`は選択した回答ペイロードまたは自由記述の理由付け、`correct`は結果、`timeMs`は所要時間、`confidence`はオプションの1〜5自己評価、`reasoningGap`はモデル解説と照合後に記録されるオプションの比較ノートです。

## ReviewItem

```json
{
  "questionId": "Q-CEH-002-001",
  "ease": 2.3,
  "intervalDays": 1,
  "reps": 1,
  "lapses": 1,
  "dueAt": 1783717200000,
  "lastResult": "incorrect",
  "lastReviewed": 1783630800000,
  "confidence": 2,
  "suspended": false
}
```

ストアは`questionId`でキー付けされたマップでレビューアイテムを保持し、1つの問題に重複したアクティブなレビュー予定を防ぎます。`confidence`はスケジューラで使われた最新の1〜5自己評価を記録します。低い自信は次の間隔を短くし、高い自信は間隔を長くできます。

## ReviewSessionSummary

```json
{
  "id": "rs-abc123",
  "createdAt": 1783630800000,
  "completedAt": 1783631400000,
  "questionIds": ["Q-CEH-002-001"],
  "total": 10,
  "correct": 8,
  "accuracyPct": 80,
  "timeMs": 600000,
  "newMistakes": 2,
  "masteredItems": 8,
  "reasoningGaps": 1,
  "weakModules": [{ "module": 2, "moduleName": "Footprinting and Reconnaissance", "missed": 2 }],
  "incompleteMistakeNotes": 2,
  "nextActions": ["Complete 2 Mistake Notebook notes."]
}
```

レビューサマリーは最近のセッション履歴の追加のみスナップショットです。アプリは最新30件のサマリーをローカルストレージに保持します。

## MistakeNote

```json
{
  "questionId": "Q-CEH-002-001",
  "whyWrong": "I treated public information as authorization.",
  "correctReasoning": "Passive collection avoids target interaction.",
  "trapPattern": "scope confusion",
  "reasoningGap": "I identified the source but did not state the authorization boundary.",
  "memoryPhrase": "Scope before action.",
  "nextAction": "Drill Module 2 passive vs active questions.",
  "resolved": false,
  "createdAt": 1783630800000,
  "updatedAt": 1783630800000
}
```

## ExamSession

```json
{
  "id": "ex-8e91",
  "createdAt": 1783630800000,
  "preset": "full",
  "presetLabel": "Full Exam",
  "seed": 123456789,
  "questionIds": ["Q-CEH-001-001"],
  "choiceOrder": {
    "Q-CEH-001-001": ["Only approved targets", "Any internet host"]
  },
  "answers": {
    "Q-CEH-001-001": { "chosen": "Only approved targets", "flagged": false, "confidence": 4, "timeMs": 65000 }
  },
  "durationSec": 14400,
  "startedAt": 1783630800000,
  "endedAt": null,
  "currentIndex": 0,
  "status": "in-progress"
}
```

試験プリセットIDは文字列で、組み込みとユーザー保存の重み付きプリセットが同じランナーと結果モデルを共有できます。重み付きプリセットは編集可能な`moduleCounts`をローカルブラウザストレージ`neonsec:exam-weight-presets:v1`に保存します。生成された試験は選択された問題ID、シード、シャッフルされた選択肢順、プリセットラベルをセッション/結果に永続化します。

## DrillResult

```json
{
  "id": "drill-8e91",
  "createdAt": 1783630800000,
  "completedAt": 1783631400000,
  "filters": {
    "source": "module",
    "module": 20,
    "tag": "cryptography",
    "type": "mcq",
    "difficulty": "hard",
    "requestedCount": 10
  },
  "questionIds": ["Q-CEH-020-001"],
  "total": 10,
  "correct": 8,
  "accuracyPct": 80
}
```

ドリル結果は最近の弱モジュールドリルのフィルタスナップショットとスコアを保存します。個別の回答も`Attempt`行として`mode: "drill"`で記録されるため、レビューキューのスケジューリングや分析モジュールの習熟度が各回答後すぐに更新されます。

## ExamResult

```json
{
  "sessionId": "ex-8e91",
  "preset": "full",
  "presetLabel": "Full Exam",
  "submittedAt": 1783634400000,
  "seed": 123456789,
  "total": 125,
  "answered": 123,
  "correct": 95,
  "scorePct": 76,
  "passMark": 85,
  "passed": false,
  "perDomain": [{ "domainId": "recon", "domainName": "Recon", "total": 20, "correct": 16, "pct": 80 }],
  "perModule": [{ "module": 2, "moduleName": "Footprinting and Reconnaissance", "total": 8, "correct": 7, "pct": 87.5 }],
  "flagged": { "Q-CEH-002-001": true },
  "flaggedTotal": 6,
  "flaggedCorrect": 3,
  "choiceOrder": {
    "Q-CEH-002-001": ["Sending packets to the target", "Reading public DNS records"]
  },
  "reviewMeta": {
    "Q-CEH-002-001": { "flagged": true, "confidence": 2, "timeMs": 120000 }
  },
  "timeUsedSec": 13200,
  "durationSec": 14400,
  "questionIds": ["Q-CEH-002-001"],
  "answers": { "Q-CEH-002-001": "Reading public DNS records" }
}
```

`seed`は問題選択を再現可能にし、`choiceOrder`はランダム化された回答表示順を結果レビュー用に保持します。試験回答にはオプションで`confidence`や`timeMs`を含めることができ、提出時に`reviewMeta`へコピーされるため、試験レビューで低自信や遅い問題をフィルタできます。`perModule`, `flagged`, `flaggedTotal`, `flaggedCorrect`は試験レポートのモジュール別内訳、フラグ付き正答率、安全マージン、Markdownエクスポートに利用されます。これらのフィールドがない古い保存結果は、表示時に`questionIds`, `answers`, ローカル問題カタログから再計算されます。

## 設定

準備度閾値は他のローカル設定とともに永続化されます:

```json
{
  "coverageThresholdPct": 80,
  "readinessRequiredMocks": 3,
  "readinessMaxDueBacklog": 0,
  "readinessWeakModuleMasteryPct": 70,
  "readinessMaxWeakModules": 0
}
```

`examTargetPct`は学習者の個人的な模擬スコア目標のためプロフィールの一部です。

## LabChallenge

```json
{
  "id": "soc-bruteforce",
  "title": "SOC Triage: Suspicious Logins",
  "category": "SOC",
  "kind": "dataset",
  "difficulty": "easy",
  "scope": {
    "allowed": ["The provided synthetic log", "Local note-taking and the report builder"],
    "forbidden": ["Any real host or account", "Any external lookup", "Generating traffic"]
  },
  "evidenceTitle": "auth.log (synthetic)",
  "flagChallenge": {
    "prompt": "Classify the prepared authentication pattern and submit a flag.",
    "assets": [
      {
        "id": "auth-log",
        "label": "auth.log (synthetic)",
        "kind": "log",
        "description": "Prepared authentication events for fictional users."
      }
    ],
    "expectedFlag": "FLAG{PASSWORD_SPRAY}",
    "hints": ["Count distinct usernames targeted by one source."],
    "explanation": "One source tests a small number of guesses across many users.",
    "remediation": "Enforce MFA and alert on one-source-to-many-user failure velocity.",
    "reportPrompt": "Cite the failure sequence and successful non-MFA login."
  },
  "objectives": ["Classify the activity", "Identify the pivot event"],
  "rubric": { "challengeType": "soc-triage", "passingScore": 80 }
}
```

ラボの種類は`local`, `dataset`, `simulated`, `writeup`です。すべてのラボは証拠が表示される前に許可・禁止範囲を宣言する必要があります。`validateLabRegistry`はラボスキーマと安全でないメタデータ、完全かつ一意なFlag Challenge定義をチェックします。アセット種類は`log`, `config`, `request-response`, `capture`, `headers`, `architecture`で、すべてのアセットはアプリ内で既に提供されている静的メタデータです。期待されるフラグは`FLAG{UPPER_SNAKE_CASE}`形式です。これは静的クライアントに搭載されたローカルトレーニング回答であり、秘密や認証値ではありません。

`npm run validate:safety`はリリースコンテンツをパブリックIP、実メールドメイン、認証情報らしき値、ライブドメイン、秘密鍵、アクセストークン、実行可能なコマンドレシピについてスキャンします。CIは公開前に安全性スキャンを実行します。

## FlagAttemptとFlagHintUse

```json
{
  "flagAttempts": [
    {
      "id": "fa-92ab",
      "challengeId": "soc-bruteforce",
      "submitted": "FLAG{PASSWORD_SPRAY}",
      "correct": true,
      "hintCount": 1,
      "at": 1783692000000
    }
  ],
  "flagHintUses": [
    {
      "challengeId": "soc-bruteforce",
      "hintIndex": 0,
      "usedAt": 1783691900000
    }
  ]
}
```

160文字までの印字可能な非空提出は追加のみのAttemptとなります。比較は外側の空白をトリムし、大文字小文字を区別しません。チャレンジで正答Attemptが受理されると、追加提出や新しいヒント表示はロックされます。各ヒントインデックスは1回のみ記録され、使用ヒント数はAttemptにスナップショットされます。

フルバックアップインポートやブラウザ復元は、不正なタイムスタンプ、制御文字、不明なチャレンジID、範囲外ヒントを拒否します。保存された`correct`値は信頼されず、正誤は現在の静的チャレンジ定義から再計算されます。フラグ分析は、Attempted、Solved、First-try、Incorrect-attempt、Accuracy、Hint数をこれらの正規化行から導出します。生提出やヒント履歴は非公開であり、パブリック安全なMarkdownエクスポートには含まれません。

## EvidenceItem

```json
{
  "id": "ev-8e91",
  "challengeId": "soc-bruteforce",
  "title": "Synthetic authentication sequence",
  "type": "log",
  "note": "The prepared log shows repeated failures before one successful event.",
  "source": "auth.log (synthetic)",
  "reference": "artifacts/auth-log.txt",
  "timestamp": 1783630800000,
  "createdAt": 1783630800000,
  "updatedAt": 1783630800000
}
```

証拠タイプは`observation`, `log`, `screenshot`, `file`, `note`です。各アイテムは`challengeId`で1つのラボチャレンジに属します。グローバル`/evidence`ビューはそのキーでレコードをグループ化します。`reference`はローカルファイルパス、スクリーンショット名、その他アップロードされない参照を保存します—アプリは参照ファイルを読み込んだりアップロードしたりしません。証拠はプライベートローカルデータであり、フルバックアップJSONには含まれますが、パブリック安全な進捗エクスポートには除外されます。不正なバックアップやブラウザ永続行はインポートや復元時に破棄されます。既存アイテムの`challengeId`は不変であり、編集で証拠が別チャレンジに移動することはありません。アイテム削除時はレポートファインディングからそのIDも削除され、保存リンクが宙に浮くことを防ぎます。

ラボエディタは、認証情報、個人/顧客データ、本番ログ、システム秘密を保存しないよう警告を常時表示します。合成または意図的に準備されたトレーニング素材のみ許可されます。

## Report

```json
{
  "id": "r-44df",
  "challengeId": "cloud-iam",
  "title": "Synthetic IAM Review",
  "scope": "Provided synthetic config only.",
  "summary": "One over-privileged role needs remediation.",
  "findings": [
    {
      "id": "f-1",
      "title": "Wildcard administrative permission",
      "severity": "high",
      "impact": "The fictional role could modify unrelated synthetic resources.",
      "remediation": "Replace wildcard permissions with least-privilege actions.",
      "evidence": "Synthetic policy statement allows action '*' on resource '*'.",
      "evidenceIds": ["ev-8e91"]
    }
  ],
  "createdAt": 1783630800000,
  "updatedAt": 1783630800000
}
```

レポートは安全な実践作業の持ち運び可能な記録です。`challengeId`はレガシーや単独レポートではオプションです。ファインディングは後方互換のため自由記述の`evidence`ノートを保持し、Vaultリンクをオプションの`evidenceIds`に保存します。Markdownエクスポート時はそのIDを引用として解決します。保存・インポート・ブラウザ復元時、リンクIDは重複排除され、欠損IDは削除されます。チャレンジ連携レポートは同じ`challengeId`の証拠のみ引用でき、単独レポートは複数チャレンジのレコードを引用可能です。レポートは合成証拠のみ引用しなければなりません。

## 削除・アーカイブ・復元

| データ | 削除動作 | 復元動作 |
|---|---|---|
| シード問題 | ユーザーストレージで完全削除されず、`archivedIds`にID追加でアーカイブ。 | `archivedIds`からIDを削除。 |
| ユーザー問題 | シード同様アーカイブ可能、または`userQuestions`から明示的削除。 | アーカイブ済みユーザー問題は復元可能。完全削除の場合は再インポートまたは再作成が必要。 |
| Attemptとレビュー | `resetProgress`で学習進捗としてクリア。 | フルバックアップインポートで復元。 |
| フラグAttemptとヒント | `resetProgress`で解決状態、履歴、記録ヒントをクリア。 | プライベートフルバックアップインポートで復元。 |
| レビューサマリー | `resetProgress`で保存サマリーをクリア。 | フルバックアップインポートで復元。 |
| ミスノート | 解決または削除可能。 | フルバックアップインポートで復元。 |
| ブックマークとピンノート | ブックマークは問題ごとに切替。ピンノート空白化でノート削除。 | フルバックアップインポートで復元。 |
| Evidence Vault | アイテム削除時、リンクされたレポートファインディングからIDも削除。 | プライベートフルバックアップインポートで復元。 |
| レポート | 削除可能。 | フルバックアップインポートまたはMarkdownコピーで復元。 |

## インデックス・検索キー

| 用途 | キー |
|---|---|
| 問題検索 | `question.id`マップ |
| モジュール・ドメイン分析 | `question.module`, 派生`domain`, `district` |
| CEH+フィルタ | `question.track`（`module`が`0`の場合） |
| 全文検索 | 小文字化した`title`, `body`, `tags`, `moduleName` |
| CEHカバレッジマトリクス | `module`, `total`, `seen`, `attempts`, `accuracy`, `dueCount`, カバレッジ目標、最小モジュール在庫設定 |
| 問題バンクフィルタ | `module`, `domain`, `difficulty`, `type`, アクティブ/アーカイブ状態, 選択タグ, ブックマーク状態, ピンノート, 最終Attempt結果 |
| レビューキュー | `reviews[questionId]`, `dueAt`, `confidence`, `suspended` |
| レビューサマリー | `reviewSummaries`, `completedAt`, 正答率, 弱モジュール, 次アクション |
| Attempt履歴 | `questionId`, `at`, `mode`, `chosen`, `correct`, `timeMs`, `confidence`, `reasoningGap` |
| フラグチャレンジ分析 | `flagAttempts[].challengeId`, `correct`, `at`, `hintCount`, 一意な`flagHintUses`インデックス |
| ミスノートブック | `mistakes[questionId]`, 解決状態, `updatedAt`, 問題モジュール, 問題タグ |
| ピンノート | `pinNotes[questionId]`, 対応ブックマークでピンビュー使用 |
| Evidence Vault | `evidenceItems[].id`, `challengeId`でグループ化、`timestamp`でソート |
| レポート | `report.id`, `updatedAt`, ファインディング重大度 |

## インポート・エクスポートスキーマ

- フルバックアップエクスポートは`version`, `exportedAt`, プロフィール, 設定, Attempt, レビュー, レビューサマリー, ミスノート, ブックマーク, ピンノート, アーカイブID, ユーザー問題, 試験結果, フラグAttempt, フラグヒント使用, Evidence Vaultアイテム, レポートを含む。
- 問題パックエクスポートは`format: "neonsec-question-pack"`と`version: 1`を使用。
- シード検証は`npm run validate:content`で実行。
- 問題パックインポートは`src/lib/questionPacks.ts`の同じコア検証ルールを再利用。

## マイグレーションポリシー

永続化されたアプリ状態は`version: 1`を持ちます。後方互換の追加はインポート時にオプションフィールドとデフォルトを使うべきです。破壊的な形状変更はストアスキーマバージョンを増やし、リリース前にZustand`persist`設定でマイグレーションを追加する必要があります。