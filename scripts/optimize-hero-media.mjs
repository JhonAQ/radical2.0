// Run: node scripts/optimize-hero-media.mjs
// --finalize only fingerprints files already encoded in the output folder.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const output = "public/assets/hero/video";
const variants = [
  { name: "mobile", input: "tmp/vid/la.mp4", width: 720, height: 1280 },
  { name: "desktop", input: "tmp/vid/Waves_crashing_on_sandy_shore_5a5d0106_1080p.mp4", width: 1280, height: 720 },
];
mkdirSync(output, { recursive: true });
const manifest = {};
for (const { name, input, width, height } of variants) {
  const base = join(output, `hero-${name}`);
  if (!process.argv.includes("--finalize")) {
    const loopTemp = mkdtempSync(join(tmpdir(), "radical-hero-loop-"));
    const loopInput = join(loopTemp, "loop.mkv");
    const frameCount = Number(execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-count_frames", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", input], { encoding: "utf8" }).trim());
    const overlap = 18; // 750 ms at 24 fps, with an exact final head frame.
    if (!Number.isFinite(frameCount) || frameCount <= overlap * 2) throw new Error(`Video too short: ${input}`);
    const tailStart = frameCount - overlap;
    const filter = `[0:v]fps=24,scale=${width}:${height}:flags=lanczos,split=3[body][tail][head];[body]trim=start_frame=${overlap}:end_frame=${tailStart},setpts=PTS-STARTPTS[b];[tail]trim=start_frame=${tailStart}:end_frame=${frameCount},setpts=PTS-STARTPTS[t];[head]trim=start_frame=0:end_frame=${overlap},setpts=PTS-STARTPTS[h];[t][h]blend=all_expr='A*(1-min(1,T/${(overlap - 1) / 24}))+B*min(1,T/${(overlap - 1) / 24})'[fade];[b][fade]concat=n=2:v=1:a=0,format=yuv420p[loop]`;
    execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", input, "-filter_complex", filter, "-map", "[loop]", "-an", "-c:v", "ffv1", "-threads", "2", "-y", loopInput], { stdio: "inherit" });
    const video = ["-hide_banner", "-loglevel", "error", "-i", loopInput, "-map", "0:v:0", "-an", "-sn", "-dn", "-r", "24", "-threads", "2", "-map_metadata", "-1"];
    execFileSync("ffmpeg", [...video, "-c:v", "libx264", "-preset", "slow", "-crf", "28", "-maxrate", "1500k", "-bufsize", "3000k", "-profile:v", "high", "-level:v", "3.1", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-y", `${base}.mp4`], { stdio: "inherit" });
    const temp = mkdtempSync(join(tmpdir(), "radical-hero-vp9-"));
    try {
      const vp9 = [...video, "-c:v", "libvpx-vp9", "-b:v", "1000k", "-row-mt", "1", "-deadline", "good", "-pix_fmt", "yuv420p", "-passlogfile", join(temp, "pass")];
      execFileSync("ffmpeg", [...vp9, "-pass", "1", "-cpu-used", "4", "-f", "null", "-"], { stdio: "inherit" });
      execFileSync("ffmpeg", [...vp9, "-pass", "2", "-cpu-used", "2", "-y", `${base}.webm`], { stdio: "inherit" });
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
    execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", loopInput, "-frames:v", "1", "-c:v", "libwebp", "-quality", "78", "-compression_level", "6", "-map_metadata", "-1", "-threads", "2", "-y", `${base}.webp`], { stdio: "inherit" });
    rmSync(loopTemp, { recursive: true, force: true });
  }
  const media = { width, height };
  for (const [key, extension] of [["poster", "webp"], ["webm", "webm"], ["mp4", "mp4"]]) {
    const file = `${base}.${extension}`;
    const bytes = readFileSync(file);
    const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
    const filename = `hero-${name}-${hash}.${extension}`;
    renameSync(file, join(output, filename));
    media[key] = `/assets/hero/video/${filename}`;
    console.log(`${name} ${extension}: ${(bytes.length / 1024).toFixed(0)} KiB`);
  }
  manifest[name] = media;
}
writeFileSync("components/hero/hero-media.json", JSON.stringify(manifest, null, 2) + "\n");
