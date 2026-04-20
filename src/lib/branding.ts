export function companyLogo(company: string): string | null {
  if (company.includes("JR東日本")) return "/images/jr-east.png";
  if (company.includes("東京メトロ")) return "/images/tokyo-metro.png";
  if (company.includes("都営")) return "/images/toei.svg";
  return null;
}

export function companyBrandColor(company: string): string {
  if (company.includes("JR東日本")) return "#008000"; // JR Green
  if (company.includes("東京メトロ")) return "#0079c2"; // Metro Blue
  if (company.includes("都営")) return "#009b3e"; // Toei Green
  return "#1976d2"; // Default Primary
}

export function getLineLogo(lineName: string): string | null {
  if (!lineName) return null;
  const cleanName = lineName.trim();
  // Based on the file list, these exist as .png
  return `/images/${cleanName}.png`;
}

export function getLineImage(lineName: string): string | null {
  if (!lineName) return null;
  const cleanName = lineName.trim();
  // Based on the file list, these exist as .jpg
  return `/images/${cleanName}.jpg`;
}

export function getStationImage(stationName: string): string | null {
  // Can be expanded if station-specific photos are added
  return null;
}

export function getMelodyImage(melodyName: string): string | null {
  return null;
}

