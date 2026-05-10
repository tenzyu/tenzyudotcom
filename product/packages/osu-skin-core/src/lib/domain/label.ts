const labelOverrides: Record<string, string> = {
  catch: "Catch",
  hd: "HD",
  hp: "HP",
  hud: "HUD",
  ini: "INI",
  json: "JSON",
  kiai: "Kiai",
  mania: "Mania",
  osu: "osu!",
  pp: "PP",
  rpm: "RPM",
  sd: "SD",
  std: "osu!standard",
  taiko: "Taiko",
  ui: "UI",
};

export function titleizeIdentifier(value: string): string {
  const normalized = value
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[_/]+/g, "-")
    .toLowerCase();

  if (labelOverrides[normalized]) return labelOverrides[normalized];

  return normalized
    .split("-")
    .filter(Boolean)
    .map((part) => labelOverrides[part] ?? part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

