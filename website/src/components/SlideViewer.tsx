// スライド形式に応じてビューアーを切り替え表示するコンポーネント

import { useCallback, useEffect, useState } from "react";
import type { SlideMetadata } from "../types/slide";
import { NavigationControls } from "./NavigationControls";
import { PdfViewer } from "./PdfViewer";
import { SlidevViewer } from "./SlidevViewer";

interface SlideViewerProps {
  /** スライドメタデータ */
  slide: SlideMetadata;
}

/** スライド形式に応じてSlidevViewerまたはPdfViewerを切り替え表示するコンポーネント */
export function SlideViewer({ slide }: SlideViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(slide.totalPages ?? 1);

  // 前のページへ遷移
  const goToPrev = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }, []);

  // 次のページへ遷移
  const goToNext = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  // 総ページ数が判明した時のハンドラー
  const handleTotalPagesDetected = useCallback((pages: number) => {
    setTotalPages(pages);
  }, []);

  // キーボード操作（←/→）
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNext();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrev, goToNext]);

  // クリックエリアのハンドラー（左半分で前へ、右半分で次へ）
  const handleAreaClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const halfWidth = rect.width / 2;

      if (clickX < halfWidth) {
        goToPrev();
      } else {
        goToNext();
      }
    },
    [goToPrev, goToNext],
  );

  // スライドアセットのURLを構築
  const assetUrl =
    slide.type === "slidev" ? `/${slide.s3Path}` : `/${slide.s3Path}`;

  return (
    <div className="slide-viewer">
      <div
        className="slide-viewer-content"
        onClick={handleAreaClick}
        role="presentation"
      >
        {slide.type === "slidev" ? (
          <SlidevViewer
            src={assetUrl}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onTotalPagesDetected={handleTotalPagesDetected}
          />
        ) : (
          <PdfViewer
            src={assetUrl}
            currentPage={currentPage}
            onTotalPagesDetected={handleTotalPagesDetected}
          />
        )}
      </div>
      <NavigationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPrev={goToPrev}
        onNext={goToNext}
      />
    </div>
  );
}
