import { NextResponse } from "next/server";
import { generateDeepSummary, generateStreamingAnalysis } from "@/lib/groq";
import { scrapeArticle } from "@/lib/scraper";

export async function POST(request: Request) {
  try {
    const { url, title, stream: shouldStream } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "Chybí URL pro analýzu" }, { status: 400 });
    }

    // Scrape article content
    const scrapedData = await scrapeArticle(url);
    const content = scrapedData?.fullContent || "Bez obsahu - analyzujte pouze z titulku.";

    if (shouldStream) {
      console.log(`Streaming Analysis: ${title}`);
      const stream = await generateStreamingAnalysis(title || "", content);
      
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const text = chunk.choices[0]?.delta?.content || "";
              if (text) {
                controller.enqueue(encoder.encode(text));
              }
            }
          } catch (err) {
            console.error("Stream error:", err);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Standard non-streaming analysis (JSON)
    const deepAnalysis = await generateDeepSummary(title || "", content, url);
    
    return NextResponse.json({
      title: deepAnalysis.title || title,
      summary: deepAnalysis.summary || "Analýza proběhla.",
      insight: deepAnalysis.strategic_insight || null,
      deep_analysis: deepAnalysis.deep_analysis || null,
      practical_tips: deepAnalysis.practical_tips || [],
      image: scrapedData?.image || null,
      fullContent: content,
      isAnalyzed: true
    });
  } catch (error) {
    console.error("Chyba při on-demand analýze:", error);
    return NextResponse.json({ error: "Selhala analýza zprávy" }, { status: 500 });
  }
}
