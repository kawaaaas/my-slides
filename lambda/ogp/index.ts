import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import type {
  CloudFrontRequestEvent,
  CloudFrontRequestResult,
} from "aws-lambda";

// DynamoDBクライアント初期化（Lambda@Edgeはus-east-1で実行される）
const client = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);

// テーブル名（Lambda@Edgeでは環境変数が使えないため固定値）
const TABLE_NAME = "SlideMetadata";

// サイトのベースURL
const SITE_BASE_URL = "https://slides.kawaaaas";

/** SNSクローラーのUser-Agentパターン */
const CRAWLER_USER_AGENTS = [
  "Twitterbot",
  "facebookexternalhit",
  "LinkedInBot",
  "Slackbot",
  "Discordbot",
  "TelegramBot",
  "WhatsApp",
  "Line",
  "Hatena",
  "Embedly",
  "Quora Link Preview",
  "Showyoubot",
  "outbrain",
  "pinterest",
  "vkShare",
  "W3C_Validator",
  "redditbot",
];

/** スライドメタデータの型 */
interface SlideMetadata {
  urlPath: string;
  date: string;
  title: string;
  description: string;
  type: "slidev" | "pdf";
  s3Path: string;
  thumbnailPath: string;
  totalPages?: number;
}

/** User-AgentがSNSクローラーかどうかを判定する */
function isCrawler(userAgent: string): boolean {
  const lowerUA = userAgent.toLowerCase();
  return CRAWLER_USER_AGENTS.some((crawler) =>
    lowerUA.includes(crawler.toLowerCase()),
  );
}

/** OGPメタタグを含むHTMLを生成する */
function generateOgpHtml(slide: SlideMetadata, urlPath: string): string {
  const ogImageUrl = `${SITE_BASE_URL}/${slide.thumbnailPath}`;
  const ogUrl = `${SITE_BASE_URL}/${urlPath}`;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta property="og:title" content="${escapeHtml(slide.title)}" />
  <meta property="og:description" content="${escapeHtml(slide.description)}" />
  <meta property="og:image" content="${escapeHtml(ogImageUrl)}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${escapeHtml(ogUrl)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(slide.title)}" />
  <meta name="twitter:description" content="${escapeHtml(slide.description)}" />
  <meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />
  <title>${escapeHtml(slide.title)} - slides.kawaaaas</title>
</head>
<body></body>
</html>`;
}

/** HTML特殊文字をエスケープする */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** DynamoDBからスライドメタデータを取得する */
async function getSlideMetadata(
  urlPath: string,
): Promise<SlideMetadata | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { urlPath },
    }),
  );

  return (result.Item as SlideMetadata) ?? null;
}

/** Lambda@Edgeハンドラー（Origin Request） */
export const handler = async (
  event: CloudFrontRequestEvent,
): Promise<CloudFrontRequestResult> => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;

  // User-Agentヘッダーを取得
  const userAgentHeader = headers["user-agent"];
  const userAgent = userAgentHeader?.[0]?.value ?? "";

  // SNSクローラーでない場合はそのままオリジンに転送
  if (!isCrawler(userAgent)) {
    return request;
  }

  // URIからURLパスを抽出（先頭の/を除去）
  const uri = request.uri;
  const urlPath = uri.replace(/^\//, "").replace(/\/$/, "");

  // ルートパスやAPIパス、アセットパスの場合はそのまま転送
  if (!urlPath || urlPath.startsWith("api/") || urlPath.startsWith("assets/")) {
    return request;
  }

  try {
    // DynamoDBからスライドメタデータを取得
    const slide = await getSlideMetadata(urlPath);

    // スライドが見つからない場合はそのまま転送
    if (!slide) {
      return request;
    }

    // OGPメタタグを含むHTMLを生成して返却
    const html = generateOgpHtml(slide, urlPath);

    return {
      status: "200",
      statusDescription: "OK",
      headers: {
        "content-type": [
          { key: "Content-Type", value: "text/html; charset=utf-8" },
        ],
        "cache-control": [{ key: "Cache-Control", value: "max-age=300" }],
      },
      body: html,
    };
  } catch (error) {
    console.error("OGPメタデータ取得エラー:", error);
    // エラー時はそのままオリジンに転送
    return request;
  }
};
