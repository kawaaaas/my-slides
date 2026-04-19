# Requirements Document

## Introduction

本ドキュメントは、個人用スライド閲覧サイト「slides.kawaaaas」の要件を定義する。このサイトは、SlidevとPDFの両形式のスライドを統一されたユーザー体験で閲覧できるWebアプリケーションである。AWS上にCloudFront + S3でホスティングし、DynamoDBでスライドメタデータを管理する。CDKによるインフラ構築、CDK Pipelineによる自動デプロイを行い、コストを最小限に抑える。

## Glossary

- **Viewer_Site**: slides.kawaaaasドメインでホストされるスライド閲覧Webアプリケーション
- **Slide_Metadata**: DynamoDBに格納されるスライドの情報（日付、タイトル、説明、S3パス、URLパス）
- **Slide_List_Page**: 登録されたスライド一覧を表示するページ
- **Slide_Detail_Page**: 個別のスライドを閲覧するページ
- **Slide_Viewer**: Slide_Detail_Page内でSlidevアセットまたはPDFをスライド形式で表示するコンポーネント
- **CDK_Stack**: AWS CDKで定義されるインフラストラクチャスタック
- **CDK_Pipeline**: CDK Pipelineで構築されるCI/CDパイプライン
- **OGP_Metadata**: Open Graph Protocolに基づくメタデータ（タイトル、説明、サムネイル画像）
- **S3_Bucket**: スライドアセット（Slidevビルド成果物、PDF）およびWebサイトの静的ファイルを格納するS3バケット
- **CloudFront_Distribution**: S3_Bucketの前段に配置されるCDN
- **DynamoDB_Table**: Slide_Metadataを格納するテーブル
- **Deploy_Pipeline**: CDK_Pipelineで構築される、コード変更時にS3デプロイとCloudFrontキャッシュ無効化を自動実行するパイプライン

## Requirements

### Requirement 1: スライド一覧表示

**User Story:** 閲覧者として、登録されたスライドの一覧を確認したい。それにより、興味のあるスライドを見つけて閲覧できる。

#### Acceptance Criteria

1. WHEN 閲覧者がViewer_Siteのトップページにアクセスした時、THE Slide_List_Page SHALL DynamoDB_Tableから全てのSlide_Metadataを取得し、日付の降順で一覧表示する
2. THE Slide_List_Page SHALL 各スライドのタイトル、日付、説明を一覧の各項目に表示する
3. WHEN 閲覧者が一覧のスライド項目をクリックした時、THE Viewer_Site SHALL 該当スライドのSlide_Detail_Pageへ遷移する

### Requirement 2: スライド詳細閲覧（統一ユーザー体験）

**User Story:** 閲覧者として、SlidevとPDFのスライドを同じ操作感で閲覧したい。それにより、形式を意識せずにスライドの内容に集中できる。

#### Acceptance Criteria

1. WHEN 閲覧者がSlide_Detail_PageにアクセスしてスライドがSlidev形式の場合、THE Slide_Viewer SHALL Slidevのビルド済みアセットをiframe内に表示する
2. WHEN 閲覧者がSlide_Detail_PageにアクセスしてスライドがPDF形式の場合、THE Slide_Viewer SHALL PDFをページ単位でスライド形式に表示する
3. WHEN 閲覧者がSlide_Viewerの右側エリアまたは「次へ」ボタンをクリックした時、THE Slide_Viewer SHALL 次のスライドページへ遷移する
4. WHEN 閲覧者がSlide_Viewerの左側エリアまたは「前へ」ボタンをクリックした時、THE Slide_Viewer SHALL 前のスライドページへ遷移する
5. WHEN 閲覧者がキーボードの右矢印キーを押した時、THE Slide_Viewer SHALL 次のスライドページへ遷移する
6. WHEN 閲覧者がキーボードの左矢印キーを押した時、THE Slide_Viewer SHALL 前のスライドページへ遷移する
7. WHILE スライドが最初のページを表示している状態で、THE Slide_Viewer SHALL 「前へ」ボタンを無効化する
8. WHILE スライドが最後のページを表示している状態で、THE Slide_Viewer SHALL 「次へ」ボタンを無効化する

### Requirement 3: OGPメタデータ対応

**User Story:** 閲覧者として、XなどのSNSにスライドURLを貼った時にスライドの1枚目がプレビュー表示されてほしい。それにより、スライドの内容が共有先で伝わりやすくなる。

#### Acceptance Criteria

1. THE Slide_Detail_Page SHALL 各スライドに対応するOGP_Metadata（og:title、og:description、og:image）をHTMLのmetaタグに含める
2. THE OGP_Metadata SHALL og:imageとしてスライドの1枚目のサムネイル画像のURLを設定する
3. THE OGP_Metadata SHALL og:titleとしてSlide_Metadataのタイトルを設定する
4. THE OGP_Metadata SHALL og:descriptionとしてSlide_Metadataの説明を設定する
5. THE Slide_List_Page SHALL サイト全体のOGP_Metadata（サイト名、説明）をHTMLのmetaタグに含める

### Requirement 4: DynamoDBによるメタデータ管理

**User Story:** サイト管理者として、スライドのメタデータをDynamoDBで管理したい。それにより、スライドの追加・更新を効率的に行える。

#### Acceptance Criteria

