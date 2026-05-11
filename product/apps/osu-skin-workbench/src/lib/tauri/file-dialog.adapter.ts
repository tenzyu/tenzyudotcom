import { open } from "@tauri-apps/plugin-dialog";

export async function chooseSkinFilePath(): Promise<string | null> {
  const selected = await open({
    title: "Choose osu! skin .osk or extracted skin folder",
    directory: false,
    multiple: false,
    filters: [
      { name: "osu! skin", extensions: ["osk"] },
      { name: "All files", extensions: ["*"] },
    ],
  });

  if (Array.isArray(selected)) return selected[0] ?? null;
  return selected ?? null;
}

export async function chooseSkinFolderPath(): Promise<string | null> {
  const selected = await open({
    title: "Choose extracted osu! skin folder",
    directory: true,
    multiple: false,
  });

  if (Array.isArray(selected)) return selected[0] ?? null;
  return selected ?? null;
}
