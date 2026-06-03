// One-off check: confirms the Gemini key in .env.local is present AND valid by
// making a tiny real API call. Prints only the key length/prefix, never the key.
import { readFileSync } from "fs";
import { GoogleGenAI } from "@google/genai";

let key = "";
try {
  const env = readFileSync(".env.local", "utf8");
  const m = env.match(/^\s*GEMINI_API_KEY\s*=\s*(.+?)\s*$/m);
  key = m ? m[1].trim().replace(/^['"]|['"]$/g, "") : "";
} catch {
  console.log("No pude leer .env.local");
  process.exit(1);
}

if (!key) {
  console.log("❌ .env.local no tiene GEMINI_API_KEY");
  process.exit(1);
}
console.log(`Key detectada: len=${key.length}, prefijo=${key.slice(0, 4)}`);

const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const ai = new GoogleGenAI({ apiKey: key });
try {
  const res = await ai.models.generateContent({
    model,
    contents: "Respondé únicamente con la palabra: OK",
  });
  console.log(`Gemini (${model}) respondió: ${JSON.stringify((res.text || "").trim().slice(0, 40))}`);
  console.log("✅ KEY VÁLIDA — Gemini está funcionando end-to-end");
} catch (e) {
  console.log("❌ Error llamando a Gemini:", String(e?.message ?? e).slice(0, 240));
}
