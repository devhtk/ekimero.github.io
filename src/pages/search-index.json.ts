import type { APIRoute } from "astro";
import { loadDataModel } from "../lib/data";

export const prerender = true;

export const GET: APIRoute = async () => {
  const data = await loadDataModel();

  const payload = {
    generatedAt: new Date().toISOString(),
    lines: data.lines.map((l) => ({
      id: l.id,
      company: l.company,
      line: l.line,
      text: `${l.company} ${l.line}`,
      stationCount: l.stationIds.length,
    })),
    stations: data.stations.map((s) => ({
      id: s.id,
      company: [...new Set(s.usages.map((u) => u.company))][0] ?? "",
      line: [...new Set(s.usages.map((u) => u.line))][0] ?? "",
      station: s.station,
      text: `${s.station} ${[...new Set(s.usages.map((u) => u.line))].join(" ")} ${[...new Set(s.usages.map((u) => u.company))].join(" ")}`,
      useCount: s.usages.length,
    })),
    melodies: data.melodies.map((m) => ({
      id: m.id,
      name: m.name,
      text: m.name,
      useCount: m.usages.length,
      audioUrl: m.audioUrls[0] ?? null,
    })),
  };

  return new Response(JSON.stringify(payload), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
};

