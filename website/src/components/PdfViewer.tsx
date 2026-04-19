// react-pdfを使用したPDF表示コンポーネント

import { useCallback, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// PDF.jsワーカーの設定
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  /** PDFファイルのURL */
  src: string;
  /** 現在のページ番号（1始まり） */
  currentPage: number;
  /** 総ページ数が判明した時のコールバック */
  onTotalPagesDetected?: (totalPages: number) => void;
}

/** PDFをページ単位でスライド形式に表示するコンポーネント */
export function PdfViewer({
  src,
  currentPage,
  onTotalPagesDetected,
}: PdfViewerProps) {
  const [error, setError] = useState<string | null>(null);

  const handleLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      onTotalPagesDetected?.(numPages);
    },
    [onTotalPagesDetected],
  );

  const handleLoadError = useCallback(() => {
    setError("PDFの読み込みに失敗しました");
  }, []);

  if (error) {
    return (
      <div className="pdf-viewer pdf-viewer-error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="pdf-viewer">
      <Document
        file={src}
        onLoadSuccess={handleLoadSuccess}
        onLoadError={handleLoadError}
        loading={<div className="pdf-loading">読み込み中...</div>}
      >
        <Page
          pageNumber={currentPage}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="pdf-page"
          width={800}
        />
      </Document>
    </div>
  );
}
