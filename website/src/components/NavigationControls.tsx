// ページ送りナビゲーションコンポーネント

interface NavigationControlsProps {
  /** 現在のページ番号（1始まり） */
  currentPage: number;
  /** 総ページ数 */
  totalPages: number;
  /** 前のページへ遷移するコールバック */
  onPrev: () => void;
  /** 次のページへ遷移するコールバック */
  onNext: () => void;
}

/** 前へ/次へボタンを提供するナビゲーションコンポーネント */
export function NavigationControls({
  currentPage,
  totalPages,
  onPrev,
  onNext,
}: NavigationControlsProps) {
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  return (
    <div className="navigation-controls">
      <button
        type="button"
        className="nav-button nav-button-prev"
        onClick={onPrev}
        disabled={isFirst}
        aria-label="前のページ"
      >
        ‹ 前へ
      </button>
      <span className="nav-page-indicator">
        {currentPage} / {totalPages}
      </span>
      <button
        type="button"
        className="nav-button nav-button-next"
        onClick={onNext}
        disabled={isLast}
        aria-label="次のページ"
      >
        次へ ›
      </button>
    </div>
  );
}
