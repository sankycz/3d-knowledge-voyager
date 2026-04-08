import { NextResponse } from "next/server";
import Parser from "rss-parser";
import Groq from "groq-sdk";
import * as cheerio from "cheerio";

const parser = new Parser();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || "" });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

type LLMResponse = {
  title: string;
  summary: string;
}

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
              summary: item.contentSnippet || item.summary || item.content || "",
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

    // HROMADNÝ PŘEKLAD (Titulky + Shrnutí)
    // Přeložíme pole pro 30 článků. Budeme posílat JSON pole pro stabilitu.
    const itemsToTranslate = paginatedItems.map(it => ({
      originalTitle: it.title,
      originalSummary: (it.summary || "").substring(0, 300) // Omezíme délku pro překlad
    }));

    const systemPrompt = `Jsi profesionální technologický překladatel. Přelož titulky a shrnutí článků do ČEŠTINY.
        - Titulky musí být úderné a atraktivní.
        - Shrnutí musí být plynulé a srozumitelné.
        - Vrať POUZE validní JSON objekt s klíčem "articles", který obsahuje pole objektů: {"articles": [{"title": "...", "summary": "..."}]}`;

    const userPrompt = `Přelož následující články:\n${JSON.stringify(itemsToTranslate)}`;
    
    let translatedData: LLMResponse[] = [];
    let usedModel = "Groq (Llama 3.3 70B)";

    async function callLLM() {
      try {
        // 1. Zkusíme Groq
        const completion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.1,
          response_format: { type: "json_object" }
        });
        
        const content = completion.choices[0]?.message?.content || "[]";
        // Ošetření různých formátů JSON výstupu (někdy vrací {"articles": [...]}, jindy jen [...])
        try {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) return parsed;
          if (parsed.articles && Array.isArray(parsed.articles)) return parsed.articles;
          if (parsed.items && Array.isArray(parsed.items)) return parsed.items;
          if (parsed.translations && Array.isArray(parsed.translations)) return parsed.translations;
          // Pokud je to objekt, ale nenašli jsme pole, zkusíme najít jakékoli pole v objektu
          const firstArray = Object.values(parsed).find(val => Array.isArray(val));
          if (firstArray) return firstArray;
          return [];
        } catch (e) {
          console.error("JSON Parse Error (Groq):", e);
          return [];
        }
      } catch (err: any) {
        console.warn("Groq Error or Rate Limit, switching to OpenRouter:", err.message);
        
        // 2. Fallback na OpenRouter
        if (!OPENROUTER_API_KEY) throw new Error("OpenRouter API key is missing");
        
        usedModel = "OpenRouter (Llama 3.3 70B)";
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://voyager.ai",
            "X-Title": "Voyager News Hub"
          },
          body: JSON.stringify({
            model: "meta-llama/llama-3.3-70b-instruct",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.1,
            response_format: { type: "json_object" }
          })
        });

        const data = await response.json();
        if (data.error) throw new Error(`OpenRouter Error: ${data.error.message}`);
        
        const content = data.choices[0]?.message?.content || "[]";
        try {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) return parsed;
          if (parsed.articles && Array.isArray(parsed.articles)) return parsed.articles;
          if (parsed.items && Array.isArray(parsed.items)) return parsed.items;
          const firstArray = Object.values(parsed).find(val => Array.isArray(val));
          return firstArray || [];
        } catch (e) {
          console.error("JSON Parse Error (OpenRouter):", e);
          return [];
        }
      }
    }

    try {
      translatedData = await callLLM();
    } catch (err) {
      console.error("Všechny překladatelské služby selhaly:", err);
      usedModel = "None (Original English)";
    }

    const processedItems = paginatedItems.map((item: any, index: number) => {
      const translated = translatedData[index];
      return {
        id: offset + index,
        title: (translated?.title && translated.title.length > 5) ? translated.title : item.title,
        summary: (translated?.summary && translated.summary.length > 10) ? translated.summary : (item.summary || "Analýza nedostupná..."),
        link: item.link,
        date: item.pubDate || item.isoDate,
        source: item.sourceName || "AI Hub",
        isAnalyzed: !!translated?.summary,
        llmSource: usedModel
      };
    });

    return NextResponse.json(processedItems);
  } catch (err) {
    console.error("Critical API Error:", err);
    return NextResponse.json({ error: "Intelligence Hub is temporarily offline" }, { status: 500 });
  }
}
