import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || ""
});

export async function generateDeepSummary(title: string, rawContent: string) {
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
    4. "translated_content": Profesionální ZCELA KOMPLETNÍ překlad celého dodaného těla článku do češtiny.

    ODPOVÍDAJICÍ STRUKTURA MUSÍ BÝT JSON OBJECT OBSAHUJÍCÍ TYTO KLÍČE:
    title, summary, strategic_insight, translated_content
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile", // Groq's fast large model
      max_tokens: 4096,
      top_p: 1,
      response_format: { type: "json_object" }
    });

    const responseContent = chatCompletion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("Empty response from Groq");
    }

    const parsed = JSON.parse(responseContent);
    const summaryText = Array.isArray(parsed.summary) ? parsed.summary.join("\n") : (parsed.summary || "Shrnutí nebylo vygenerováno.");

    return {
      title: parsed.title || title,
      summary: summaryText,
      strategic_insight: parsed.strategic_insight || null,
      translated_content: parsed.translated_content || null
    };
  } catch (error) {
    console.error("Groq Deep Summary Error:", error);
    return {
      title: title || "Analýza nedostupná",
      summary: "Nepodařilo se vygenerovat AI rozbor. API je patrně přetíženo nebo klíč expiruje.",
      strategic_insight: null,
      translated_content: null
    };
  }
}
