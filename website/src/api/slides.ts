// スライドAPI クライアント

import type {
  ErrorResponse,
  SlideDetailResponse,
  SlideListResponse,
} from "../types/slide";

/** APIのベースパス */
const API_BASE = "/api/slides";

/**
 * スライド一覧を取得する
 * @returns スライド一覧レスポンス
 * @throws APIエラー時にErrorResponseをthrowする
 */
export async function fetchSlides(): Promise<SlideListResponse> {
  const response = await fetch(API_BASE);

  if (!response.ok) {
    const error: ErrorResponse = await response.json().catch(() => ({
      error: "NetworkError",
      message: "レスポンスの解析に失敗しました",
    }));
    throw error;
  }

  return response.json();
}

/**
 * 指定されたURLパスのスライド詳細を取得する
 * @param urlPath スライドのURLパス
 * @returns スライド詳細レスポンス
 * @throws APIエラー時にErrorResponseをthrowする
 */
export async function fetchSlideByUrlPath(
  urlPath: string,
): Promise<SlideDetailResponse> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(urlPath)}`);

  if (!response.ok) {
    const error: ErrorResponse = await response.json().catch(() => ({
      error: "NetworkError",
      message: "レスポンスの解析に失敗しました",
    }));
    throw error;
  }

  return response.json();
}
