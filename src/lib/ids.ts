export function stableEncode(input: string): string {
  // Safe for Japanese text; stable and reversible enough for URLs.
  return encodeURIComponent(input);
}

export function stableDecode(input: string): string {
  return decodeURIComponent(input);
}

export function lineKey(company: string, line: string): string {
  return `${company}__${line}`;
}

export function stationKey(company: string, line: string, station: string): string {
  return `${company}__${line}__${station}`;
}

