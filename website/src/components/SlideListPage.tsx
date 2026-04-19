// スライド一覧ページコンポーネント

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchSlides } from "../api/slides";
import type { SlideMetadata } from "../types/slide";
import { OgpHead } from "./OgpHead";

/** スライド一覧ページ */
export function SlideListPage() {
  const [slides, setSlides] = useState<SlideMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSlides() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchSlides();
        if (!cancelled) {
          // 日付降順でソート
          const sorted = [...response.slides].sort((a, b) =>
            b.date.localeCompare(a.date),
          );
          setSlides(sorted);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err && typeof err === "object" && "message" in err
              ? (err as { message: string }).message
              : "スライドの取得に失敗しました";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSlides();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="slide-list-page">
        <OgpHead type="site" />
        <div className="loading">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="slide-list-page">
        <OgpHead type="site" />
        <div className="error">
          <p>{error}</p>
          <button type="button" onClick={() => window.location.reload()}>
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="slide-list-page">
      <OgpHead type="site" />
      <header className="site-header">
        <h1>slides.kawaaaas</h1>
      </header>
      <main className="slide-list">
        {slides.map((slide) => (
          <Link
            key={slide.urlPath}
            to={`/${slide.urlPath}`}
            className="slide-card"
          >
            <div className="slide-card-content">
              <h2 className="slide-card-title">{slide.title}</h2>
              <time className="slide-card-date" dateTime={slide.date}>
                {slide.date}
              </time>
              <p className="slide-card-description">{slide.description}</p>
            </div>
          </Link>
        ))}
        {slides.length === 0 && (
          <p className="no-slides">スライドがまだ登録されていません。</p>
        )}
      </main>
    </div>
  );
}
