// スライド詳細ページコンポーネント

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchSlideByUrlPath } from "../api/slides";
import type { SlideMetadata } from "../types/slide";
import { OgpHead } from "./OgpHead";
import { SlideViewer } from "./SlideViewer";

/** スライド詳細ページ */
export function SlideDetailPage() {
  const { urlPath } = useParams<{ urlPath: string }>();
  const [slide, setSlide] = useState<SlideMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSlide() {
      if (!urlPath) return;

      try {
        setLoading(true);
        setError(null);
        setNotFound(false);
        const response = await fetchSlideByUrlPath(urlPath);
        if (!cancelled) {
          setSlide(response.slide);
        }
      } catch (err) {
        if (!cancelled) {
          if (
            err &&
            typeof err === "object" &&
            "error" in err &&
            (err as { error: string }).error === "NotFound"
          ) {
            setNotFound(true);
          } else {
            const message =
              err && typeof err === "object" && "message" in err
                ? (err as { message: string }).message
                : "スライドの取得に失敗しました";
            setError(message);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSlide();
    return () => {
      cancelled = true;
    };
  }, [urlPath]);

  if (loading) {
    return (
      <div className="slide-detail-page">
        <div className="loading">読み込み中...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="slide-detail-page">
        <div className="not-found">
          <h1>スライドが見つかりません</h1>
          <p>指定されたスライドは存在しないか、削除された可能性があります。</p>
          <Link to="/" className="back-link">
            スライド一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="slide-detail-page">
        <div className="error">
          <p>{error}</p>
          <button type="button" onClick={() => window.location.reload()}>
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  if (!slide) return null;

  return (
    <div className="slide-detail-page">
      <OgpHead
        type="slide"
        title={slide.title}
        description={slide.description}
        urlPath={slide.urlPath}
        thumbnailPath={slide.thumbnailPath}
      />
      <header className="slide-detail-header">
        <Link to="/" className="back-link">
          ← 一覧に戻る
        </Link>
        <h1>{slide.title}</h1>
        <time dateTime={slide.date}>{slide.date}</time>
      </header>
      <main className="slide-detail-content">
        <SlideViewer slide={slide} />
      </main>
    </div>
  );
}
