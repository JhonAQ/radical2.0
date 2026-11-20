#!/usr/bin/env node
/**
 * Genera utils/blur-placeholders.ts: una miniatura borrosa (~300 bytes) de cada
 * foto, que se muestra mientras carga la imagen real.
 *
 *   node scripts/generate-blur-placeholders.mjs
 *
 * Volver a ejecutarlo si se agregan o cambian fotos en las carpetas de abajo.
 */
import { readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const sharp = createRequire(createRequire(import.meta.url).resolve("next/package.json"))("sharp");
const root = new URL("../public", import.meta.url).pathname;
const folders = ["assets/activities", "assets/location"];
const photo = /\.(jpe?g|webp)$/i;
// Solo fotos opacas; los recortes y pinceladas con transparencia no llevan desenfoque.
const skip = /brush|leaf|title|arrow/i;

const entries = [];
for (const folder of folders) {
  for (const file of readdirSync(join(root, folder)).sort()) {
    if (!photo.test(file) || skip.test(file)) continue;
    const buffer = await sharp(join(root, folder, file)).resize(16, 16, { fit: "inside" }).webp({ quality: 40 }).toBuffer();
    entries.push([`/${folder}/${file}`, `data:image/webp;base64,${buffer.toString("base64")}`]);
  }
}

const body = entries.map(([src, data]) => `  ${JSON.stringify(src)}: ${JSON.stringify(data)},`).join("\n");
writeFileSync(
  new URL("../utils/blur-placeholders.ts", import.meta.url),
  `// Generado por scripts/generate-blur-placeholders.mjs. No editar a mano.\nconst placeholders: Record<string, string> = {\n${body}\n};\n\n/** Props de next/image para mostrar una versión borrosa mientras carga la foto. */\nexport function blurProps(src: string) {\n  const blurDataURL = placeholders[src];\n  return blurDataURL ? ({ placeholder: "blur", blurDataURL } as const) : {};\n}\n`,
);
console.log(`${entries.length} fotos con placeholder.`);
