// React Routerによるルーティング

import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SlideDetailPage } from "./components/SlideDetailPage";
import { SlideListPage } from "./components/SlideListPage";

/** アプリケーションルートコンポーネント */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SlideListPage />} />
        <Route path="/:urlPath" element={<SlideDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
