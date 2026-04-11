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

  // Zkrácení obsahu pro rychlejší zpracování
  const contentForSummary = rawContent.substring(0, 10000);

  const prompt = `
    Jsi VRCHNÍ VELITEL INFORMAČNÍCH OPERACÍ (Supreme Intelligence Commander) sítě Knowledge Voyager.
    Tvým úkolem není psát shrnutí, ale HLOUBKOVÝ INTELLIGENCE REPORT, který proniká pod povrch reality.
    
    TÉMA: ${title}
    ZDROJOVÝ TEXT: ${contentForSummary}

    STRUKTURA (MANDATORNÍ):
    Vystup jako JSON objekt s klíči:
    1. "title": Strategický název operace (česky, úderný, technokratický).
    2. "core": JÁDRO ANALÝZY - Komplexní, nemilosrdně detailní rozbor. MUSÍ OBSAHOVAT PŘESNĚ 5 ROZSOEHLÝCH ODSTAVCŮ. Každý odstavec musí analyzovat jiný aspekt: technický, ekonomický, geopolitický, sociální a futuristický. Minimálně 3000 znaků celkem.
    3. "exploration": DETAILNÍ PRŮZKUM - Informační forenzika. Skrytá fakta, technické specifikace, nevídané souvislosti.
    4. "outlook": STRATEGICKÝ VÝHLED - Prediktivní modelování. Jak toto změní globální rovnováhu sil v horizontu 10 let?
    5. "tips": EXEKUTIVNÍ PROTOKOLY - Minimálně 5 konkrétních akčních bodů v imperativu.

    Odpovídej POUZE validním JSONem v ČEŠTINĚ. Styl: Klinický, precizní, futuristický.
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

    const result = {
      title: parsed.title || title,
      core: parsed.core || parsed.deep_analysis || "",
      exploration: parsed.exploration || "",
      outlook: parsed.outlook || parsed.strategic_insight || "",
      tips: Array.isArray(parsed.tips) ? parsed.tips : (parsed.tips ? [parsed.tips] : [])
    };

    // Uložit do cache
    analysisCache.set(cacheKey, result);
    return result;
  } catch (error: any) {
    console.warn("Groq Deep Summary Error...", error.message);
    return {
      title: title || "ANALÝZA_SELHALA",
      core: "ERROR: NEURÁLNÍ_PROPOJENÍ_PŘERUŠENO. Nepodařilo se vygenerovat intelligence report.",
      exploration: "",
      outlook: "",
      tips: []
    };
  }
}

/**
 * STREAMING VERZE: Pro okamžitou odezvu v UI.
 */
export async function generateStreamingAnalysis(title: string, rawContent: string) {
  const contentForSummary = rawContent.substring(0, 15000);
  
  const prompt = `
    Jsi VRCHNÍ VELITEL INFORMAČNÍCH OPERACÍ sítě Knowledge Voyager. 
    Provádíš HLOUBKOVOU NEURÁLNÍ DEŠIFRACI datového toku. Tvým cílem je absolutní informační dominance.
    
    Téma: ${title}
    Zdroj: ${contentForSummary}
    
    PROTOKOL GENEROVÁNÍ (MANDATORNÍ):
    - JAZYK: Výhradně klinická čeština (technokratický, futuristický styl).
    - STRUKTURA: Musíš použít tyto přesné tagy na začátku každé sekce. Každý tag musí být na samostatném řádku!
    
    @@@CORE@@@
    Sekce JÁDRO ANALÝZY: Musí obsahovat PŘESNĚ 5 ROZSÁHLÝCH ODSTAVCŮ. Každý odstavec (cca 800-1000 znaků) se musí věnovat jedné doméně v tomto pořadí:
    1. TECHNOLOGICKÁ SINGULARITA
    2. EKONOMICKÁ DISRUPCE
    3. GEOPOLITICKÉ PŘESUNY
    4. SOCIETÁLNÍ REKONFIGURACE
    5. EXISTENCIÁLNÍ SYNTÉZA (Dopad na evoluční horizont lidstva)
    
    @@@EXPLORATION@@@
    Sekce DETAILNÍ PRŮZKUM: Hloubková forenzní analýza. Hledej skryté vzorce, technické nuance a souvislosti. Minimálně 2-3 rozsáhlé odstavce.
    
    @@@OUTLOOK@@@
    Sekce STRATEGICKÝ VÝHLED: Prediktivní modelování budoucnosti (horizont 2, 5 a 10 let). Ucelený text, žádné odrážky.
    
    @@@TIPS@@@
    Sekce EXEKUTIVNÍ PROTOKOLY: Minimálně 8 konkrétních akčních bodů (každý na nový řádek začínající pomlčkou "-").
    
    KONEC PROTOKOLU.
  `;

  return groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    max_tokens: 8000,
    temperature: 0.4,
    stream: true,
  });
}
