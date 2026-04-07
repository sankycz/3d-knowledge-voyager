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

export async function GET() {
  try {
    // Paralelní načítání všech feedů s ošetřením chyb a timeoutem
    const feedPromises = Object.entries(FEEDS_MAP).map(async ([url, sourceName]) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout
        
        const feed = await parser.parseURL(url);
        clearTimeout(timeoutId);

        return (feed.items || []).slice(0, 3).map(item => ({
          ...item,
          sourceName
        }));
      } catch (err) {
        console.error(`RSS Fetch Fail [${url}]:`, err);
        return [];
      }
    });

    const results = await Promise.all(feedPromises);
    const allItems = results.flat();

    // Seřazení a limit
    const sortedItems = allItems.sort((a: any, b: any) => 
      new Date(b.pubDate || b.isoDate || "").getTime() - new Date(a.pubDate || a.isoDate || "").getTime()
    ).slice(0, 30);

    // HROMADNÝ PŘEKLAD (Blesková operace)
    const titlesToTranslate = sortedItems.map(it => it.title).join("\n---\n");
    const prompt = `Přelož tyto technologické titulky článků do ČEŠTINY. Zachovej pořadí. Odděluj '---'. Pouze překlady.\n\nTITULKY:\n${titlesToTranslate}`;
    
    let translatedTitles: string[] = [];
    try {
        const translationResult = await model.generateContent(prompt);
        const text = translationResult.response.text();
        translatedTitles = text.split("---").map(t => t.trim());
    } catch (err) {
        console.error("Překlad selhal:", err);
    }

    const processedItems = sortedItems.map((item: any, index: number) => ({
      id: index,
      title: translatedTitles[index] || item.title,
      summary: "Analýza Voyager 3.0 k dispozici...",
      link: item.link,
      date: item.pubDate || item.isoDate,
      source: item.sourceName || "AI Hub",
      isAnalyzed: true // Pro aktivaci AI hlasu v Readeru
    }));

    return NextResponse.json(processedItems);
  } catch (err) {
    console.error("Critical API Error:", err);
    return NextResponse.json({ error: "Intelligence Hub is temporarily offline" }, { status: 500 });
  }
}
