import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

// Konfigurace pro stabilnější JSON výstupy
const generationConfig = {
  temperature: 0.7,
  topK: 1,
  topP: 1,
  maxOutputTokens: 2048,
  responseMimeType: "application/json", // Vynutí JSON na straně API (pokud to model podporuje)
};

// Nastavení, aby se model nezasekával na citlivějších tech tématech
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
});

export async function generateDeepSummary(title: string, rawContent: string) {
  // Ošetření prázdného obsahu
  if (!rawContent || rawContent.length < 50) {
    return { title: title, summary: "Obsah článku je příliš krátký pro hloubkovou analýzu." };
  }

  const prompt = `
    Jsi špičkový technologický analytik a futurista. Tvým úkolem je vytvořit hloubkový, ale bleskově čitelný rozbor z dodaného textu článku.
    
    ORIGINÁLNÍ TITULEK: ${title}
    OBSAH ČLÁNKU: ${rawContent.substring(0, 15000)}

    POŽADAVKY NA VÝSTUP (V ČEŠTINĚ):
    1. "title": Úderný, bulvární ale seriózní český titulek (Cyberpunk/Tech styl).
    2. "summary": 3-5 klíčových bodů (odrážek) vysvětlujících PODSTATU sdělení. Žádná omáčka.
    3. "strategic_insight": Jedna věta o tom, jaký to má DŮSLEDREK pro budoucnost nebo trh (tzv. "The Big Picture").

    ODPOVÍDEJ POUZE ČISTÝM JSON FORMÁTEM, BEZ MARKDOWNU:
    {
      "title": "...",
      "summary": "...",
      "strategic_insight": "..."
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Vysoce agresivní čištění pro případ, že model vrátil markdown bloky nebo jiný šum
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("Raw output from Gemini lacked JSON structure:", text);
      throw new Error("V odpovědi nebyl nalezen platný JSON");
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        title: parsed.title || title,
        summary: parsed.summary || "Shrnutí nebylo vygenerováno.",
        strategic_insight: parsed.strategic_insight || null
      };
    } catch (parseError) {
      console.error("JSON Parse Error on text:", jsonMatch[0]);
      throw parseError;
    }
  } catch (error) {
    console.error("Gemini Deep Summary Error:", error);
    return {
      title: title || "Analýza nedostupná",
      summary: "Nepodařilo se vygenerovat AI rozbor. Důvodem může být ochrana autorských práv na straně zdroje nebo přetížení API. Zkuste to prosím znovu za chvíli.",
      strategic_insight: null
    };
  }
}