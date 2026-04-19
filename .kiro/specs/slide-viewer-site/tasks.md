# 実装計画: slides.kawaaaas スライド閲覧サイト

## 概要

Vite + Reactフロントエンド、Lambda Function URL API、DynamoDB、S3 + CloudFrontホスティングをAWS CDKで構築するスライド閲覧サイトの実装計画。CDK Pipelineによる自動デプロイを含む。

## タスク

- [x] 1. プロジェクト構造のセットアップ
  - [x] 1.1 ルートpackage.jsonとワークスペース構成を作成する
    - ルートにpackage.jsonを作成し、`website`、`infra`のワークスペースを定義する
    - TypeScript、ESLint、Oxfmtの共通設定を行う
    - _Requirements: 8.1, 10.1, 10.2_

  - [x] 1.2 ESLint設定ファイルを作成する
    - ルートに`eslint.config.mjs`を作成する
    - eslint-cdk-pluginを含むESLint設定を定義する
    - _Requirements: 10.2_

  - [x] 1.3 フロントエンドプロジェクト（website/）を初期化する
    - Vite + React + TypeScriptのプロジェクトを`website/`に作成する
    - `vite.config.ts`でAPI プロキシ設定（開発用）を含める
    - `package.json`に必要な依存関係（react, react-dom, react-router-dom, react-pdf, react-helmet-async）を追加する
    - _Requirements: 8.1_

  - [x] 1.4 CDKプロジェクト（infra/）を初期化する
    - `infra/`にCDKプロジェクトを作成する
    - `cdk.json`、`package.json`、`tsconfig.json`を設定する
    - aws-cdk-lib、constructs等の依存関係を追加する
    - _Requirements: 6.1, 6.2, 8.1_

  - [x] 1.5 Lambda関数ディレクトリ（lambda/）を作成する
    - `lambda/api/`と`lambda/ogp/`ディレクトリを作成する
    - Lambda用のtsconfig.jsonを設定する
    - _Requirements: 8.1_

  - [x] 1.6 スライドアセットディレクトリ（slides/）とメタデータ定義を作成する
    - `slides/`ディレクトリを作成する
    - `slides/metadata.ts`にSlideMetadataインターフェースとサンプルデータを定義する
    - _Requirements: 8.1, 8.2_

- [x] 2. チェックポイント - プロジェクト構造の確認
  - 全ディレクトリ構造が正しく作成されていることを確認する。依存関係のインストールが成功することを確認する。問題があればユーザーに質問する。

- [x] 3. 共通型定義とAPI クライアントの実装
  - [x] 3.1 フロントエンド用の型定義を作成する
    - `website/src/types/slide.ts`にSlideMetadata型、SlideListResponse型、SlideDetailResponse型、ErrorResponse型を定義する
    - _Requirements: 4.1, 11.1, 11.2_

  - [x] 3.2 APIクライアントを実装する
    - `website/src/api/slides.ts`にスライド一覧取得（`GET /api/slides`）と詳細取得（`GET /api/slides/:urlPath`）のAPI呼び出し関数を実装する
    - fetch APIを使用し、エラーハンドリングを含める
    - _Requirements: 11.1, 11.2_

- [ ] 4. フロントエンドコンポーネントの実装
  - [ ] 4.1 OgpHeadコンポーネントを実装する
    - `website/src/components/OgpHead.tsx`にreact-helmet-asyncを使用したOGPメタタグ挿入コンポーネントを作成する
    - og:title、og:description、og:image、og:type、og:urlを動的に設定する
    - スライド詳細用とサイト全体用の両方に対応する
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 4.2 NavigationControlsコンポーネントを実装する
    - `website/src/components/NavigationControls.tsx`に前へ/次へボタンを実装する
    - 最初のページで「前へ」ボタンを無効化、最後のページで「次へ」ボタンを無効化する
    - _Requirements: 2.3, 2.4, 2.7, 2.8_

  - [ ] 4.3 SlidevViewerコンポーネントを実装する
    - `website/src/components/SlidevViewer.tsx`にSlidevビルド済みアセットをiframeで表示するコンポーネントを作成する
    - iframeとpostMessageで通信し、ページ遷移を制御する
    - _Requirements: 2.1_

  - [ ] 4.4 PdfViewerコンポーネントを実装する
    - `website/src/components/PdfViewer.tsx`にreact-pdfを使用したPDF表示コンポーネントを作成する
    - ページ単位でスライド形式に表示する
    - _Requirements: 2.2_

  - [ ] 4.5 SlideViewerコンポーネントを実装する
    - `website/src/components/SlideViewer.tsx`にスライド形式に応じてSlidevViewerまたはPdfViewerを切り替え表示するコンポーネントを作成する
    - NavigationControlsを統合し、クリックエリア（左半分/右半分）とキーボード操作（←/→）を実装する
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ] 4.6 SlideListPageコンポーネントを実装する
    - `website/src/components/SlideListPage.tsx`にスライド一覧ページを作成する
    - APIからスライド一覧を取得し、日付降順で表示する
    - 各項目はタイトル・日付・説明を含むカード形式で表示する
    - クリックで詳細ページへ遷移する
    - サイト全体のOGPメタタグを含める
    - _Requirements: 1.1, 1.2, 1.3, 3.5_

  - [ ] 4.7 SlideDetailPageコンポーネントを実装する
    - `website/src/components/SlideDetailPage.tsx`にスライド詳細ページを作成する
    - URLパスに基づいてスライドメタデータを取得し、SlideViewerを表示する
    - スライド固有のOGPメタタグを含める
    - スライド未発見時は404表示と一覧ページへのリンクを提供する
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3, 3.4_

  - [ ] 4.8 Appコンポーネントとエントリーポイントを実装する
    - `website/src/App.tsx`にReact Routerによるルーティングを実装する（`/`で一覧、`/:urlPath`で詳細）
    - `website/src/main.tsx`にHelmetProviderを含むエントリーポイントを作成する
    - `website/src/index.css`にグローバルスタイル（白地背景、黒文字、レスポンシブ対応）を定義する
    - `website/index.html`を作成する
    - _Requirements: 9.1, 9.2, 9.3_

