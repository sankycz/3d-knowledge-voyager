import * as cheerio from "cheerio";

interface ScrapedData {
  title: string;
  image?: string;
  leadText: string;
  fullContent?: string;
}

export async function scrapeArticle(url: string): Promise<ScrapedData | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });
    
    if (!response.ok) throw new Error(`Failed to fetch ${url}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);

    // Extrakce OpenGraph metadat
    const ogTitle = $('meta[property="og:title"]').attr("content");
    const ogImage = $('meta[property="og:image"]').attr("content");
    const ogDescription = $('meta[property="og:description"]').attr("content");

    // AGRESIVNÍ DETEKCE TĚLA ČLÁNKU
    const selectors = [
      'article', 'main', '.article-content', '.content', '.post-content', 
      '.entry-content', '#article-body', '#content', '.article__body',
      '.text-content', '.story-body', '.article-text'
    ];
    
    let articleBody = "";
    for (const selector of selectors) {
      const text = $(selector).text().trim();
      if (text.length > 500) { // Hledáme dostatečně dlouhý text
        articleBody = text;
        break;
      }
    }
    
    // Pokud nic nefunguje, vezmeme prostě všechny odstavce (fallback)
    if (!articleBody) {
      articleBody = $('p').map((_, el) => $(el).text()).get().join("\n\n");
    }
    
    // Čištění textu (víceúrovňové pro Gemini i Čtečku)
    const cleanedText = articleBody
      .replace(/\r/g, "")           // Odstranění Carriage Return
      .replace(/[ \t]+/g, " ")       // Oprava vícenásobných mezer/tabulátorů
      .replace(/\n\s*\n/g, "\n\n")  // Zachování čistých mezer mezi odstavci
      .replace(/<[^>]*>?/gm, "")    // Odstranění zbylého HTML tagů
      .trim()
      .substring(0, 20000); // Vyšší limit pro Čtečku

    return {
      title: ogTitle || $("title").text() || "Bez názvu",
      image: ogImage,
      leadText: ogDescription || "",
      fullContent: cleanedText
    };
  } catch (error) {
    console.error(`Scraping error for ${url}:`, error);
    return null;
  }
}
