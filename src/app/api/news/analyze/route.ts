import { NextResponse } from "next/server";
import { generateDeepSummary } from "@/lib/gemini";
import { scrapeArticle } from "@/lib/scraper";

export async function POST(request: Request) {
  try {
    const { url, title } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "Chybí URL pro analýzu" }, { status: 400 });
    }

    // Provede hloubkové scrapování v reálném čase (On-Demand)
    console.log(`Analyzing: ${title} (${url})`);
    const scrapedData = await scrapeArticle(url);
    
    if (!scrapedData?.fullContent || scrapedData.fullContent.length < 200) {
      console.warn(`Extracted content too short (${scrapedData?.fullContent?.length} chars) for ${url}`);
    }

    const deepAnalysis = await generateDeepSummary(
      title || "", 
      scrapedData?.fullContent || "Bez obsahu - analyzujte pouze z titulku."
    );
    
    console.log(`Deep Analysis complete for: ${title}`);

    return NextResponse.json({
      title: deepAnalysis.title || title,
      summary: deepAnalysis.summary || "Analýza proběhla s omezenými daty.",
      insight: deepAnalysis.strategic_insight || null,
      translated_content: deepAnalysis.translated_content || null,
      image: scrapedData?.image || null,
      fullContent: scrapedData?.fullContent || null,
      isAnalyzed: true
    });
  } catch (error) {
    console.error("Chyba při on-demand analýze:", error);
    return NextResponse.json({ error: "Selhala analýza zprávy" }, { status: 500 });
  }
}
