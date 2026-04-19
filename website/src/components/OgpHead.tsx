// OGPメタタグ挿入コンポーネント

import { Helmet } from "react-helmet-async";

/** スライド詳細ページ用のOGPプロパティ */
interface SlideOgpProps {
  type: "slide";
  title: string;
  description: string;
  urlPath: string;
  thumbnailPath: string;
}

/** サイト全体（一覧ページ）用のOGPプロパティ */
interface SiteOgpProps {
  type: "site";
}

type OgpHeadProps = SlideOgpProps | SiteOgpProps;

/** OGPメタタグを動的に設定するコンポーネント */
export function OgpHead(props: OgpHeadProps) {
  if (props.type === "site") {
    return (
      <Helmet>
        <meta property="og:title" content="slides.kawaaaas" />
        <meta property="og:description" content="スライド一覧" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://slides.kawaaaas/" />
      </Helmet>
    );
  }

  const { title, description, urlPath, thumbnailPath } = props;
  const imageUrl = `https://slides.kawaaaas/${thumbnailPath}`;
  const pageUrl = `https://slides.kawaaaas/${urlPath}`;

  return (
    <Helmet>
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:type" content="article" />
      <meta property="og:url" content={pageUrl} />
    </Helmet>
  );
}
