export function label(value: string): string {
  return (value || "")
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds || 0));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

export function basename(path: string): string {
  return path.split(/[\\/]/).pop() || path;
}
