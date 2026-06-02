// Generates PWA PNG icons from public/icon.svg.
// One-off tool — the generated icons are already committed in public/.
// Only needed to regenerate them. Requires sharp:
//   npm i -D sharp && node scripts/gen-icons.mjs
import { readFileSync } from "fs";
import sharp from "sharp";

const svg = readFileSync("public/icon.svg");

await sharp(svg).resize(192, 192).png().toFile("public/icon-192.png");
await sharp(svg).resize(512, 512).png().toFile("public/icon-512.png");

// Maskable: full-bleed background with the icon inside the safe zone (~80%).
const inner = await sharp(svg).resize(410, 410).png().toBuffer();
await sharp({
  create: { width: 512, height: 512, channels: 4, background: "#0f3d2e" },
})
  .composite([{ input: inner, gravity: "center" }])
  .png()
  .toFile("public/icon-maskable-512.png");

console.log("Icons generated: icon-192.png, icon-512.png, icon-maskable-512.png");
