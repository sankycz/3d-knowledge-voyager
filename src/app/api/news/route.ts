import { NextResponse } from "next/server";
import Parser from "rss-parser";
import Groq from "groq-sdk";
import * as cheerio from "cheerio";

const parser = new Parser();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || "" });

const FEEDS_MAP: Record<string, string> = {
  "https://asociace.ai/feed/": "Česká asociace AI",
  "https://www.lupa.cz/rss/rubriky/umela-inteligence/": "Lupa.cz",
  "https://lookai.vc/cs/novinky/feed/": "Look AI Ventures",
  "https://www.zive.cz/rss/sc-47/default.aspx?section=304": "Živě.cz",
  "https://cc.cz/tema/umela-inteligence/feed/": "CzechCrunch",
  "https://openai.com/news/rss.xml": "OpenAI Blog",
  "https://blog.google/technology/ai/rss/": "Google AI",
  "https://blogs.nvidia.com/feed/": "NVIDIA",
  "https://www.anthropic.com/news/rss.xml": "Anthropic",
  "https://www.microsoft.com/en-us/research/feed/": "Microsoft Research",
  "https://techcrunch.com/category/artificial-intelligence/feed/": "TechCrunch AI",
  "https://www.therundown.ai/feed": "The Rundown",
  "https://venturebeat.com/category/ai/feed/": "VentureBeat",
  "https://unwindai.substack.com/feed": "Unwind AI",
  "https://the-decoder.com/feed/": "The Decoder",
  "https://huggingface.co/blog/feed.xml": "Hugging Face",
  "https://www.marktechpost.com/feed/": "MarkTechPost",
  "https://towardsdatascience.com/feed": "Towards Data Science",
  "https://machinelearningmastery.com/feed/": "ML Mastery",
  "https://news.mit.edu/topic/mitartificial-intelligence-rss-feed": "MIT News",
  "https://www.theverge.com/ai-artificial-intelligence/rss/index.xml": "The Verge AI",
  "https://feeds.wired.com/wired/index": "Wired Magazine",
  "https://arstechnica.com/feed/": "Ars Technica",
  "https://www.deepmind.com/blog/rss.xml": "Google DeepMind",
  "https://ai.meta.com/blog/rss/": "Meta AI Blog",
  "https://blog.mistral.ai/rss/": "Mistral AI",
  "https://aws.amazon.com/blogs/machine-learning/feed/": "AWS ML Blog",
  "https://decoding.ai/feed": "Decoding AI",
  "https://www.superhuman.ai/feed": "Superhuman AI",
  "https://ai.googleplex.com/rss": "Google AI Research",
  "https://scienmag.com/category/artificial-intelligence/feed/": "Scienmag AI",
  "https://www.artificialintelligence-news.com/feed/": "AI News Hub"
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const extraFeedsParam = searchParams.get("extraFeeds");
    const limit = parseInt(searchParams.get("limit") || "30");
    const offset = parseInt(searchParams.get("offset") || "0");
    
    // Sestavení mapy všech feedů
    const allFeedsMap = { ...FEEDS_MAP };
    if (extraFeedsParam) {
      const extraFeeds = extraFeedsParam.split(",");
      extraFeeds.forEach(url => {
        if (url && !allFeedsMap[url]) {
          try {
            const hostname = new URL(url).hostname;
            allFeedsMap[url] = hostname;
          } catch (e) {
            console.error(`Invalid extra URL: ${url}`);
          }
        }
      });
    }

    // Paralelní načítání všech feedů s ošetřením chyb a timeoutem
    // Navýšeno na 10 položek na zdroj pro lepší paginaci
    const feedPromises = Object.entries(allFeedsMap).map(async ([url, sourceName]) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout
        
        // Zkusíme nejprve RSS
        try {
          const feed = await parser.parseURL(url).catch(() => null);
          if (feed) {
            clearTimeout(timeoutId);
            return (feed.items || []).slice(0, 10).map(item => ({
              title: item.title,
              link: item.link,
              pubDate: item.pubDate || item.isoDate,
              sourceName
            }));
          }
        } catch (rssErr) {
          // Fallback to fetch
        }

        // Pokud selže RSS nebo vrátí null, zkusíme scraping
        const response = await fetch(url, { signal: controller.signal });
        const html = await response.text();
        const $ = cheerio.load(html);
        
        const scrapedItems: any[] = [];
        $("article, .post, .entry").slice(0, 10).each((_, el) => {
          const titleEl = $(el).find("h1, h2, h3, .title").first();
          const linkEl = $(el).find("a").first();
          const title = titleEl.text().trim();
          const link = linkEl.attr("href");
          
          if (title && link) {
            scrapedItems.push({
              title,
              link: new URL(link, url).toString(),
              pubDate: new Date().toISOString(),
              sourceName
            });
          }
        });
        
        clearTimeout(timeoutId);
        return scrapedItems;
      } catch (err) {
        console.error(`Fetch Fail [${url}]:`, err);
        return [];
      }
    });

    const results = await Promise.all(feedPromises);
    const allItems = results.flat();

    // Seřazení podle data
    const sortedItems = allItems.sort((a: any, b: any) => 
      new Date(b.pubDate || b.isoDate || "").getTime() - new Date(a.pubDate || a.isoDate || "").getTime()
    );

    // Výběr položek pro aktuální stránku
    const paginatedItems = sortedItems.slice(offset, offset + limit);

    if (paginatedItems.length === 0) {
      return NextResponse.json([]);
    }

    // HROMADNÝ PŘEKLAD pouze pro položky na stránce
    const titlesToTranslate = paginatedItems.map(it => it.title).join("\n---\n");
    const prompt = `Přelož tyto technologické titulky článků do ČEŠTINY. Zachovej pořadí. Odděluj '---'. Pouze překlady.\n\nTITULKY:\n${titlesToTranslate}`;
    
    let translatedTitles: string[] = [];
    try {
        const completion = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "llama-3.3-70b-versatile",
          temperature: 0.3,
          max_tokens: 2048
        });
        const text = completion.choices[0]?.message?.content || "";
        translatedTitles = text.split("---").map(t => t.trim());
    } catch (err) {
        console.error("Překlad selhal:", err);
    }

    const processedItems = paginatedItems.map((item: any, index: number) => ({
      id: offset + index, // Unikátní ID i při paginaci
      title: (translatedTitles[index] && translatedTitles[index].length > 5) ? translatedTitles[index] : item.title,
      summary: "Analýza Voyager 3.0 k dispozici...",
      link: item.link,
      date: item.pubDate || item.isoDate,
      source: item.sourceName || "AI Hub",
      isAnalyzed: false
    }));

    return NextResponse.json(processedItems);
  } catch (err) {
    console.error("Critical API Error:", err);
    return NextResponse.json({ error: "Intelligence Hub is temporarily offline" }, { status: 500 });
  }
}
