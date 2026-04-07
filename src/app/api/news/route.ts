import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { GoogleGenerativeAI } from "@google/generative-ai";

const parser = new Parser();
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

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

const FEED_URLS = Object.keys(FEEDS_MAP);

export async function GET() {
  try {
    const allItems: (Parser.Item & { sourceName?: string })[] = [];

    const feedPromises = FEED_URLS.map(url => 
      parser.parseURL(url).catch(e => {
        console.error(`RSS Error ${url}:`, e.message);
        return { items: [] };
      })
    );
    
    const feeds = await Promise.all(feedPromises);

    feeds.forEach((feed, idx) => {
      const sourceName = FEEDS_MAP[FEED_URLS[idx]];
      if (feed.items && feed.items.length > 0) {
        feed.items.slice(0, 2).forEach(item => {
          (item as any).sourceName = sourceName;
          allItems.push(item);
        });
      }
    });

    const sortedItems = allItems.sort((a, b) => 
      new Date(b.pubDate || "").getTime() - new Date(a.pubDate || "").getTime()
    ).slice(0, 30);

    // HROMADNÝ PŘEKLAD TITULKŮ (Blesková AI operace)
    const titlesToTranslate = sortedItems.map(it => it.title).join("\n---\n");
    const prompt = `Přelož tyto technologické titulky článků do ČEŠTINY. Zachovej pořadí a formát (oddělovat pomocí '---'). Odpověz POUZE přeloženými titulky na nové řádky.\n\nTITULKY:\n${titlesToTranslate}`;
    
    let translatedTitles: string[] = [];
    try {
        const translationResult = await model.generateContent(prompt);
        const translationText = translationResult.response.text();
        translatedTitles = translationText.split("---").map(t => t.trim());
    } catch (err) {
        console.error("Hromadný překlad selhal:", err);
    }

    const processedItems = sortedItems.map((item, index) => ({
      id: index,
      title: translatedTitles[index] || item.title, // Použije překlad nebo původní titulek
      summary: "Načítám AI analýzu...",
      link: item.link,
      date: item.pubDate,
      source: (item as any).sourceName || "AI Novinka",
      isAnalyzed: false
    }));

    return NextResponse.json(processedItems);
  } catch (error) {
    console.error("Chyba v API novinek (Fast List):", error);
    return NextResponse.json({ error: "Nepodařilo se načíst seznam novinek" }, { status: 500 });
  }
}