1. THE DynamoDB_Table SHALL 各スライドレコードに日付、タイトル、説明、S3パス、URLパスを格納する
2. THE DynamoDB_Table SHALL URLパスをパーティションキーとして使用する
3. WHEN Viewer_SiteがURLパスを指定してDynamoDB_Tableにクエリを実行した時、THE DynamoDB_Table SHALL 該当するSlide_Metadataを返却する
4. THE DynamoDB_Table SHALL オンデマンドキャパシティモードで作成し、コストを最小限に抑える

### Requirement 5: S3 + CloudFrontによるホスティング

**User Story:** サイト管理者として、slides.kawaaaasドメインでサイトをホストしたい。それにより、独自ドメインで安定したコンテンツ配信ができる。

#### Acceptance Criteria

1. THE S3_Bucket SHALL Webサイトの静的ファイル、Slidevビルド済みアセット、PDFファイル、サムネイル画像を格納する
2. THE CloudFront_Distribution SHALL S3_Bucketをオリジンとしてコンテンツを配信する
3. THE CloudFront_Distribution SHALL slides.kawaaaasドメインのカスタムドメインを使用する
4. THE S3_Bucket SHALL パブリックアクセスをブロックし、CloudFront_DistributionのOrigin Access Control経由のみでアクセスを許可する

### Requirement 6: CDKによるインフラ構築

**User Story:** サイト管理者として、インフラをCDKで管理したい。それにより、インフラの変更をコードで追跡・再現できる。

#### Acceptance Criteria

1. THE CDK_Stack SHALL S3_Bucket、CloudFront_Distribution、DynamoDB_Tableを定義する
2. THE CDK_Stack SHALL L2コンストラクトを使用してリソースを定義する
3. IF L2コンストラクトが存在しないリソースの場合、THEN THE CDK_Stack SHALL L1コンストラクトを使用する
4. THE CDK_Stack SHALL コスト最小化のためにDynamoDB_Tableをオンデマンドキャパシティモードで構成する

### Requirement 7: CDK Pipelineによる自動デプロイ

**User Story:** サイト管理者として、コード変更時に自動でデプロイされるようにしたい。それにより、手動デプロイの手間とミスを削減できる。

#### Acceptance Criteria

1. THE Deploy_Pipeline SHALL CDK Pipelineを使用してCI/CDパイプラインを構築する
2. WHEN リポジトリにコード変更がプッシュされた時、THE Deploy_Pipeline SHALL 自動でビルドとデプロイを実行する
3. THE Deploy_Pipeline SHALL S3 DeploymentまたはAwsCustomResourceを使用して、スライドアセットをS3_Bucketに自動アップロードする
4. THE Deploy_Pipeline SHALL S3 DeploymentまたはAwsCustomResourceを使用して、Slide_MetadataをDynamoDB_Tableに自動投入する
5. WHEN デプロイが完了した時、THE Deploy_Pipeline SHALL AwsCustomResourceを使用してCloudFront_Distributionのキャッシュ無効化を実行する

### Requirement 8: リポジトリ構成

**User Story:** サイト管理者として、スライドアセットとWebサイトのコードを同一リポジトリで管理したい。それにより、一元的にバージョン管理と自動デプロイができる。

#### Acceptance Criteria

1. THE リポジトリ SHALL Webサイトのソースコード、CDKコード、スライドアセット（Slidevビルド成果物、PDF）をディレクトリ分割して格納する
2. THE リポジトリ SHALL 新しいスライドを追加する際、所定のディレクトリにアセットを配置しメタデータ定義を追加するだけでデプロイ可能とする

### Requirement 9: デザイン

**User Story:** 閲覧者として、シンプルでモダンなデザインのサイトでスライドを閲覧したい。それにより、コンテンツに集中できる快適な閲覧体験を得られる。

#### Acceptance Criteria

1. THE Viewer_Site SHALL 白地の背景に黒文字のカラースキームを使用する
2. THE Viewer_Site SHALL モダンでシンプルなデザインを採用する
3. THE Viewer_Site SHALL レスポンシブデザインを採用し、デスクトップとモバイルの両方で適切に表示する

### Requirement 10: コード品質

**User Story:** サイト管理者として、コードの品質を一定に保ちたい。それにより、保守性の高いコードベースを維持できる。

#### Acceptance Criteria

1. THE リポジトリ SHALL OxfmtをフォーマッターとしてJavaScript/TypeScriptコードに適用する
2. THE リポジトリ SHALL ESLintをリンターとして使用し、CDKプラグインを含める
3. THE リポジトリ SHALL テストの実装を行わない

### Requirement 11: API層（DynamoDBアクセス）

**User Story:** 閲覧者として、スライドのメタデータをWebサイトから取得したい。それにより、スライド一覧や詳細情報を動的に表示できる。

#### Acceptance Criteria

1. WHEN Viewer_Siteがスライド一覧を要求した時、THE API層 SHALL DynamoDB_Tableから全スライドのSlide_Metadataを取得して返却する
2. WHEN Viewer_SiteがURLパスを指定してスライド詳細を要求した時、THE API層 SHALL DynamoDB_Tableから該当するSlide_Metadataを取得して返却する
3. THE API層 SHALL コスト最小化のため、API GatewayとLambda関数、またはCloudFront Functions等の軽量な方式で実装する
