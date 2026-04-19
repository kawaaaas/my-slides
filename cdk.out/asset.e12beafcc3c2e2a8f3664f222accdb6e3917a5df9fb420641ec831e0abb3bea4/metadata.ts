// スライドメタデータ定義
// 新しいスライドを追加する際は、このファイルにエントリを追加する

/** スライドメタデータのインターフェース */
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

/** 登録済みスライド一覧 */
export const slides: SlideMetadata[] = [
  {
    urlPath: "my-presentation-2024",
    date: "2024-01-15",
    title: "発表タイトル",
    description: "発表の説明文",
    type: "slidev",
    s3Path: "slides/my-presentation-2024/slidev/",
    thumbnailPath: "slides/my-presentation-2024/thumbnail.png",
    totalPages: 20,
  },
];
