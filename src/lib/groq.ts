import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || ""
});

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Jednoduchá in-memory cache pro rychlost
const analysisCache = new Map<string, any>();

export async function generateDeepSummary(title: string, rawContent: string, url?: string) {
  // Kontrola cache podle URL nebo titulku
  const cacheKey = url || title;
  if (analysisCache.has(cacheKey)) {
    console.log("🚀 Returning cached analysis for:", title);
    return analysisCache.get(cacheKey);
  }

  if (!rawContent || rawContent.length < 50) {
    return { title: title, summary: "Obsah článku je příliš krátký pro hloubkovou analýzu." };
  }

  // Zkrácení obsahu pro rychlejší zpracování (LLM nepotřebuje víc pro summary)
  const contentForSummary = rawContent.substring(0, 8000);

    const prompt = `
    Jsi špičkový technologický analytik a futurista. Místo prostého překladu vytvoř HLOUBKOVOU EXPERTNÍ ANALÝZU z dodaného textu.
    
    TITULEK: ${title}
    TEXT: ${contentForSummary}

    Vystup v ČEŠTINĚ jako JSON objekt s klíči:
    1. "title": Úderný český titulek (Cyberpunk/Tech styl).
    2. "summary": 3-5 bleskových bodů podstaty.
    3. "deep_analysis": EXTRÉMNĚ DETAILNÍ rozbor tématu (aspoň 3-4 odstavce). Jdi do hloubky, vysvětli souvislosti, technologie a kontext, které v textu nejsou přímo zmíněny, ale souvisí s ním.
    4. "practical_tips": 3 konkrétní praktické TIPY nebo rady pro čtenáře (jak to využít, na co si dát pozor, co vyzkoušet).
    5. "strategic_insight": Jedna věta o DŮSLEDKU pro budoucnost (The Big Picture).

    Odpovídej POUZE validním JSONem.
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      max_tokens: 4096,
      top_p: 1,
      response_format: { type: "json_object" }
    });

    const responseContent = chatCompletion.choices[0]?.message?.content;
    if (!responseContent) throw new Error("Empty response from Groq");

    const parsed = JSON.parse(responseContent);
    const summaryText = Array.isArray(parsed.summary) ? parsed.summary.join("\n") : (parsed.summary || "Shrnutí nebylo vygenerováno.");

    const result = {
      title: parsed.title || title,
      summary: summaryText,
      strategic_insight: parsed.strategic_insight || null,
      deep_analysis: parsed.deep_analysis || null,
      practical_tips: Array.isArray(parsed.practical_tips) ? parsed.practical_tips : [parsed.practical_tips].filter(Boolean)
    };

    // Uložit do cache
    analysisCache.set(cacheKey, result);
    return result;
  } catch (error: any) {
    console.warn("Groq Deep Summary Error, trying OpenRouter fallback...", error.message);

    if (OPENROUTER_API_KEY) {
      try {
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
            messages: [{ role: "user", content: prompt }],
            max_tokens: 4096,
            temperature: 0.1,
            response_format: { type: "json_object" }
          })
        });

        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        if (!content) throw new Error("Empty response from OpenRouter");

        const parsed = JSON.parse(content);
        const summaryText = Array.isArray(parsed.summary) ? parsed.summary.join("\n") : (parsed.summary || "Shrnutí nebylo vygenerováno.");

        return {
          title: parsed.title || title,
          summary: summaryText,
          strategic_insight: parsed.strategic_insight || null,
          deep_analysis: parsed.deep_analysis || null,
          practical_tips: Array.isArray(parsed.practical_tips) ? parsed.practical_tips : [parsed.practical_tips].filter(Boolean),
          llmSource: "OpenRouter (Fallback)"
        };
      } catch (fallbackError: any) {
        console.error("OpenRouter Fallback also failed:", fallbackError.message);
      }
    }

    return {
      title: title || "Analýza nedostupná",
      summary: "Nepodařilo se vygenerovat AI rozbor. Všechny služby (Groq i OpenRouter) jsou dočasně přetížené.",
      strategic_insight: null,
      deep_analysis: null,
      practical_tips: []
    };
  }
}

/**
 * STREAMING VERZE: Pro okamžitou odezvu v UI.
 * Vrací stream, který klient může číst po částech.
 */
export async function generateStreamingAnalysis(title: string, rawContent: string) {
  const contentForSummary = rawContent.substring(0, 10000);
  
  const prompt = `
    Jsi špičkový technologický analytik a futurista. Vytvoř EXTRÉMNĚ HLOUBKOVOU EXPERTNÍ ANALÝZU.
    Tématem je: ${title}
    Zdrojový text: ${contentForSummary}
    
    STRUKTURA TVÉ ODPOVĚDI (DŮLEŽITÉ):
    1. Začni přímo hloubkovým rozborem o minimálně 4-5 odstavcích. Buď konkrétní, technický a analytický.
    2. Pak přidej sekci [STRATEGIC_INSIGHT] a napiš jednu silnou větu o širším dopadu na budoucnost.
    3. Pak přidej sekci [TIPS] a napiš 3 konkrétní praktické rady pro čtenáře.
    
    Piš výhradně v ČEŠTINĚ. Nepoužívej úvody jako "Zde je analýza". Piš přímo k věci. Cyberpunk/Tech styl.
  `;

  return groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    max_tokens: 4096,
    temperature: 0.5,
    stream: true,
  });
}
