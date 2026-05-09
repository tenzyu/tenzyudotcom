import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { errorJson } from "../../../../lib/server/http";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

async function tryPicker(command: string, args: string[]): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(command, args);
    const selected = stdout.trim().split("\n")[0]?.trim();
    return selected || null;
  } catch {
    return null;
  }
}

export async function POST() {
  try {
    const zenity = await tryPicker("zenity", [
      "--file-selection",
      "--title=Choose osu! skin .osk or folder",
      "--filename=.",
    ]);

    if (zenity) {
      return NextResponse.json({ path: zenity });
    }

    const kdialog = await tryPicker("kdialog", [
      "--getopenfilename",
      ".",
      "*.osk|osu! skin archive (*.osk)\n*|All files",
    ]);

    return NextResponse.json({ path: kdialog });
  } catch (error) {
    return errorJson(error);
  }
}
