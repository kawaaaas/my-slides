// Slidevビルド済みアセットをiframeで表示するコンポーネント

import { useCallback, useEffect, useRef } from "react";

interface SlidevViewerProps {
  /** SlidevアセットのベースURL（例: "/slides/my-presentation/slidev/"） */
  src: string;
  /** 現在のページ番号（1始まり） */
  currentPage: number;
  /** ページ変更時のコールバック */
  onPageChange: (page: number) => void;
  /** 総ページ数が判明した時のコールバック */
  onTotalPagesDetected?: (totalPages: number) => void;
}

/** Slidevのビルド済みアセットをiframe内に表示するコンポーネント */
export function SlidevViewer({
  src,
  currentPage,
  onPageChange,
  onTotalPagesDetected,
}: SlidevViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // iframeにページ遷移メッセージを送信する
  const sendNavigationMessage = useCallback((page: number) => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: "slidev:navigate", page }, "*");
    }
  }, []);

  // currentPageが変更された時にiframeにメッセージを送信
  useEffect(() => {
    sendNavigationMessage(currentPage);
  }, [currentPage, sendNavigationMessage]);

  // iframeからのメッセージを受信する
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const { data } = event;
      if (!data || typeof data !== "object") return;

      // Slidevからのページ変更通知
      if (data.type === "slidev:page" && typeof data.page === "number") {
        onPageChange(data.page);
      }

      // Slidevからの総ページ数通知
      if (
        data.type === "slidev:totalPages" &&
        typeof data.totalPages === "number"
      ) {
        onTotalPagesDetected?.(data.totalPages);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onPageChange, onTotalPagesDetected]);

  return (
    <div className="slidev-viewer">
      <iframe
        ref={iframeRef}
        src={src}
        title="スライド"
        className="slidev-iframe"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
