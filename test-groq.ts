import { generateDeepSummary } from "./src/lib/groq";

async function run() {
  console.log("Testing Groq...");
  try {
    const res = await generateDeepSummary("Test Title", "Here is some large body of text about AI that is sufficiently long so it doesn't get rejected ".repeat(20));
    console.log(res);
  } catch (e) {
    console.error("Test failed", e);
  }
}
run();
