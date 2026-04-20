import fs from "node:fs/promises";
import path from "node:path";
import { lineKey, stableEncode } from "./ids";

export type StationRow = {
  company: string;
  line: string;
  station: string;
  track?: string;
  bound?: string;
  melody: string;
  file: string;
};

export type Usage = {
  company: string;
  line: string;
  station: string;
  track?: string;
  bound?: string;
  melody: string;
  fileRaw: string;
  fileNormalized: string; // e.g. audio/xxx.mp3
  audioUrl: string; // e.g. /audio/xxx.mp3
  lineId: string;
  stationId: string;
  melodyId: string;
};

export type Line = {
  id: string;
  company: string;
  line: string;
  stationIds: string[];
  usages: Usage[];
};

export type Station = {
  id: string;
  station: string;
  usages: Usage[];
};

export type Melody = {
  id: string;
  name: string;
  audioUrls: string[];
  fileNormalizedList: string[];
  usages: Usage[];
};

export type UnusedAudio = {
  fileName: string; // e.g. foo.mp3
  audioUrl: string; // e.g. /audio/foo.mp3
};

export type DataModel = {
  usages: Usage[];
  lines: Line[];
  stations: Station[];
  melodies: Melody[];
  unusedAudio: UnusedAudio[];
  missingAudioFromDisk: string[]; // normalized file paths referenced but not present
};

function normalizeAudioPath(fileRaw: string): string {
  let f = (fileRaw || "").trim();
  if (f.startsWith("/")) f = f.slice(1);
  // Expect "audio/<name>"
  if (!f.startsWith("audio/")) f = `audio/${f.replace(/^public\//, "")}`;
  // Some entries are missing ".mp3"
  if (!path.extname(f)) f = `${f}.mp3`;
  return f;
}

async function listAudioFilesOnDisk(repoRoot: string): Promise<Set<string>> {
  const audioDir = path.join(repoRoot, "audio");
  const set = new Set<string>();
  try {
    const names = await fs.readdir(audioDir);
    for (const name of names) {
      if (!name.toLowerCase().endsWith(".mp3")) continue;
      set.add(name);
    }
  } catch {
    // If no audio dir, treat as empty.
  }
  return set;
}

export async function loadDataModel(repoRoot = process.cwd()): Promise<DataModel> {
  const stationsJsonPath = path.join(repoRoot, "stations.json");
  const raw = await fs.readFile(stationsJsonPath, "utf-8");
  const rows = JSON.parse(raw) as StationRow[];

  const audioOnDisk = await listAudioFilesOnDisk(repoRoot);

  const usages: Usage[] = rows.map((r) => {
    const fileNormalized = normalizeAudioPath(r.file);
    const audioUrl = `/${fileNormalized}`;
    const lid = stableEncode(lineKey(r.company, r.line));
    const sid = stableEncode((r.station || "").trim());
    const melodyName = (r.melody || "").trim();
    const fallbackMelodyName = `[unknown] ${path.basename(fileNormalized, path.extname(fileNormalized))}`;
    const melodySafe = melodyName.length ? melodyName : fallbackMelodyName;
    const mid = stableEncode(melodySafe);
    return {
      company: r.company,
      line: r.line,
      station: r.station,
      track: r.track,
      bound: r.bound,
      melody: melodySafe,
      fileRaw: r.file,
      fileNormalized,
      audioUrl,
      lineId: lid,
      stationId: sid,
      melodyId: mid,
    };
  });

  const lineMap = new Map<string, Line>();
  const stationMap = new Map<string, Station>();
  const melodyMap = new Map<string, Melody>();

  for (const u of usages) {
    const lineId = u.lineId;
    const stationId = u.stationId;
    const melodyId = u.melodyId;

    const lineEntry =
      lineMap.get(lineId) ??
      ({
        id: lineId,
        company: u.company,
        line: u.line,
        stationIds: [],
        usages: [],
      } satisfies Line);
    lineEntry.usages.push(u);
    if (!lineEntry.stationIds.includes(stationId)) lineEntry.stationIds.push(stationId);
    lineMap.set(lineId, lineEntry);

    const stationEntry =
      stationMap.get(stationId) ??
      ({
        id: stationId,
        station: u.station,
        usages: [],
      } satisfies Station);
    stationEntry.usages.push(u);
    stationMap.set(stationId, stationEntry);

    const melodyEntry =
      melodyMap.get(melodyId) ??
      ({
        id: melodyId,
        name: u.melody,
        audioUrls: [],
        fileNormalizedList: [],
        usages: [],
      } satisfies Melody);
    melodyEntry.usages.push(u);
    if (!melodyEntry.audioUrls.includes(u.audioUrl)) melodyEntry.audioUrls.push(u.audioUrl);
    if (!melodyEntry.fileNormalizedList.includes(u.fileNormalized))
      melodyEntry.fileNormalizedList.push(u.fileNormalized);
    melodyMap.set(melodyId, melodyEntry);
  }

  const lines = [...lineMap.values()].sort((a, b) =>
    `${a.company} ${a.line}`.localeCompare(`${b.company} ${b.line}`, "ja"),
  );
  const stations = [...stationMap.values()].sort((a, b) => a.station.localeCompare(b.station, "ja"));
  const melodies = [...melodyMap.values()].sort((a, b) => a.name.localeCompare(b.name, "ja"));

  const referencedAudioFileNames = new Set<string>();
  const referencedNormalizedPaths = new Set<string>();
  for (const u of usages) {
    referencedNormalizedPaths.add(u.fileNormalized);
    referencedAudioFileNames.add(path.basename(u.fileNormalized));
  }

  const unusedAudio: UnusedAudio[] = [];
  for (const fileName of audioOnDisk) {
    if (referencedAudioFileNames.has(fileName)) continue;
    unusedAudio.push({ fileName, audioUrl: `/audio/${fileName}` });
  }
  unusedAudio.sort((a, b) => a.fileName.localeCompare(b.fileName, "ja"));

  const missingAudioFromDisk: string[] = [];
  for (const normalized of referencedNormalizedPaths) {
    const base = path.basename(normalized);
    if (!audioOnDisk.has(base)) missingAudioFromDisk.push(normalized);
  }
  missingAudioFromDisk.sort((a, b) => a.localeCompare(b, "ja"));

  return {
    usages,
    lines,
    stations,
    melodies,
    unusedAudio,
    missingAudioFromDisk,
  };
}

