// スライド関連の型定義

/** スライドメタデータ */
export interface SlideMetadata {
  /** URLパス（例: "my-presentation-2024"） */
  urlPath: string;
  /** 日付（ISO 8601形式: "2024-01-15"） */
  date: string;
  /** スライドタイトル */
  title: string;
  /** スライドの説明 */
  description: string;
  /** スライド形式（"slidev" または "pdf"） */
  type: "slidev" | "pdf";
  /** S3内のアセットパス */
  s3Path: string;
  /** OGP用サムネイル画像のS3パス */
  thumbnailPath: string;
  /** 総ページ数（Slidevの場合に使用） */
  totalPages?: number;
}

/** スライド一覧取得レスポンス */
export interface SlideListResponse {
  slides: SlideMetadata[];
}

/** スライド詳細取得レスポンス */
export interface SlideDetailResponse {
  slide: SlideMetadata;
}

/** エラーレスポンス */
export interface ErrorResponse {
  error: string;
  message: string;
}
