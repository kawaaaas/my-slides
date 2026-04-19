import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

// DynamoDBクライアント初期化
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// 環境変数からテーブル名を取得
const TABLE_NAME = process.env.TABLE_NAME ?? "SlideMetadata";

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

/** Lambda Function URLのイベント型 */
interface FunctionURLEvent {
  requestContext: {
    http: {
      method: string;
      path: string;
    };
  };
  headers?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
}

/** Lambda Function URLのレスポンス型 */
interface FunctionURLResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

/** CORSヘッダーを含む共通レスポンスヘッダー */
const responseHeaders: Record<string, string> = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/** 成功レスポンスを生成する */
function successResponse(body: unknown): FunctionURLResponse {
  return {
    statusCode: 200,
    headers: responseHeaders,
    body: JSON.stringify(body),
  };
}

/** エラーレスポンスを生成する */
function errorResponse(
  statusCode: number,
  error: string,
  message: string,
): FunctionURLResponse {
  return {
    statusCode,
    headers: responseHeaders,
    body: JSON.stringify({ error, message }),
  };
}

/** 全スライド一覧を取得する（日付降順） */
async function getSlideList(): Promise<FunctionURLResponse> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
    }),
  );

  const slides = (result.Items ?? []) as SlideMetadata[];

  // 日付降順でソート
  slides.sort((a, b) => b.date.localeCompare(a.date));

  return successResponse({ slides });
}

/** URLパスを指定してスライド詳細を取得する */
async function getSlideDetail(urlPath: string): Promise<FunctionURLResponse> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { urlPath },
    }),
  );

  if (!result.Item) {
    return errorResponse(404, "NotFound", "スライドが見つかりません");
  }

  return successResponse({ slide: result.Item as SlideMetadata });
}

/** Lambda関数ハンドラー */
export const handler = async (
  event: FunctionURLEvent,
): Promise<FunctionURLResponse> => {
  try {
    const path = event.requestContext.http.path;
    const method = event.requestContext.http.method;

    // OPTIONSリクエスト（CORS preflight）への対応
    if (method === "OPTIONS") {
      return {
        statusCode: 204,
        headers: responseHeaders,
        body: "",
      };
    }

    // パスベースルーティング
    // GET /api/slides - スライド一覧取得
    if (path === "/api/slides" && method === "GET") {
      return await getSlideList();
    }

    // GET /api/slides/:urlPath - スライド詳細取得
    const detailMatch = path.match(/^\/api\/slides\/(.+)$/);
    if (detailMatch && method === "GET") {
      const urlPath = decodeURIComponent(detailMatch[1]);
      return await getSlideDetail(urlPath);
    }

    // マッチしないパスは404を返す
    return errorResponse(404, "NotFound", "エンドポイントが見つかりません");
  } catch (error) {
    console.error("内部エラー:", error);
    return errorResponse(500, "InternalError", "内部エラーが発生しました");
  }
};