- [ ] 5. チェックポイント - フロントエンドビルド確認
  - `website/`ディレクトリでViteビルドが成功することを確認する。ESLintエラーがないことを確認する。問題があればユーザーに質問する。

- [ ] 6. Lambda関数の実装
  - [ ] 6.1 スライドAPI Lambda関数を実装する
    - `lambda/api/index.ts`に単一Lambda関数でパスベースルーティングを実装する
    - `GET /api/slides`: DynamoDB Scanで全スライド取得、日付降順ソート
    - `GET /api/slides/:urlPath`: DynamoDB GetItemでパーティションキー指定取得
    - 200/404/500のレスポンスハンドリングを実装する
    - _Requirements: 11.1, 11.2, 11.3, 4.2, 4.3_

  - [ ] 6.2 OGP用Lambda@Edge関数を実装する
    - `lambda/ogp/index.ts`にOrigin Requestトリガーで動作するLambda@Edge関数を実装する
    - User-AgentでSNSクローラーを判定し、OGPメタタグを含むHTMLを動的生成して返却する
    - 通常のブラウザリクエストはそのままオリジンに転送する
    - DynamoDBからスライドメタデータを取得してog:title、og:description、og:imageを設定する
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 7. CDKインフラストラクチャの実装
  - [ ] 7.1 SlideViewerStackを実装する
    - `infra/lib/slide-viewer-stack.ts`にアプリケーションの全リソースを定義する
    - **S3 Bucket**: パブリックアクセスブロック、OAC経由のみアクセス許可
    - **DynamoDB Table**: urlPathをパーティションキー、オンデマンドキャパシティモード
    - **Lambda Function + Function URL**: API用Lambda関数とFunction URLを作成、DynamoDBへの読み取り権限を付与
    - **Lambda@Edge**: OGP用Lambda@Edge関数を作成（us-east-1リージョン）
    - **CloudFront Distribution**: S3オリジン（OAC）、Lambda Function URLオリジン、パスパターンベースのビヘイビア設定（`/api/*`、`/assets/*`、デフォルト）、カスタムドメイン（slides.kawaaaas）、カスタムエラーレスポンス（403/404→index.html）、Lambda@Edgeの関連付け
    - **BucketDeployment**: 静的サイトとスライドアセットのデプロイ
    - L2コンストラクトを優先して使用する
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 4.2, 4.4_

  - [ ] 7.2 DynamoDBへのメタデータ投入をAwsCustomResourceで実装する
    - SlideViewerStack内にAwsCustomResourceを使用して、`slides/metadata.ts`のデータをDynamoDBに投入する処理を実装する
    - _Requirements: 7.4_

  - [ ] 7.3 SlideViewerStageを実装する
    - `infra/lib/slide-viewer-stage.ts`にデプロイステージを定義する
    - SlideViewerStackをステージに追加する
    - _Requirements: 7.1_

  - [ ] 7.4 PipelineStackを実装する
    - `infra/lib/pipeline-stack.ts`にCDK Pipelineを定義する
    - GitHubリポジトリへのプッシュをトリガーにself-mutatingパイプラインを構築する
    - フロントエンドのビルドステップを含める
    - SlideViewerStageをパイプラインに追加する
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 7.5 CDKアプリエントリーポイントを実装する
    - `infra/bin/app.ts`にPipelineStackをインスタンス化するエントリーポイントを作成する
    - _Requirements: 6.1_

- [ ] 8. チェックポイント - CDK Synthの確認
  - `infra/`ディレクトリで`cdk synth`が成功することを確認する。ESLintエラーがないことを確認する。問題があればユーザーに質問する。

- [ ] 9. 統合と最終調整
  - [ ] 9.1 CloudFrontキャッシュ無効化のAwsCustomResourceを実装する
    - SlideViewerStack内にデプロイ後のCloudFrontキャッシュ無効化処理をAwsCustomResourceで実装する
    - _Requirements: 7.5_

  - [ ] 9.2 フロントエンドのスタイリングを調整する
    - 白地背景・黒文字のカラースキーム、モダンでシンプルなデザイン、レスポンシブ対応を最終調整する
    - スライド一覧のカード表示、スライドビューアーのレイアウトを整える
    - _Requirements: 9.1, 9.2, 9.3_

- [ ] 10. 最終チェックポイント - 全体確認
  - フロントエンドのビルド、CDK Synthが成功することを確認する。ESLintエラーがないことを確認する。問題があればユーザーに質問する。

## 備考

- プロジェクト規約（Requirement 10.3）により、テストの実装は行わない
- 各タスクは前のタスクの成果物に依存するため、順番に実行すること
- チェックポイントで問題が発見された場合は、前のタスクに戻って修正すること
- L2コンストラクトが存在しないリソースの場合のみL1コンストラクトを使用する
- Lambda@Edgeはus-east-1リージョンにデプロイする必要がある点に注意
