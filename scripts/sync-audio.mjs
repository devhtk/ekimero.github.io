import { cp, mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const audioSrcDir = path.join(repoRoot, "audio");
const audioDestDir = path.join(repoRoot, "public", "audio");
const imageSrcDir = path.join(repoRoot, "images");
const imageDestDir = path.join(repoRoot, "public", "images");

async function existsDir(p) {
  try {
    const s = await stat(p);
    return s.isDirectory();
  } catch {
    return false;
  }
}

async function copyFlat(srcDir, destDir, label) {
  const hasSrc = await existsDir(srcDir);
  if (!hasSrc) {
    console.log(`[sync] no ./${label} directory; skipping`);
    return 0;
  }

  await mkdir(destDir, { recursive: true });
  const entries = await readdir(srcDir);
  await Promise.all(
    entries.map(async (name) => {
      const from = path.join(srcDir, name);
      const to = path.join(destDir, name);
      const s = await stat(from);
      if (!s.isFile()) return;
      await cp(from, to, { force: false, errorOnExist: false });
    }),
  );
  return entries.length;
}

async function main() {
  const audioCount = await copyFlat(audioSrcDir, audioDestDir, "audio");
  const imageCount = await copyFlat(imageSrcDir, imageDestDir, "images");
  console.log(`[sync] ensured public/audio (${audioCount}) and public/images (${imageCount})`);
}

main().catch((err) => {
  console.error("[sync-audio] failed", err);
  process.exit(1);
});

