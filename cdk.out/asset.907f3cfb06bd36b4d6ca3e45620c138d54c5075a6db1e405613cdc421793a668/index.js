"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lambda/ogp/index.ts
var index_exports = {};
__export(index_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(index_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var client = new import_client_dynamodb.DynamoDBClient({ region: "us-east-1" });
var docClient = import_lib_dynamodb.DynamoDBDocumentClient.from(client);
var TABLE_NAME = "SlideMetadata";
var SITE_BASE_URL = "https://slides.kawaaaas";
var CRAWLER_USER_AGENTS = [
  "Twitterbot",
  "facebookexternalhit",
  "LinkedInBot",
  "Slackbot",
  "Discordbot",
  "TelegramBot",
  "WhatsApp",
  "Line",
  "Hatena",
  "Embedly",
  "Quora Link Preview",
  "Showyoubot",
  "outbrain",
  "pinterest",
  "vkShare",
  "W3C_Validator",
  "redditbot"
];
function isCrawler(userAgent) {
  const lowerUA = userAgent.toLowerCase();
  return CRAWLER_USER_AGENTS.some(
    (crawler) => lowerUA.includes(crawler.toLowerCase())
  );
}
function generateOgpHtml(slide, urlPath) {
  const ogImageUrl = `${SITE_BASE_URL}/${slide.thumbnailPath}`;
  const ogUrl = `${SITE_BASE_URL}/${urlPath}`;
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta property="og:title" content="${escapeHtml(slide.title)}" />
  <meta property="og:description" content="${escapeHtml(slide.description)}" />
  <meta property="og:image" content="${escapeHtml(ogImageUrl)}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${escapeHtml(ogUrl)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(slide.title)}" />
  <meta name="twitter:description" content="${escapeHtml(slide.description)}" />
  <meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />
  <title>${escapeHtml(slide.title)} - slides.kawaaaas</title>
</head>
<body></body>
</html>`;
}
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
async function getSlideMetadata(urlPath) {
  const result = await docClient.send(
    new import_lib_dynamodb.GetCommand({
      TableName: TABLE_NAME,
      Key: { urlPath }
    })
  );
  return result.Item ?? null;
}
var handler = async (event) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;
  const userAgentHeader = headers["user-agent"];
  const userAgent = userAgentHeader?.[0]?.value ?? "";
  if (!isCrawler(userAgent)) {
    return request;
  }
  const uri = request.uri;
  const urlPath = uri.replace(/^\//, "").replace(/\/$/, "");
  if (!urlPath || urlPath.startsWith("api/") || urlPath.startsWith("assets/")) {
    return request;
  }
  try {
    const slide = await getSlideMetadata(urlPath);
    if (!slide) {
      return request;
    }
    const html = generateOgpHtml(slide, urlPath);
    return {
      status: "200",
      statusDescription: "OK",
      headers: {
        "content-type": [
          { key: "Content-Type", value: "text/html; charset=utf-8" }
        ],
        "cache-control": [{ key: "Cache-Control", value: "max-age=300" }]
      },
      body: html
    };
  } catch (error) {
    console.error("OGP\u30E1\u30BF\u30C7\u30FC\u30BF\u53D6\u5F97\u30A8\u30E9\u30FC:", error);
    return request;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
