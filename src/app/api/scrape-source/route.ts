import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    // Validate URL
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; VoyagerBot/3.0; +https://voyager.ai)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type") || "";

    // If it's already an RSS/XML feed, return it directly
    if (
      contentType.includes("application/rss+xml") ||
      contentType.includes("application/atom+xml") ||
      contentType.includes("application/xml") ||
      url.match(/\/(feed|rss|atom)(\.xml)?(\?.*)?$/i)
    ) {
      const hostname = new URL(url).hostname;
      return NextResponse.json({
        type: "rss",
        feedUrl: url,
        name: hostname,
        detectedFrom: "content-type or url pattern",
      });
    }

    // Parse HTML to find RSS link tags
    const html = await response.text();
    const $ = cheerio.load(html);

    // Look for RSS/Atom feed link in <head>
    let feedUrl: string | null = null;
    let feedName: string | null = null;

    $('link[type="application/rss+xml"], link[type="application/atom+xml"]').each((_, el) => {
      const href = $(el).attr("href");
      if (href && !feedUrl) {
        // Resolve relative URLs
        try {
          feedUrl = new URL(href, url).toString();
          feedName = $(el).attr("title") || null;
        } catch {
          feedUrl = href;
        }
      }
    });

    if (feedUrl) {
      const hostname = new URL(url).hostname;
      return NextResponse.json({
        type: "rss",
        feedUrl,
        name: feedName || hostname,
        detectedFrom: "html-link-tag",
        sourceUrl: url,
      });
    }

    // No RSS found – return webpage metadata for manual scraping
    const pageTitle =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text().trim() ||
      new URL(url).hostname;

    const pageDesc =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      "";

    return NextResponse.json({
      type: "webpage",
      sourceUrl: url,
      name: pageTitle.substring(0, 60),
      description: pageDesc.substring(0, 160),
    });
  } catch (err: any) {
    const msg = err?.name === "AbortError" ? "Timeout – stránka neodpovídá" : String(err?.message || err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
