import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "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", // Fallback for build if necessary
});

// Cache for analysis to prevent redundant API calls
const analysisCache = new Map<string, any>();

export async function generateDeepSummary(title: string, rawContent: string) {
  const cacheKey = `${title}_${rawContent.substring(0, 100)}`;
  if (analysisCache.has(cacheKey)) return analysisCache.get(cacheKey);

  const contentForSummary = rawContent.substring(0, 10000);
  
  const prompt = `
    Jsi ELITNÍ ANALYTIK sítě Knowledge Voyager. Tvým úkolem je vytvořit INTELLIGENCE REPORT z následujících surových dat.
    Data jsou v češtině nebo angličtině, ale report musí být VŽDY v ČEŠTINĚ.
    
    Téma: ${title}
    Surová data: ${contentForSummary}
    
    POŽADOVANÁ STRUKTURA (JSON):
    1. "title": Úderný, futuristický název reportu.
    2. "core": HLAVNÍ ANALÝZA - Minimálně 3 rozsáhlé odstavce. Hluboký vhled, žádná vata.
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
    - STRUKTURA: Musíš použít tyto PŘESNÉ TAGY na samostatných řádcích. Nepoužívej markdown nadpisy pro sekce, pouze tyto tagy:
    
    ###_VOYAGER_CORE_###
    Sekce JÁDRO ANALÝZY: Tato sekce MUSÍ být mimořádně rozsáhlá (minimálně 7000 znaků). 
    Zpracuj PŘESNĚ 6 HLUBOKÝCH ODSTAVCŮ, každý s vlastním tematickým zaměřením:
    1. TECHNOLOGICKÁ DEKONSTRUKCE - Co se děje pod povrchem? Inženýrský pohled.
    2. EKONOMICKÁ KORELACE - Finanční toky, tržní dominance a kapitálové směny.
    3. GEOPOLITICKÝ DOPAD - Změny v globální rovnováze moci.
    4. SOCIETÁLNÍ REKONFIGURACE - Dopad na lidstvo, kulturu a každodenní realitu.
    5. ETICKÝ DISKURZ - Morální dilemata, rizika a právní výzvy.
    6. EVOLUČNÍ SYNTÉZA - Jak toto změní civilizaci v horizontu 50 let.
    
    ###_VOYAGER_EXPLORATION_###
    Sekce DETAILNÍ PRŮZKUM: Hloubková informační forenzika. Skrytá fakta a technické detaily, které ostatní přehlížejí. Minimálně 5 odstavců.
    
    ###_VOYAGER_OUTLOOK_###
    Sekce STRATEGICKÝ VÝHLED: Prediktivní modelování budoucnosti. Jaký je konečný cíl a kam se svět posune?
    
    ###_VOYAGER_TIPS_###
    Sekce EXEKUTIVNÍ PROTOKOLY: Minimálně 12 konkrétních, praktických a imperativních akčních bodů (každý začínající symbolem ">").
    
    ###_VOYAGER_END_###
    
    Pamatuj: Žádný úvodní text, žádné "Zde je analýza", žádné markdown nadpisy (## ). Začni ROVNOU tagem ###_VOYAGER_CORE_###. KONEC PROTOKOLU.
  `;

  return groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    max_tokens: 8192,
    temperature: 0.25, // Slightly lower for more rigid adherence to tags
    stream: true,
  });
}
